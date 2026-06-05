/**
 * Website URL normalization + pixel version detection.
 *
 * Buyers don't always type `https://` — and they shouldn't have to.
 * normalizeWebsiteUrl() takes whatever they type (`yoursite.com`,
 * `www.yoursite.com`, `http://yoursite.com`, etc) and returns a
 * valid https URL, or null if the input is unsalvageable.
 *
 * isPixelV4() inspects an AL install_url to determine whether AL
 * provisioned the modern v4 SuperPixel (cdn.idpixel.app/v1/...) or
 * the legacy v3 pixel (cdn.v3.identitypxl.app/...). Used by the
 * provision route to alert if AL ever regresses our account back
 * to v3.
 */

const BAD_HOST_SUFFIXES = ['.internal', '.local', '.localhost'] as const

/**
 * Normalize a buyer's typed website URL to a valid https URL.
 * Accepts: yoursite.com, www.yoursite.com, http://yoursite.com,
 * https://yoursite.com/some/path, etc. Returns null for empty,
 * private, or malformed input.
 */
export function normalizeWebsiteUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // If the user pasted "https://yoursite.com" — leave the scheme alone.
  // If they typed "yoursite.com" or "www.yoursite.com" — prepend https://.
  // Also coerce http:// → https:// since AL needs an https URL anyway and
  // there's zero reason to provision a pixel for an unencrypted site.
  let candidate = trimmed
  if (/^http:\/\//i.test(candidate)) {
    candidate = candidate.replace(/^http:\/\//i, 'https://')
  } else if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  const host = url.hostname.toLowerCase()

  // Reject obvious bad hosts so SSRF / typos don't reach AL
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return null
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null
  if (host.startsWith('[')) return null // IPv6 literals
  if (!host.includes('.')) return null
  if (BAD_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return null

  return url.toString()
}

/**
 * V4 (modern) install URLs come from cdn.idpixel.app — typically
 *   https://cdn.idpixel.app/v1/idp-analytics-<id>.min.js
 * V3 (legacy) install URLs come from cdn.v3.identitypxl.app.
 * AL controls this account-side; we just detect what they returned.
 */
export function isPixelV4(installUrl: string | null | undefined): boolean {
  if (!installUrl) return false
  return /cdn\.idpixel\.app/i.test(installUrl) || /\/v4\//i.test(installUrl)
}

/** Inverse of isPixelV4 — explicit check used for warning paths. */
export function isPixelV3(installUrl: string | null | undefined): boolean {
  if (!installUrl) return false
  return /cdn\.v3\.identitypxl\.app/i.test(installUrl)
}
