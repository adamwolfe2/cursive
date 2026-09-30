const DEFAULT_NEXT = '/dashboard'

/**
 * Post-login redirect target: same-origin paths only. The URL parser silently
 * drops tabs/newlines, so "/\t/evil.com" would resolve to "//evil.com" (another
 * host). Reject control characters and backslashes, resolve against our own
 * origin, and require the result to stay on it.
 */
export function sanitizeNext(path: string | null, appUrl: string): string {
  if (!path || !path.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(path)) {
    return DEFAULT_NEXT
  }
  const base = new URL(appUrl)
  const resolved = new URL(path, base)
  if (resolved.origin !== base.origin) return DEFAULT_NEXT
  return `${resolved.pathname}${resolved.search}${resolved.hash}`
}
