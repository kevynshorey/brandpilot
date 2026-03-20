import { NextRequest, NextResponse } from 'next/server';
import { isAllowedUrl, scrapeUrl } from '@/lib/scraper';

// --- Rate limiting (in-memory, per-IP, sliding window) ---

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;       // 5 requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Lazy cleanup: prune stale entries when map grows large
function pruneStaleEntries() {
  if (rateLimitMap.size < 100) return;
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

// --- Input sanitization ---

function sanitizeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/\0/g, '')       // strip null bytes
    .trim()
    .slice(0, 2048);          // max URL length

  if (!trimmed) return null;
  return trimmed;
}

// --- POST handler ---

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  pruneStaleEntries();

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const url = sanitizeUrl(body.url);

  if (!url) {
    return NextResponse.json(
      { error: 'Missing or invalid "url" field' },
      { status: 400 },
    );
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: 'Only http and https URLs are allowed' },
      { status: 400 },
    );
  }

  // Block common injection patterns in URLs
  if (/javascript:/i.test(url) || /data:/i.test(url)) {
    return NextResponse.json(
      { error: 'Disallowed URL scheme' },
      { status: 400 },
    );
  }

  try {
    const data = await scrapeUrl(url);
    return NextResponse.json({ data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown scraping error';

    // Distinguish timeout from other errors
    if (message.includes('abort')) {
      return NextResponse.json(
        { error: 'Request timed out after 10 seconds' },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: `Scraping failed: ${message}` },
      { status: 502 },
    );
  }
}
