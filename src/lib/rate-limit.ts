import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const DEFAULT_CLEANUP_THRESHOLD = 100;

// Use Upstash Redis in production, in-memory fallback for local dev
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Creates a rate limiter using sliding window algorithm.
 * Uses Upstash Redis when configured, in-memory Map otherwise.
 * Always returns a Promise so callers can use `await`.
 *
 * @param limit - Max requests per window
 * @param windowMs - Window size in milliseconds
 * @param prefix - Redis key prefix (defaults to 'rl')
 */
export function createRateLimiter(
  limit: number,
  windowMs: number,
  prefix = 'rl',
): (key: string) => Promise<boolean> {
  if (redis) {
    // Production: Upstash Redis sliding window
    const windowSec = Math.ceil(windowMs / 1000);
    const windowStr = `${windowSec} s` as `${number} s`;
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, windowStr),
      prefix: `brandpilot:${prefix}`,
    });

    return async function checkRateLimit(key: string): Promise<boolean> {
      const { success } = await ratelimit.limit(key);
      return success;
    };
  }

  // Development fallback: in-memory (wrapped in Promise for consistent API)
  const map = new Map<string, { count: number; resetAt: number }>();

  return async function checkRateLimit(key: string): Promise<boolean> {
    const now = Date.now();

    if (map.size > DEFAULT_CLEANUP_THRESHOLD) {
      for (const [k, v] of map) {
        if (now > v.resetAt) map.delete(k);
      }
    }

    const entry = map.get(key);
    if (!entry || now > entry.resetAt) {
      map.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}
