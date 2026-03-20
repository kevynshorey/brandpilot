import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { PLANS, type PlanId } from '@/lib/billing-plans';
import { sendPaymentConfirmation, sendPaymentFailedEmail } from '@/lib/email';
import type Stripe from 'stripe';

// Stripe sends raw body — must read as text for signature verification
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  // Idempotency guard: check if we've already processed this event
  const { data: existingEvent } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    // Already processed — return 200 so Stripe doesn't retry
    return NextResponse.json({ received: true, deduplicated: true });
  }

  // Record the event before processing (prevents concurrent duplicates)
  const { error: insertError } = await supabase
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, event_type: event.type, processed_at: new Date().toISOString() });

  if (insertError) {
    // If insert fails due to unique constraint, another instance is already processing
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, deduplicated: true });
    }
    console.error('[webhook] Failed to record event:', insertError);
    // Continue processing anyway — idempotency is best-effort
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const planId = (session.metadata?.plan_id || 'starter') as PlanId;
        const plan = PLANS[planId];

        if (!orgId) {
          console.error('[webhook] checkout.session.completed missing org_id in metadata');
          break;
        }

        if (!plan) {
          console.error(`[webhook] Unknown plan ID: ${planId}`);
          break;
        }

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            plan: planId,
            stripe_subscription_id: typeof session.subscription === 'string'
              ? session.subscription
              : (session.subscription as Stripe.Subscription)?.id || null,
            max_workspaces: plan.limits.maxWorkspaces,
            max_posts_per_month: plan.limits.maxPostsPerMonth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);

        if (updateError) {
          console.error('[webhook] Failed to update org plan:', updateError);
          // Return 500 so Stripe retries
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // Send payment confirmation email (fire-and-forget)
        if (process.env.RESEND_API_KEY && session.customer_email) {
          const billing = session.metadata?.billing as 'monthly' | 'yearly' || 'monthly';
          const price = billing === 'yearly' ? plan.yearlyPrice : plan.price;
          sendPaymentConfirmation(
            session.customer_email,
            plan.name,
            `$${price}/mo`,
            billing,
          ).catch((err) => console.error('[webhook] Payment email failed:', err));
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;

        if (!orgId) {
          console.error('[webhook] subscription.updated missing org_id in metadata');
          break;
        }

        const planId = (subscription.metadata?.plan_id || 'starter') as PlanId;
        const plan = PLANS[planId] || PLANS.free;
        const isActive = ['active', 'trialing'].includes(subscription.status);

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            plan: isActive ? planId : 'free',
            stripe_subscription_id: subscription.id,
            max_workspaces: isActive ? plan.limits.maxWorkspaces : PLANS.free.limits.maxWorkspaces,
            max_posts_per_month: isActive ? plan.limits.maxPostsPerMonth : PLANS.free.limits.maxPostsPerMonth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);

        if (updateError) {
          console.error('[webhook] Failed to update subscription:', updateError);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;

        if (!orgId) {
          console.error('[webhook] subscription.deleted missing org_id in metadata');
          break;
        }

        // Downgrade to free
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            max_workspaces: PLANS.free.limits.maxWorkspaces,
            max_posts_per_month: PLANS.free.limits.maxPostsPerMonth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);

        if (updateError) {
          console.error('[webhook] Failed to downgrade org:', updateError);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : (invoice.customer as Stripe.Customer)?.id;

        if (!customerId) {
          console.error('[webhook] invoice.payment_failed missing customer ID');
          break;
        }

        console.error(`[billing] Payment failed for customer ${customerId}`);

        // Send payment failed email
        if (process.env.RESEND_API_KEY) {
          const { data: org } = await supabase
            .from('organizations')
            .select('owner_id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (org?.owner_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', org.owner_id)
              .single();

            if (profile?.email) {
              sendPaymentFailedEmail(profile.email).catch((err) =>
                console.error('[webhook] Failed payment email error:', err),
              );
            }
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
