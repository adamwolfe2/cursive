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
import { isBlockedIpv4, resolvesToBlockedAddress } from '@/lib/utils/ssrf-guard'
import type { OutboundLeadPayload } from './types'

const DELIVERY_TIMEOUT_MS = 10_000

/**
 * SSRF guard for partner-supplied destination URLs. Requires https and blocks
 * localhost, private/link-local IPv4 literals, ALL IPv6 literals (which would
 * otherwise smuggle mapped forms like [::ffff:127.0.0.1]), and the cloud
 * metadata IP. DNS is not resolved here (pure/sync, edge-safe) — the resolved
 * addresses are additionally checked at delivery time (see
 * resolvesToBlockedAddress in @/lib/utils/ssrf-guard). WHATWG URL canonicalizes
 * decimal/octal IPv4 forms
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
    if (err instanceof Error && err.name === 'AbortError') {
      // Transient timeout — throw so Inngest retries.
      throw new Error('Request timed out after 10s')
    }
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const causeMsg =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : ''
    // `redirect: 'error'` makes undici REJECT (not return) when the partner
    // endpoint responds with a 30x. A redirect is a permanent misconfiguration —
    // the partner must supply a direct URL — so it can NEVER succeed. Treat it as
    // a permanent failure instead of throwing: otherwise it is retried 5x over
    // ~7min of backoff, starving the shared concurrency budget for no reason.
    if (/redirect/i.test(msg) || /redirect/i.test(causeMsg)) {
      return {
        success: false,
        permanent: true,
        error: 'Endpoint redirected — provide a direct destination URL',
      }
    }
    // Throw so Inngest retries transient network failures.
    throw new Error(msg)
  }
}
