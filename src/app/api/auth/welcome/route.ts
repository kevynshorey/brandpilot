import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

const checkRateLimit = createRateLimiter(5, 60_000);

// POST /api/auth/welcome — Send welcome email after signup
// Called once by the signup page after successful account creation
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Skip if Resend is not configured (dev environments)
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ sent: false, reason: 'Email not configured' });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    await sendWelcomeEmail(user.email, name);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[welcome-email] Failed:', err);
    return NextResponse.json({ sent: false, reason: 'Send failed' });
  }
}
