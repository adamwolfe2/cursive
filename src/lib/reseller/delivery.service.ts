/**
 * Reseller Outbound Delivery
 *
 * Signs and POSTs a lead payload to a partner-supplied endpoint. Uses the same
 * signature scheme as the platform's existing workspace_webhooks so partner docs
 * are consistent:
 *   X-Cursive-Signature: t=<unix>,v1=<hmac-sha256-hex over "<t>.<body>">
 *
 * Retries are handled by the Inngest function wrapping this (retries: 5). This
 * helper does a single attempt and returns a structured result.
 */

import { hmacSha256Hex } from '@/lib/utils/crypto'
import type { OutboundLeadPayload } from './types'

const DELIVERY_TIMEOUT_MS = 10_000

/**
 * SSRF guard for partner-supplied destination URLs. Requires https and blocks
 * localhost, private/link-local IPv4 literals, ALL IPv6 literals (which would
 * otherwise smuggle mapped forms like [::ffff:127.0.0.1]), and the cloud
 * metadata IP. DNS is not resolved here (pure/sync, edge-safe) — the resolved
 * addresses are additionally checked at delivery time (see
 * resolvesToBlockedAddress). WHATWG URL canonicalizes decimal/octal IPv4 forms
 * (e.g. https://2130706433 -> 127.0.0.1) before these checks run.
 */
export function isSafeDestinationUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return false
  // Reject every IPv6 literal (bracketed host). This closes the
  // [::ffff:127.0.0.1] mapped-loopback gap; IPv6-only endpoints are not
  // supported as v1 destinations.
  if (host.startsWith('[') || host.includes(':')) return false
  if (isBlockedIpv4(host)) return false
  if (!host.includes('.')) return false // require a dotted hostname
  return true
}

/** Loopback / private / link-local / metadata / unspecified IPv4 literals. */
function isBlockedIpv4(host: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false // not an IPv4 literal
  if (host === '169.254.169.254') return true // cloud metadata
  if (/^127\./.test(host)) return true
  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  if (/^169\.254\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true
  if (/^0\./.test(host)) return true // 0.0.0.0/8 (unspecified/broadcast tricks)
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true // CGNAT 100.64/10
  return false
}

/** Blocked IPv6 addresses (loopback, ULA, link-local, mapped-private, unspecified). */
function isBlockedIpv6(addr: string): boolean {
  const a = addr.toLowerCase()
  if (a === '::' || a === '::1') return true
  if (a.startsWith('fc') || a.startsWith('fd')) return true // ULA fc00::/7
  if (/^fe[89ab]/.test(a)) return true // link-local fe80::/10
  // IPv4-mapped (::ffff:a.b.c.d) — recheck the embedded IPv4.
  const mapped = a.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return isBlockedIpv4(mapped[1])
  return false
}

/**
 * DNS-resolution SSRF check (Node runtime only; the delivery function runs on
 * nodejs). Resolves the hostname the same way fetch/undici will (dns.lookup)
 * and rejects if ANY resolved address is private/loopback/link-local/metadata.
 * This defeats plain DNS-pointing attacks; a fast-flux TOCTOU rebind between
 * this check and the actual connect remains theoretically possible and is an
 * accepted residual risk for v1 (partner endpoints are contract-gated).
 *
 * Throws on resolver failure so the caller's retry machinery handles transient
 * DNS errors; returns true (blocked) only on a definitive private resolution.
 */
export async function resolvesToBlockedAddress(hostname: string): Promise<boolean> {
  // IP literals were already validated synchronously; lookup would just echo them.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return isBlockedIpv4(hostname)
  const dns = await import('node:dns/promises')
  const addrs = await dns.lookup(hostname, { all: true, verbatim: true })
  return addrs.some((a) =>
    a.family === 4 ? isBlockedIpv4(a.address) : isBlockedIpv6(a.address),
  )
}

async function signPayload(secret: string, payloadString: string): Promise<{ header: string; timestamp: number }> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await hmacSha256Hex(secret, `${timestamp}.${payloadString}`)
  return { header: `t=${timestamp},v1=${signature}`, timestamp }
}

export interface DeliveryResult {
  success: boolean
  statusCode?: number
  error?: string
  /** Permanent condition (e.g. unsafe URL) — the caller must NOT retry. */
  permanent?: boolean
}

/**
 * Single delivery attempt. Throws on network failure so the Inngest wrapper
 * retries; returns a non-2xx result for HTTP errors (also retried by caller).
 * Unsafe/blocked destinations return `permanent: true` (never retried).
 */
export async function deliverToPartner(
  destinationUrl: string,
  signingSecret: string,
  payload: OutboundLeadPayload,
): Promise<DeliveryResult> {
  if (!isSafeDestinationUrl(destinationUrl)) {
    return { success: false, error: 'Unsafe or invalid destination URL', permanent: true }
  }
  // DNS-level SSRF check (throws on transient resolver failure -> caller retries).
  if (await resolvesToBlockedAddress(new URL(destinationUrl).hostname)) {
    return { success: false, error: 'Destination resolves to a blocked address', permanent: true }
  }

  const payloadString = JSON.stringify(payload)
  const { header, timestamp } = await signPayload(signingSecret, payloadString)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

  try {
    const response = await fetch(destinationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cursive-Event': payload.event,
        'X-Cursive-Signature': header,
        'X-Cursive-Timestamp': String(timestamp),
        'User-Agent': 'Cursive-Reseller-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
      // SSRF hardening: never follow redirects — a 30x to a private/metadata IP
      // would bypass the literal-host guard above. A redirected endpoint is
      // treated as a delivery failure (partner must give a direct URL).
      redirect: 'error',
    })
    clearTimeout(timeoutId)
    return {
      success: response.ok,
      statusCode: response.status,
      ...(!response.ok && { error: `HTTP ${response.status}` }),
    }
  } catch (err) {
    clearTimeout(timeoutId)
    const msg =
      err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out after 10s'
        : err instanceof Error
          ? err.message
          : 'Unknown error'
    // Throw so Inngest retries transient network failures.
    throw new Error(msg)
  }
}
