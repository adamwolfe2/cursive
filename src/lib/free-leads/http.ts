/** Small route helpers shared by /api/start/*. */
import { isIP } from 'node:net'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRouteRateLimit, type RateLimitType } from '@/lib/middleware/rate-limiter'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

/**
 * Rate-limit identity for an address. IPv6 clients usually control a whole /64,
 * so key them by that prefix; IPv4 (and IPv4-mapped IPv6) by the full address.
 */
export function ipKey(raw: string): string {
  const ip = raw.trim().toLowerCase().replace(/%.*$/, '')
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return mapped[1]
  if (isIP(ip) !== 6) return ip || 'unknown'
  const [head, tail] = ip.split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  // A trailing dotted IPv4 counts as two groups.
  const width = (groups: string[]) => groups.reduce((n, g) => n + (g.includes('.') ? 2 : 1), 0)
  const groups = tail === undefined ? h : [...h, ...Array(8 - width(h) - width(t)).fill('0'), ...t]
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(':')}::/64`
}

export function clientIp(req: NextRequest): string {
  return ipKey(
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown'
  )
}

/** True when the caller is over the limit. Fails closed (DB error => limited). */
export async function isLimited(type: RateLimitType, identifier: string): Promise<boolean> {
  const result = await checkRouteRateLimit(identifier, type)
  return !result.allowed
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json()
  } catch (err) {
    safeError('[free-leads] invalid JSON body', String(err))
    return null
  }
}

export function badRequest(message = 'Invalid request') {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function rateLimited(message = 'Too many requests. Please try again later.') {
  return NextResponse.json({ error: message, code: 'rate_limited' }, { status: 429 })
}

export function serverError(message = 'Something went wrong. Please try again.') {
  return NextResponse.json({ error: message }, { status: 500 })
}

/** Verified session user (getUser validates the JWT server-side). */
export async function sessionUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.email) return null
  return { id: data.user.id, email: data.user.email.trim().toLowerCase() }
}
