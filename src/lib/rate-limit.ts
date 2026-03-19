const DEFAULT_CLEANUP_THRESHOLD = 100;

export function createRateLimiter(limit: number, windowMs: number) {
  const map = new Map<string, { count: number; resetAt: number }>();

  return function checkRateLimit(key: string): boolean {
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
