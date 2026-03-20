import { createHmac } from 'crypto';

function getPreviewSecret(): string {
  const secret = process.env.PREVIEW_TOKEN_SECRET;
  if (!secret) {
    throw new Error('PREVIEW_TOKEN_SECRET environment variable is required');
  }
  return secret;
}
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a signed preview token for a blog post.
 * Token format: <postId>.<expiresAt>.<signature>
 */
export function generatePreviewToken(postId: string): string {
  const expiresAt = Date.now() + EXPIRY_MS;
  const payload = `${postId}.${expiresAt}`;
  const signature = createHmac('sha256', getPreviewSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 16); // short signature is fine for preview URLs
  return `${payload}.${signature}`;
}

/**
 * Verify a preview token. Returns the postId if valid, null if expired/invalid.
 */
export function verifyPreviewToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [postId, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  // Check expiry
  if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

  // Verify signature
  const payload = `${postId}.${expiresAtStr}`;
  const expected = createHmac('sha256', getPreviewSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 16);

  if (signature !== expected) return null;

  return postId;
}
