/**
 * Edge-compatible cryptographic utilities
 * Shared across webhook handlers and signature verification
 */

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Compares every character regardless of early mismatches.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate HMAC-SHA256 hex digest using Web Crypto API (Edge-compatible).
 */
export async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify an HMAC-SHA256 signature with optional sha256= prefix.
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await hmacSha256Hex(secret, payload)
  const provided = signature.replace(/^sha256=/, '')
  return timingSafeEqual(expected, provided)
}

/**
 * Edge-compatible SHA-256 hash (hex digest).
 */
export async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
