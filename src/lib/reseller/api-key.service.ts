/**
 * Reseller API Key Service
 *
 * Keys look like: rk_live_<43-char base64url token>
 * We store only sha256(rawKey) — the raw key is shown once at creation and
 * never persisted. Lookups hash the presented key and match on key_hash.
 */

import { sha256Hex } from '@/lib/utils/crypto'

const KEY_PREFIX = 'rk_live_'
const TOKEN_BYTES = 32

/** Base64url-encode bytes without padding (Edge + Node compatible). */
function base64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const b64 = (typeof btoa !== 'undefined')
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export interface GeneratedApiKey {
  /** Full raw key — return to the caller ONCE, never store. */
  rawKey: string
  /** sha256 hex of the raw key — store this. */
  keyHash: string
  /** First 12 chars (prefix + 4) for display/support — safe to store/show. */
  keyPrefix: string
}

/**
 * Generate a new reseller API key + its stored hash.
 */
export async function generateApiKey(): Promise<GeneratedApiKey> {
  const raw = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(raw)
  const token = base64url(raw)
  const rawKey = `${KEY_PREFIX}${token}`
  const keyHash = await sha256Hex(rawKey)
  const keyPrefix = rawKey.slice(0, KEY_PREFIX.length + 4)
  return { rawKey, keyHash, keyPrefix }
}

/** Hash a presented key for lookup. */
export async function hashApiKey(rawKey: string): Promise<string> {
  return sha256Hex(rawKey)
}

const SIGNING_SECRET_PREFIX = 'whsec_'

/**
 * Generate a per-pixel webhook signing secret. Uses a DISTINCT `whsec_` prefix
 * (not `rk_live_`) so partners can never confuse an HMAC signing secret with a
 * bearer API key — and so leaked-credential scanners classify each correctly.
 */
export function generateSigningSecret(): string {
  const raw = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(raw)
  return `${SIGNING_SECRET_PREFIX}${base64url(raw)}`
}

/**
 * Extract a bearer token from an Authorization header value.
 * Accepts "Bearer rk_live_xxx" or a bare "rk_live_xxx".
 * Returns null if it doesn't look like a reseller key.
 */
export function extractBearerKey(authHeader: string | null): string | null {
  if (!authHeader) return null
  const trimmed = authHeader.trim()
  const withoutScheme = trimmed.toLowerCase().startsWith('bearer ')
    ? trimmed.slice(7).trim()
    : trimmed
  return withoutScheme.startsWith(KEY_PREFIX) ? withoutScheme : null
}
