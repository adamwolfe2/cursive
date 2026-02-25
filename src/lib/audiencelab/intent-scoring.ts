/**
 * URL Intent Scoring
 *
 * Calculates buyer intent score (0-100) from page URLs captured by the v4 pixel.
 * Higher scores = stronger purchase intent signal.
 */

interface IntentPattern {
  pattern: RegExp
  score: number
  signal: string
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Strongest buy signals
  { pattern: /\/checkout|\/buy|\/purchase|\/order/i, score: 95, signal: 'Purchase intent' },
  { pattern: /\/sign-?up|\/register|\/start-?trial|free-?trial/i, score: 92, signal: 'Trial signup' },
  // High intent
  { pattern: /\/pricing|\/plans|\/packages/i, score: 90, signal: 'Viewed pricing' },
  { pattern: /\/request-?demo|\/book-?demo|\/schedule-?demo/i, score: 88, signal: 'Requested demo' },
  { pattern: /\/demo/i, score: 82, signal: 'Demo interest' },
  { pattern: /\/contact-?us|\/get-?started|\/talk-?to-?us/i, score: 85, signal: 'Contact intent' },
  { pattern: /\/compare|\/vs-|-vs-|-alternative/i, score: 78, signal: 'Competitor research' },
  // Medium intent
  { pattern: /\/features|\/product\/|\/platform/i, score: 75, signal: 'Feature research' },
  { pattern: /\/solutions|\/use-?cases|\/industries/i, score: 72, signal: 'Solutions research' },
  { pattern: /\/how-it-works|\/why-us|\/our-approach/i, score: 70, signal: 'Product education' },
  { pattern: /\/customers|\/case-studi|\/success-stories|\/testimonials/i, score: 68, signal: 'Social proof' },
  { pattern: /\/integrations|\/apps|\/marketplace/i, score: 65, signal: 'Integration research' },
  // Lower intent
  { pattern: /\/blog\/|\/resources\/|\/guides\/|\/ebooks\//i, score: 30, signal: 'Content reader' },
  { pattern: /\/about|\/team|\/company/i, score: 35, signal: 'Brand awareness' },
  { pattern: /\/docs\/|\/help\/|\/support\//i, score: 40, signal: 'Support research' },
  { pattern: /\/careers|\/jobs/i, score: 15, signal: 'Job seeking' },
  { pattern: /\/press|\/news|\/media/i, score: 20, signal: 'Press research' },
]

/**
 * Score a visited URL for buyer intent.
 *
 * @returns score (0-100) and optional signal label
 */
export function scoreUrlIntent(url: string | null | undefined): {
  score: number
  signal: string | null
} {
  if (!url) return { score: 50, signal: null }

  try {
    // Parse URL to get pathname only (ignore query params for scoring)
    const pathname = new URL(url).pathname
    for (const { pattern, score, signal } of INTENT_PATTERNS) {
      if (pattern.test(pathname)) {
        return { score, signal }
      }
    }
  } catch {
    // Fallback to full URL match if parsing fails
    for (const { pattern, score, signal } of INTENT_PATTERNS) {
      if (pattern.test(url)) {
        return { score, signal }
      }
    }
  }

  // Default: homepage or unknown page
  return { score: 50, signal: null }
}

/**
 * Parse a DNC flag value from AudienceLab v4 response.
 * AL may return "true"/"false" strings or boolean values.
 */
export function parseDncFlag(value: string | boolean | null | undefined): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  return value.toString().toLowerCase() === 'true'
}
