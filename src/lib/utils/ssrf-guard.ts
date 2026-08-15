/**
 * SSRF Guard — validates webhook URLs to block internal/private network access
 * Prevents users from configuring webhook URLs that point to internal services
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
])

const PRIVATE_IP_PATTERNS = [
  /^127\./,           // IPv4 loopback
  /^10\./,            // Private class A
  /^172\.(1[6-9]|2\d|3[01])\./,  // Private class B (172.16-31.x.x)
  /^192\.168\./,      // Private class C
  /^169\.254\./,      // Link-local
  /^0\./,             // This network
  /^::1$/,            // IPv6 loopback
  /^fc[0-9a-f]{2}:/i, // IPv6 unique local
  /^fe[89ab][0-9a-f]:/i, // IPv6 link-local
]

/**
 * Returns true if the URL is safe to use as an outbound webhook destination.
 * Rejects:
 * - Non-HTTPS URLs
 * - Localhost / loopback addresses
 * - Private / RFC-1918 IP ranges
 * - Cloud metadata endpoints (169.254.169.254, metadata.google.internal)
 */
/**
 * Returns true if the given URL targets a blocked (internal/private) host.
 * Blocks:
 * - Non-http/https protocols
 * - localhost, 0.0.0.0, ::1
 * - Private IPv4 ranges: 10.x, 127.x, 172.16-31.x, 192.168.x, 169.254.x, 100.64-127.x
 */
export function isBlockedHost(urlStr: string): boolean {
  try {
    const { hostname, protocol } = new URL(urlStr)
    // Only allow http/https
    if (protocol !== 'http:' && protocol !== 'https:') return true
    // Block localhost and common internal hostnames
    if (hostname === 'localhost' || hostname === '0.0.0.0') return true
    // Block IPv6 loopback
    if (hostname === '::1' || hostname === '[::1]') return true
    // Block IPv4 private ranges (checked as numeric comparison for correctness)
    const ipv4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipv4) {
      const [, a, b] = ipv4.map(Number)
      if (a === 10) return true                          // 10.0.0.0/8
      if (a === 127) return true                         // 127.0.0.0/8 loopback
      if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
      if (a === 192 && b === 168) return true            // 192.168.0.0/16
      if (a === 169 && b === 254) return true            // 169.254.0.0/16 link-local / cloud metadata
      if (a === 100 && b >= 64 && b <= 127) return true  // 100.64.0.0/10 shared address space
    }
    return false
  } catch {
    return true
  }
}

/** True if an IPv4 literal falls in a private/loopback/link-local/reserved range. */
function isBlockedIpv4(ip: string): boolean {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const [, a, b] = m.map(Number)
  if (a === 0) return true                          // 0.0.0.0/8
  if (a === 10) return true                         // 10/8
  if (a === 127) return true                        // 127/8 loopback
  if (a === 169 && b === 254) return true           // 169.254/16 link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true  // 172.16/12
  if (a === 192 && b === 168) return true           // 192.168/16
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64/10 CGNAT
  if (a === 192 && b === 0) return true             // 192.0.0/24 IETF
  if (a === 198 && (b === 18 || b === 19)) return true // 198.18/15 benchmarking
  if (a >= 224) return true                         // multicast + reserved
  return false
}

/** True if an IPv6 literal is loopback/ULA/link-local, incl. IPv4-mapped forms. */
function isBlockedIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (addr === '::1' || addr === '::') return true
  if (/^fc[0-9a-f]{2}:/.test(addr) || /^fd[0-9a-f]{2}:/.test(addr)) return true // fc00::/7 ULA
  if (/^fe[89ab][0-9a-f]:/.test(addr)) return true                              // fe80::/10 link-local
  // IPv4-mapped (::ffff:169.254.169.254) / IPv4-embedded — extract and re-check.
  const v4 = addr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (v4 && isBlockedIpv4(v4[1])) return true
  return false
}

/**
 * Resolves `hostname` via DNS and returns true if ANY resolved address is
 * private/loopback/link-local/metadata. This defeats the string-only bypass
 * where an attacker points a public name (e.g. `169.254.169.254.nip.io`, or
 * their own domain) at an internal IP. IP literals are checked directly.
 *
 * Throws on resolver failure so callers can decide (typically: treat as blocked).
 * A fast-flux TOCTOU rebind between check and connect remains a residual risk;
 * pair with `redirect: 'manual'`/`'error'` and short timeouts.
 */
export async function resolvesToBlockedHost(hostname: string): Promise<boolean> {
  const h = hostname.replace(/^\[|\]$/g, '')
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return isBlockedIpv4(h)
  if (h.includes(':')) return isBlockedIpv6(h)
  const dns = await import('node:dns/promises')
  const addrs = await dns.lookup(h, { all: true, verbatim: true })
  return addrs.some((a) => (a.family === 4 ? isBlockedIpv4(a.address) : isBlockedIpv6(a.address)))
}

/**
 * Full async guard for server-side URL fetches. Validates protocol + literal
 * host synchronously, then resolves DNS. Returns `{ ok, reason }`.
 * `allowHttp` permits plain http (default false → https only).
 */
export async function assertPublicUrl(
  urlStr: string,
  opts?: { allowHttp?: boolean },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let url: URL
  try {
    url = new URL(urlStr)
  } catch {
    return { ok: false, reason: 'Invalid URL' }
  }
  const allowHttp = opts?.allowHttp ?? false
  if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
    return { ok: false, reason: 'Only https URLs are allowed' }
  }
  if (isBlockedHost(urlStr)) {
    return { ok: false, reason: 'URL targets a blocked host' }
  }
  try {
    if (await resolvesToBlockedHost(url.hostname)) {
      return { ok: false, reason: 'URL resolves to a private/internal address' }
    }
  } catch {
    // Resolver failure — fail closed.
    return { ok: false, reason: 'Could not resolve host' }
  }
  return { ok: true }
}

export function isValidWebhookUrl(urlString: string): boolean {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return false
  }

  // Only HTTPS
  if (url.protocol !== 'https:') return false

  const hostname = url.hostname.toLowerCase()

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) return false

  // Block private/loopback IP ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) return false
  }

  return true
}
