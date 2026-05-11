import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * 限流：Upstash Redis 优先；未配则进程内内存 fallback。
 *
 * - 单实例部署（当前生产）：内存足够；
 * - 多实例 / 多区域 / 无状态 Edge：必须配 Upstash（跨进程共享计数器）。
 *
 * 启用 Upstash：在 env 配齐
 *   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=<token>
 *
 * 未配时自动 fallback，本地 dev 零配置能跑。
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

// ─────────────────────────────────────────────────────────────
// Upstash 模式
// ─────────────────────────────────────────────────────────────

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(upstashUrl && upstashToken);

const redis = useUpstash
  ? new Redis({ url: upstashUrl as string, token: upstashToken as string })
  : null;

// Ratelimit 实例按 (limit, windowMs) 缓存，避免每次请求都 new 对象
const upstashCache = new Map<string, Ratelimit>();

function getUpstashLimiter(opts: RateLimitOptions): Ratelimit {
  if (!redis) throw new Error("upstash redis not configured");
  const cacheKey = `${opts.limit}:${opts.windowMs}`;
  let inst = upstashCache.get(cacheKey);
  if (!inst) {
    inst = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.limit, msToDuration(opts.windowMs)),
      analytics: false,
      prefix: "studio-bei-rl",
    });
    upstashCache.set(cacheKey, inst);
  }
  return inst;
}

function msToDuration(ms: number): `${number} ${"ms" | "s" | "m" | "h" | "d"}` {
  if (ms < 1000) return `${Math.max(1, Math.ceil(ms))} ms`;
  if (ms < 60_000) return `${Math.ceil(ms / 1000)} s`;
  if (ms < 60 * 60_000) return `${Math.ceil(ms / 60_000)} m`;
  if (ms < 24 * 60 * 60_000) return `${Math.ceil(ms / (60 * 60_000))} h`;
  return `${Math.ceil(ms / (24 * 60 * 60_000))} d`;
}

// ─────────────────────────────────────────────────────────────
// 内存模式（fallback）
// ─────────────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimitMemory(key: string, options: RateLimitOptions): RateLimitResult {
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

// ─────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────

/**
 * 限流：Upstash 优先，未配 fallback 内存。
 *
 * 注意 async：调用方需 await。
 *
 * 入参 key 约定 `<feature>:<scope>`，如 `leads:ip:1.2.3.4`。
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  if (useUpstash) {
    const r = await getUpstashLimiter(options).limit(key);
    return {
      ok: r.success,
      remaining: r.remaining,
      resetAt: r.reset,
    };
  }
  return rateLimitMemory(key, options);
}

export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown"
  );
}
