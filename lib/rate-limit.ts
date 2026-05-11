/**
 * 内存版 rate limit（v1 单实例可用；多实例 / Edge 多区域有局限）。
 * v2 切 Upstash Redis。
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: options.limit - 1, resetAt: fresh.resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= options.limit;
  return {
    ok,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown"
  );
}
