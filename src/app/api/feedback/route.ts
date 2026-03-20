import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { sendAdminFeedbackNotification } from '@/lib/email';

const checkRateLimit = createRateLimiter(3, 60_000, 'feedback');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const message = String(body.message || '').trim().slice(0, 2000);
    const email = body.email ? String(body.email).trim().toLowerCase().slice(0, 320) : '';
    const name = body.name ? String(body.name).trim().slice(0, 100) : '';
    const page = body.page ? String(body.page).slice(0, 200) : 'unknown';

    if (!message || message.length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters' }, { status: 400 });
    }

    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await sendAdminFeedbackNotification(email, name, message, page);

    return NextResponse.json({ success: true, message: 'Feedback sent! Thank you.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
  }
}
