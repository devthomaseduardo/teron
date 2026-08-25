/**
 * Rate limit em memoria (single instance).
 * Em multi-instancia, trocar por Redis.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number }

export function rateLimit(
  key: string,
  {
    limit = 10,
    windowMs = 60_000,
  }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return { ok: true, remaining: limit - existing.count }
}

/** Limpa buckets expirados (chamado ocasionalmente). */
export function pruneRateLimits() {
  const now = Date.now()
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k)
  }
}
