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
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id;
      const planId = (session.metadata?.plan_id || 'starter') as PlanId;
      const plan = PLANS[planId];

      if (orgId && plan) {
        await supabase
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

        // Send payment confirmation email
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
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;

      if (orgId) {
        const planId = (subscription.metadata?.plan_id || 'starter') as PlanId;
        const plan = PLANS[planId];
        const isActive = ['active', 'trialing'].includes(subscription.status);

        await supabase
          .from('organizations')
          .update({
            plan: isActive ? planId : 'free',
            stripe_subscription_id: subscription.id,
            max_workspaces: isActive ? plan.limits.maxWorkspaces : PLANS.free.limits.maxWorkspaces,
            max_posts_per_month: isActive ? plan.limits.maxPostsPerMonth : PLANS.free.limits.maxPostsPerMonth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;

      if (orgId) {
        // Downgrade to free
        await supabase
          .from('organizations')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            max_workspaces: PLANS.free.limits.maxWorkspaces,
            max_posts_per_month: PLANS.free.limits.maxPostsPerMonth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : (invoice.customer as Stripe.Customer)?.id;

      if (customerId) {
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
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
