import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { createRateLimiter } from '@/lib/rate-limit';
import { PLANS, type PlanId } from '@/lib/billing-plans';
import { authorizeForOrg } from '@/lib/auth';

const checkRateLimit = createRateLimiter(5, 60_000);

// POST /api/billing/checkout — create Stripe Checkout session
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await request.json();
  const { orgId, planId, billing } = body as {
    orgId: string;
    planId: PlanId;
    billing: 'monthly' | 'yearly';
  };

  if (!orgId || !planId || !billing) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Auth: verify requesting user belongs to this org
  const user = await authorizeForOrg(orgId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = PLANS[planId];
  if (!plan || plan.id === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const priceId = billing === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId;
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  // Fetch org to get or create Stripe customer
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, stripe_customer_id, owner_id')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Get owner email for Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', org.owner_id)
    .single();

  let customerId = org.stripe_customer_id;

  // Create Stripe customer if needed
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: profile?.email || undefined,
      metadata: { org_id: org.id },
    });
    customerId = customer.id;

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org.id);

    if (updateError) {
      console.error('[checkout] Failed to save Stripe customer ID:', updateError);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings?tab=billing`,
    metadata: { org_id: org.id, plan_id: planId },
    subscription_data: {
      metadata: { org_id: org.id, plan_id: planId },
    },
  });

  return NextResponse.json({ url: session.url });
}
