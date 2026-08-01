/**
 * SSRF Guard — validates webhook URLs to block internal/private network access
 * Prevents users from configuring webhook URLs that point to internal services
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
])

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

/** Loopback / private / link-local / metadata / unspecified IPv4 literals. */
export function isBlockedIpv4(host: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false // not an IPv4 literal
  if (host === '169.254.169.254') return true // cloud metadata
  if (/^127\./.test(host)) return true
  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  if (/^169\.254\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true
  if (/^0\./.test(host)) return true // 0.0.0.0/8 (unspecified/broadcast tricks)
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true // CGNAT 100.64/10
  return false
}

/** Blocked IPv6 addresses (loopback, ULA, link-local, mapped-private, unspecified). */
export function isBlockedIpv6(addr: string): boolean {
  const a = addr.toLowerCase()
  if (a === '::' || a === '::1') return true
  if (a.startsWith('fc') || a.startsWith('fd')) return true // ULA fc00::/7
  if (/^fe[89ab]/.test(a)) return true // link-local fe80::/10
  // IPv4-mapped (::ffff:a.b.c.d) — recheck the embedded IPv4.
  const mapped = a.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return isBlockedIpv4(mapped[1])
  // Same address in hex form. WHATWG URL normalizes "::ffff:10.0.0.1" to
  // "::ffff:a00:1", so anything derived from new URL().hostname arrives here
  // in a form the dotted pattern above can never match.
  const mappedHex = a.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16)
    const lo = parseInt(mappedHex[2], 16)
    return isBlockedIpv4(
      `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
    )
  }
  return false
}

/**
 * DNS-resolution SSRF check (Node runtime only). Resolves the hostname the same
 * way fetch/undici will (dns.lookup) and rejects if ANY resolved address is
 * private/loopback/link-local/metadata/CGNAT. This defeats plain DNS-pointing
 * attacks where a public domain's A/AAAA record targets an internal IP.
 *
 * Shared by the reseller outbound delivery path and the public website-enrich
 * endpoint so both enforce identical DNS-level rules.
 *
 * A fast-flux TOCTOU rebind between this check and the actual connect remains
 * theoretically possible and is an accepted residual risk (matches the reseller
 * delivery path). Throws on resolver failure so callers decide how to handle a
 * transient DNS error; returns true (blocked) only on a definitive private
 * resolution.
 */
export async function resolvesToBlockedAddress(hostname: string): Promise<boolean> {
  // IP literals were already validated synchronously; lookup would just echo them.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return isBlockedIpv4(hostname)
  const dns = await import('node:dns/promises')
  const addrs = await dns.lookup(hostname, { all: true, verbatim: true })
  return addrs.some((a) =>
    a.family === 4 ? isBlockedIpv4(a.address) : isBlockedIpv6(a.address),
  )
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

  // URL.hostname returns IPv6 literals bracketed ("[::1]", "[fc00::1]").
  // Matching the bracketed form against bare-address checks silently passed
  // every IPv6 loopback/ULA/link-local host straight through.
  const host =
    hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname

  // Delegate to the canonical checks rather than keeping a second, thinner
  // copy of the range list here — the local copy was missing CGNAT entirely.
  if (isBlockedIpv4(host) || isBlockedIpv6(host)) return false

  return true
}
