import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'BrandPilot <noreply@brandpilots.io>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
  if (error) {
    console.error('[email] Send failed:', error);
    throw error;
  }
}

// --- Email wrapper (with styled template) ---

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:24px;font-weight:bold;color:#fff;">Brand<span style="color:#f59e0b;">Pilot</span></span>
  </div>
  <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px;">
    ${content}
  </div>
  <div style="text-align:center;margin-top:24px;">
    <p style="color:#71717a;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} BrandPilot. All rights reserved.</p>
    <p style="color:#52525b;font-size:11px;margin:8px 0 0;">
      <a href="https://brandpilots.io" style="color:#52525b;text-decoration:none;">brandpilots.io</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

// --- Specific email types ---

export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandpilots.io';
  await sendEmail({
    to,
    subject: 'Welcome to BrandPilot!',
    html: wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Welcome aboard, ${name}!</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        You're all set to manage your brands from one dashboard. Here's how to get started:
      </p>
      <ol style="color:#a1a1aa;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Set up your <strong style="color:#d4d4d8;">brand guidelines</strong> (tone, topics, style)</li>
        <li>Connect your <strong style="color:#d4d4d8;">social accounts</strong></li>
        <li>Create your first <strong style="color:#d4d4d8;">AI-powered post</strong></li>
      </ol>
      <div style="text-align:center;">
        <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#18181b;border-radius:8px;font-weight:bold;font-size:14px;text-decoration:none;">
          Go to Dashboard
        </a>
      </div>
    `),
  });
}

export async function sendPaymentConfirmation(
  to: string,
  planName: string,
  amount: string,
  billing: 'monthly' | 'yearly',
) {
  await sendEmail({
    to,
    subject: `Payment confirmed — ${planName} plan`,
    html: wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Payment confirmed</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Your subscription to the <strong style="color:#f59e0b;">${planName}</strong> plan is now active.
      </p>
      <div style="background:#27272a;border-radius:8px;padding:16px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">Plan</td>
            <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${planName}</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">Amount</td>
            <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${amount}</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">Billing</td>
            <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${billing === 'yearly' ? 'Annual' : 'Monthly'}</td>
          </tr>
        </table>
      </div>
      <p style="color:#71717a;font-size:12px;margin:0;">
        Manage your subscription anytime from Settings &rarr; Billing.
      </p>
    `),
  });
}

export async function sendUsageLimitWarning(
  to: string,
  resourceType: string,
  used: number,
  limit: number,
  planName: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandpilots.io';
  const pct = Math.round((used / limit) * 100);
  await sendEmail({
    to,
    subject: `You've used ${pct}% of your ${resourceType} limit`,
    html: wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Usage alert</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        You've used <strong style="color:#f59e0b;">${used} of ${limit}</strong> ${resourceType} on your ${planName} plan this month.
      </p>
      <div style="background:#27272a;border-radius:8px;padding:4px;margin:0 0 20px;">
        <div style="background:#f59e0b;border-radius:6px;height:8px;width:${Math.min(100, pct)}%;"></div>
      </div>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 20px;">
        Upgrade your plan to get more capacity and unlock additional features.
      </p>
      <div style="text-align:center;">
        <a href="${appUrl}/settings?tab=billing" style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#18181b;border-radius:8px;font-weight:bold;font-size:14px;text-decoration:none;">
          Upgrade Plan
        </a>
      </div>
    `),
  });
}

export async function sendWaitlistConfirmation(to: string) {
  await sendEmail({
    to,
    subject: "You're on the BrandPilot waitlist!",
    html: wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">You're on the list!</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Thanks for your interest in BrandPilot. We're building the AI-powered social media management platform
        that lets you run every brand from one dashboard.
      </p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        We'll notify you as soon as early access opens. In the meantime, here's what to expect:
      </p>
      <ul style="color:#a1a1aa;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li><strong style="color:#d4d4d8;">AI content generation</strong> — captions, hashtags, and full blog posts in your brand voice</li>
        <li><strong style="color:#d4d4d8;">6-platform scheduling</strong> — Instagram, Facebook, LinkedIn, X, Pinterest, TikTok</li>
        <li><strong style="color:#d4d4d8;">Multi-brand workspaces</strong> — one dashboard for all your brands</li>
      </ul>
      <p style="color:#71717a;font-size:12px;margin:0;">
        You're receiving this because you signed up at brandpilots.io.
      </p>
    `),
  });
}

// --- Admin notifications ---

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kevynshorey@gmail.com';

export async function sendAdminWaitlistNotification(email: string, source: string) {
  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚀 New waitlist signup: ${email}`,
      html: wrap(`
        <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">New Waitlist Signup</h2>
        <div style="background:#27272a;border-radius:8px;padding:16px;margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#71717a;font-size:13px;padding:4px 0;">Email</td>
              <td style="color:#f59e0b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${email}</td>
            </tr>
            <tr>
              <td style="color:#71717a;font-size:13px;padding:4px 0;">Source</td>
              <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${source}</td>
            </tr>
            <tr>
              <td style="color:#71717a;font-size:13px;padding:4px 0;">Time</td>
              <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${new Date().toISOString()}</td>
            </tr>
          </table>
        </div>
      `),
    });
  } catch (err) {
    console.error('[email] Admin waitlist notification failed:', err);
  }
}

export async function sendAdminSignupNotification(email: string, name: string) {
  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🎉 New account created: ${name}`,
      html: wrap(`
        <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">New Account Created</h2>
        <div style="background:#27272a;border-radius:8px;padding:16px;margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#71717a;font-size:13px;padding:4px 0;">Name</td>
              <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${name}</td>
            </tr>
            <tr>
              <td style="color:#71717a;font-size:13px;padding:4px 0;">Email</td>
              <td style="color:#f59e0b;font-size:13px;padding:4px 0;text-align:right;">${email}</td>
            </tr>
            <tr>
              <td style="color:#71717a;font-size:13px;padding:4px 0;">Time</td>
              <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${new Date().toISOString()}</td>
            </tr>
          </table>
        </div>
        <p style="color:#a1a1aa;font-size:13px;margin:0;">
          This user has been onboarded into BrandPilot and should now have a workspace.
        </p>
      `),
    });
  } catch (err) {
    console.error('[email] Admin signup notification failed:', err);
  }
}

export async function sendAdminFeedbackNotification(
  senderEmail: string,
  senderName: string,
  message: string,
  page: string,
) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `💬 Feedback from ${senderName || senderEmail}`,
    html: wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Customer Feedback</h2>
      <div style="background:#27272a;border-radius:8px;padding:16px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">From</td>
            <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${senderName || 'Anonymous'}</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">Email</td>
            <td style="color:#f59e0b;font-size:13px;padding:4px 0;text-align:right;">${senderEmail || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">Page</td>
            <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${page}</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:4px 0;">Time</td>
            <td style="color:#d4d4d8;font-size:13px;padding:4px 0;text-align:right;">${new Date().toISOString()}</td>
          </tr>
        </table>
      </div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px;">
        <p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${message}</p>
      </div>
    `),
  });
}

export async function sendPaymentFailedEmail(to: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandpilots.io';
  await sendEmail({
    to,
    subject: 'Payment failed — action required',
    html: wrap(`
      <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Payment failed</h2>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">
        We were unable to process your latest payment. Please update your payment method to avoid any interruption to your service.
      </p>
      <div style="text-align:center;">
        <a href="${appUrl}/settings?tab=billing" style="display:inline-block;padding:12px 28px;background:#ef4444;color:#fff;border-radius:8px;font-weight:bold;font-size:14px;text-decoration:none;">
          Update Payment Method
        </a>
      </div>
    `),
  });
}
