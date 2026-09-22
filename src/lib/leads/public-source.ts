/**
 * Customer-facing lead source labels.
 *
 * Internally `leads.source` records real provenance, including which upstream
 * provider produced a record. Customers should never see a provider name: it is
 * our supply chain, not theirs, and it appears in webhook payloads, the leads
 * table and anything else we hand over.
 *
 * Map at the boundary rather than rewriting stored rows, so internal provenance
 * stays intact for debugging and attribution.
 */

const PROVIDER_PATTERN = /audience[\s_-]?labs?/i

/**
 * The only values we will ever hand a customer. Anything not on this list is
 * reported as `unknown`: an unrecognised stored value is just as likely to name
 * a vendor (`clay`, `prospeo`) as to be something harmless.
 */
const PUBLIC_SOURCES = new Set([
  'pixel',
  'daily_audience',
  'partner',
  'marketplace',
  'auto_match',
  'import',
  'manual',
  'api',
])

/**
 * Translate a stored source into something safe to hand a customer.
 * Anything provider-shaped is mapped explicitly; anything unrecognised is
 * passed through only after confirming it carries no provider name.
 */
export function publicLeadSource(source: string | null | undefined): string {
  if (!source) return 'unknown'

  const value = source.trim().toLowerCase()

  // Check for pixel BEFORE the provider pattern: `audiencelab_pixel_v4` is a
  // pixel source that happens to carry the provider prefix, and matching the
  // provider first would file it under the daily pull.
  if (value.includes('pixel')) return 'pixel'
  if (PROVIDER_PATTERN.test(value)) {
    // The daily audience pull and its variants (`audiencelab_pull`,
    // `audiencelab_database`, bare `audiencelab`).
    return 'daily_audience'
  }
  if (value === 'partner') return 'partner'
  if (value === 'marketplace') return 'marketplace'
  if (value === 'query' || value === 'auto_match') return 'auto_match'
  if (value === 'import' || value === 'ingest') return 'import'
  if (value === 'manual') return 'manual'
  if (value === 'api') return 'api'

  // Anything else is reported as unknown rather than echoed: passing stored
  // provenance through verbatim is how a vendor name reaches a customer.
  return PUBLIC_SOURCES.has(value) ? value : 'unknown'
}

/** Title-cased form for display surfaces. */
export function publicLeadSourceLabel(source: string | null | undefined): string {
  const value = publicLeadSource(source)
  if (value === 'unknown') return '—'
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
