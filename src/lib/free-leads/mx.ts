/**
 * Does this email domain accept mail? Checked before a claim counts toward any
 * cap, so made-up domains cannot burn the daily send budget.
 */
import { resolveMx } from 'node:dns/promises'
import { safeWarn } from '@/lib/utils/log-sanitizer'

type ResolveMx = (domain: string) => Promise<{ exchange: string; priority: number }[]>

const TIMEOUT_MS = 3_000
const TTL_MS = 60 * 60 * 1000
// ponytail: per-instance cache; fine because lookups are cheap and cached by DNS too.
const cache = new Map<string, { ok: boolean; expires: number }>()

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('MX lookup timed out'), { code: 'ETIMEOUT' })), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** False for no MX, a null MX (RFC 7505), or an unanswered lookup (fails closed). */
export async function hasMailExchanger(domain: string, resolve: ResolveMx = resolveMx): Promise<boolean> {
  const hit = cache.get(domain)
  if (hit && hit.expires > Date.now()) return hit.ok

  let ok: boolean
  try {
    const records = await withTimeout(resolve(domain), TIMEOUT_MS)
    ok = records.some((r) => Boolean(r.exchange) && r.exchange !== '.')
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code !== 'ENOTFOUND' && code !== 'ENODATA') {
      // Transient (timeout, SERVFAIL): reject this attempt but do not cache it.
      safeWarn('[free-leads/mx] lookup failed', { domain, code: code ?? String(err) })
      return false
    }
    ok = false
  }
  cache.set(domain, { ok, expires: Date.now() + TTL_MS })
  return ok
}
