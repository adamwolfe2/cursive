/**
 * Signed session tokens for the public Audience Builder copilot.
 *
 * We issue a short-lived HMAC-signed token when a visitor starts a session
 * (via /api/public/copilot/start). Subsequent chat + session calls present
 * the token in the Authorization header; we verify signature + TTL before
 * accepting the request. No server-side state needed beyond the DB.
 */

import { createHmac } from 'crypto'

const TOKEN_TTL_SECONDS = 60 * 60 * 2 // 2 hours

interface TokenPayload {
  lead_id: string
  email: string
  session_id: string
  issued_at: number // unix seconds
}

export function getTokenSecret(): string {
  const secret = process.env.PUBLIC_COPILOT_TOKEN_SECRET || process.env.AUTOMATION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'PUBLIC_COPILOT_TOKEN_SECRET (or AUTOMATION_SECRET) must be set and at least 16 chars'
    )
  }
  return secret
}

export function signToken(payload: Omit<TokenPayload, 'issued_at'>): string {
  const full: TokenPayload = { ...payload, issued_at: Math.floor(Date.now() / 1000) }
  const body = Buffer.from(JSON.stringify(full)).toString('base64url')
  const sig = createHmac('sha256', getTokenSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [body, sig] = token.split('.')
    if (!body || !sig) return null
    const expected = createHmac('sha256', getTokenSecret()).update(body).digest('base64url')
    // Constant-time compare
    if (sig.length !== expected.length) return null
    let diff = 0
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
    if (diff !== 0) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload
    const age = Math.floor(Date.now() / 1000) - payload.issued_at
    if (age > TOKEN_TTL_SECONDS) return null
    return payload
  } catch {
    return null
  }
}

export function hashIp(ip: string): string {
  // Daily salt so IP hashes can't be correlated across days
  const daySalt = new Date().toISOString().slice(0, 10)
  return createHmac('sha256', getTokenSecret())
    .update(`${daySalt}:${ip}`)
    .digest('hex')
    .slice(0, 32)
}
