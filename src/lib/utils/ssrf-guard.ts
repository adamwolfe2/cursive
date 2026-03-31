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
