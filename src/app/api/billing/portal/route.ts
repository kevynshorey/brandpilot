import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { createRateLimiter } from '@/lib/rate-limit';
import { authorizeForOrg } from '@/lib/auth';

const checkRateLimit = createRateLimiter(5, 60_000);

// POST /api/billing/portal — redirect to Stripe Customer Portal
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

  const { orgId } = (await request.json()) as { orgId: string };
  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  // Auth: verify requesting user belongs to this org
  const user = await authorizeForOrg(orgId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgId)
    .single();

  if (orgError || !org?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl}/settings?tab=billing`,
  });

  return NextResponse.json({ url: session.url });
}
