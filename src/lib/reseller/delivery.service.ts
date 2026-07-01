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
 * localhost, private/link-local IP literals, and the cloud metadata IP. DNS is
 * not resolved here (edge-safe) — this blocks the obvious literal cases.
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
  if (host === '169.254.169.254') return false // cloud metadata
  // Private / loopback / link-local IPv4 literals.
  if (/^127\./.test(host)) return false
  if (/^10\./.test(host)) return false
  if (/^192\.168\./.test(host)) return false
  if (/^169\.254\./.test(host)) return false
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
  if (host === '0.0.0.0' || host === '::1' || host === '[::1]') return false
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
}

/**
 * Single delivery attempt. Throws on network failure so the Inngest wrapper
 * retries; returns a non-2xx result for HTTP errors (also retried by caller).
 */
export async function deliverToPartner(
  destinationUrl: string,
  signingSecret: string,
  payload: OutboundLeadPayload,
): Promise<DeliveryResult> {
  if (!isSafeDestinationUrl(destinationUrl)) {
    return { success: false, error: 'Unsafe or invalid destination URL' }
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
