import { createHmac } from 'crypto'

/**
 * Generate a signed status page token for a client ID.
 * Token format: base64url(clientId:hmacSignature)
 */
export function generateStatusToken(clientId: string): string {
  const secret = process.env.STATUS_PAGE_SECRET || process.env.AUTOMATION_SECRET || 'cursive-status-default'
  const signature = createHmac('sha256', secret).update(clientId).digest('hex').slice(0, 16)
  return Buffer.from(`${clientId}:${signature}`).toString('base64url')
}

/**
 * Verify a status page token and return the client ID, or null if invalid.
 */
export function verifyStatusToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [clientId, signature] = decoded.split(':')
    if (!clientId || !signature) return null

    const secret = process.env.STATUS_PAGE_SECRET || process.env.AUTOMATION_SECRET || 'cursive-status-default'
    const expected = createHmac('sha256', secret).update(clientId).digest('hex').slice(0, 16)

    if (signature !== expected) return null
    return clientId
  } catch {
    return null
  }
}
