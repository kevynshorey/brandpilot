import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rate-limit';
import { sendWaitlistConfirmation } from '@/lib/email';

const checkRateLimit = createRateLimiter(5, 60_000, 'waitlist');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase().slice(0, 320);
    const source = String(body.source || 'landing').slice(0, 50);
    const referrer = body.referrer ? String(body.referrer).slice(0, 500) : null;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase
      .from('waitlist')
      .insert({ email, source, referrer });

    if (error) {
      // Unique constraint violation = already signed up (that's fine)
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: "You're already on the list!" });
      }
      console.error('[waitlist] Insert error:', error);
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

    // Send confirmation email (best-effort, don't fail the request)
    try {
      await sendWaitlistConfirmation(email);
    } catch (emailErr) {
      console.error('[waitlist] Confirmation email failed:', emailErr);
    }

    return NextResponse.json({ success: true, message: "You're in! Check your email." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
