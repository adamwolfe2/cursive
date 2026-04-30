import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.WORKSPACE_COOKIE_SECRET || process.env.AUTOMATION_SECRET || ''

if (!SECRET) {
  console.warn('[workspace-cookie] no WORKSPACE_COOKIE_SECRET set; signed cookies will be rejected')
}

export function signWorkspaceCookie(userId: string, workspaceId: string): string {
  if (!SECRET) return ''
  const payload = `${userId}.${workspaceId}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 32)
  return `${workspaceId}.${sig}`
}

export function verifyWorkspaceCookie(userId: string, cookieValue: string | undefined): string | null {
  if (!SECRET || !cookieValue) return null
  const idx = cookieValue.lastIndexOf('.')
  if (idx <= 0) return null
  const workspaceId = cookieValue.slice(0, idx)
  const providedSig = cookieValue.slice(idx + 1)
  const expected = createHmac('sha256', SECRET).update(`${userId}.${workspaceId}`).digest('hex').slice(0, 32)
  if (providedSig.length !== expected.length) return null
  try {
    if (!timingSafeEqual(Buffer.from(providedSig), Buffer.from(expected))) return null
  } catch { return null }
  return workspaceId
}
