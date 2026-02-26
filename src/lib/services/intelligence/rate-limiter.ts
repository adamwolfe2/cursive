/**
 * Simple per-provider rate limit tracking via in-memory exponential backoff.
 * Since Vercel functions are stateless, we handle rate limits by catching 429s
 * and returning a rate_limited status rather than waiting.
 */

export interface RateLimitResult {
  allowed: boolean
  retryAfterMs?: number
}

// Per-provider request tracking within a single function invocation
const requestCounts = new Map<string, number>()

// Hard per-invocation limits (safety valve — external APIs enforce the real limits)
// Override via environment variables to match your API plan
const PER_INVOCATION_LIMITS: Record<string, number> = {
  builtwith: parseInt(process.env.INTELLIGENCE_BUILTWITH_LIMIT ?? '5', 10),
  emailrep: parseInt(process.env.INTELLIGENCE_EMAILREP_LIMIT ?? '20', 10),
  proxycurl: parseInt(process.env.INTELLIGENCE_PROXYCURL_LIMIT ?? '10', 10),
  fullcontact: parseInt(process.env.INTELLIGENCE_FULLCONTACT_LIMIT ?? '10', 10),
  serper: parseInt(process.env.INTELLIGENCE_SERPER_LIMIT ?? '20', 10),
  perplexity: parseInt(process.env.INTELLIGENCE_PERPLEXITY_LIMIT ?? '3', 10),
  perplexity_deep: 1, // always 1 — deep research is expensive
  openai: parseInt(process.env.INTELLIGENCE_OPENAI_LIMIT ?? '10', 10),
}

export function checkInvocationLimit(provider: string): RateLimitResult {
  const limit = PER_INVOCATION_LIMITS[provider] ?? 10
  const count = requestCounts.get(provider) ?? 0
  if (count >= limit) {
    return { allowed: false, retryAfterMs: 5000 }
  }
  requestCounts.set(provider, count + 1)
  return { allowed: true }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Retry a fetch with exponential backoff on 429/503 */
export async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error | null = null
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options)
    if (res.status === 429 || res.status === 503) {
      const retryAfter = res.headers.get('retry-after')
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000
      if (i < maxRetries - 1) await sleep(waitMs)
      lastError = new Error(`Rate limited by ${url} (${res.status})`)
      continue
    }
    return res
  }
  throw lastError ?? new Error('Max retries exceeded')
}
