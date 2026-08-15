import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signed one-click unsubscribe tokens.
 *
 * Without a signature, /api/unsubscribe accepted any email in the query string,
 * letting anyone suppress arbitrary recipients (and letting a prefetch/CSRF GET
 * fire the state change). The token binds the link to a specific email via HMAC
 * so only a link we generated can unsubscribe that address.
 *
 * Uses a dedicated secret; falls back to AUTOMATION_SECRET only so existing
 * deployments keep working. Verification fails closed when no secret is set.
 */
function secret(): string | null {
  return process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.AUTOMATION_SECRET || null
}

function normalize(email: string): string {
  return email.toLowerCase().trim()
}

export function signUnsubscribeToken(email: string): string {
  const s = secret()
  if (!s) return ''
  return createHmac('sha256', s).update(`unsubscribe:${normalize(email)}`).digest('hex').slice(0, 32)
}

export function verifyUnsubscribeToken(email: string, token: string | null | undefined): boolean {
  const s = secret()
  if (!s || !token) return false
  const expected = signUnsubscribeToken(email)
  if (!expected || token.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
