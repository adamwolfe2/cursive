const DEFAULT_NEXT = '/dashboard'
// Any fixed origin works: we only need to know whether the path escapes it.
const PROBE_ORIGIN = 'https://same-origin.invalid'

/**
 * Post-login redirect target: same-origin paths only, returned normalized.
 * - The URL parser drops tabs/newlines, so "/\t/evil.com" becomes "//evil.com".
 * - Dot segments normalize too: "/..//evil.com" becomes the path "//evil.com",
 *   which is protocol-relative when used as a redirect.
 * Reject control chars and backslashes, resolve, require the probe origin, and
 * reject any normalized path that starts with "//".
 */
export function sanitizeNext(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(path)) {
    return DEFAULT_NEXT
  }
  const resolved = new URL(path, PROBE_ORIGIN)
  if (resolved.origin !== PROBE_ORIGIN || resolved.pathname.startsWith('//')) {
    return DEFAULT_NEXT
  }
  return `${resolved.pathname}${resolved.search}${resolved.hash}`
}
