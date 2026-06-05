/**
 * Funnel ICP → AudienceLab Taxonomy Mapper
 *
 * Buyers fill in the post-pay ICP form with freeform text. AL's audience
 * builder needs specific enum-style values for industries, seniority,
 * employee count, and state codes. This module bridges the two:
 *
 *   - suggestIndustries: fuzzy-matches the buyer's industry names to AL's
 *     canonical industry list
 *   - suggestSeniority: infers seniority levels from job titles
 *   - suggestStateCodes: extracts 2-letter US state codes from location text
 *   - parseEmployeeRange: turns "11-50" → { min: 11, max: 50 }
 *
 * Used by the admin email + admin page to show Adam "ready to paste" values
 * alongside the raw buyer input.
 *
 * Sources:
 *   - ALAudienceBusinessFilter (src/lib/audiencelab/api-client.ts:202)
 *   - icp-audience-builder.ts curated industry list (live-verified against
 *     /audiences/attributes/industries)
 */

// ─── Curated AL taxonomies ─────────────────────────────────────────────────

/**
 * AL seniority enum (must match ALAudienceBusinessFilter.seniority exactly).
 */
export const AL_SENIORITY_LEVELS = [
  'C-Suite',
  'VP',
  'Director',
  'Manager',
  'Individual Contributor',
  'Entry Level',
] as const

export type ALSeniority = (typeof AL_SENIORITY_LEVELS)[number]

/**
 * Common AL industry names — the top ~30 most-used in B2B SaaS funnels.
 * Live-verified against GET /audiences/attributes/industries 2026-02-10.
 * AL has 130+ total; this is the high-signal subset most buyers will pick.
 */
export const AL_COMMON_INDUSTRIES = [
  'Technology',
  'Software',
  'Internet',
  'Computer Software',
  'Information Technology and Services',
  'Artificial Intelligence',
  'Financial Services',
  'Banking',
  'Insurance',
  'Real Estate',
  'Marketing and Advertising',
  'Public Relations and Communications',
  'Media Production',
  'Online Media',
  'E-Learning',
  'Education Management',
  'Health, Wellness and Fitness',
  'Hospital & Health Care',
  'Medical Devices',
  'Pharmaceuticals',
  'Retail',
  'Consumer Goods',
  'Apparel & Fashion',
  'Food & Beverages',
  'Restaurants',
  'Hospitality',
  'Travel',
  'Construction',
  'Real Estate',
  'Architecture & Planning',
  'Legal Services',
  'Management Consulting',
  'Staffing and Recruiting',
  'Human Resources',
  'Telecommunications',
  'Logistics and Supply Chain',
  'Transportation/Trucking/Railroad',
  'Automotive',
  'Manufacturing',
  'Industrial Automation',
  'Renewable Energy',
  'Oil & Energy',
] as const

/** Title keywords → seniority level. First match wins, checked in order. */
const SENIORITY_RULES: Array<{ pattern: RegExp; level: ALSeniority }> = [
  // C-Suite — most specific first
  { pattern: /\b(ceo|coo|cto|cfo|cmo|cro|cpo|cdo|ciso|cio|chro|founder|co-founder|president|owner)\b/i, level: 'C-Suite' },
  { pattern: /\bchief\b/i, level: 'C-Suite' },
  // VP
  { pattern: /\b(vp|v\.p\.|vice president|svp|evp)\b/i, level: 'VP' },
  // Director
  { pattern: /\b(director|head of)\b/i, level: 'Director' },
  // Manager
  { pattern: /\b(manager|lead|team lead|principal)\b/i, level: 'Manager' },
  // Entry Level
  { pattern: /\b(intern|junior|jr\.?|entry|associate|assistant)\b/i, level: 'Entry Level' },
]

// US state name → 2-letter code map
const US_STATE_CODES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC', dc: 'DC',
}
const US_STATE_CODES_SET = new Set(Object.values(US_STATE_CODES))

// ─── Mappers ───────────────────────────────────────────────────────────────

/**
 * Returns AL-canonical industry matches for the buyer's freeform industry
 * list. Case-insensitive substring match against AL_COMMON_INDUSTRIES. The
 * `unmatched` field flags anything we couldn't confidently map so Adam can
 * search for it manually in AL.
 */
export function suggestIndustries(input: readonly string[]): {
  matched: string[]
  unmatched: string[]
} {
  const matched = new Set<string>()
  const unmatched: string[] = []

  for (const raw of input) {
    const needle = raw.trim().toLowerCase()
    if (!needle) continue

    let hit = false
    for (const canonical of AL_COMMON_INDUSTRIES) {
      const c = canonical.toLowerCase()
      if (c === needle || c.includes(needle) || needle.includes(c.split(' ')[0])) {
        matched.add(canonical)
        hit = true
      }
    }
    if (!hit) unmatched.push(raw)
  }

  return {
    matched: Array.from(matched),
    unmatched,
  }
}

/**
 * Returns the AL seniority levels implied by the buyer's title list.
 * Multiple titles can yield multiple levels.
 */
export function suggestSeniority(titles: readonly string[]): ALSeniority[] {
  const levels = new Set<ALSeniority>()
  for (const title of titles) {
    for (const rule of SENIORITY_RULES) {
      if (rule.pattern.test(title)) {
        levels.add(rule.level)
        break
      }
    }
  }
  return Array.from(levels)
}

/**
 * Extracts 2-letter US state codes from freeform location strings.
 * Recognizes "California", "CA", "California, USA", "San Francisco, CA",
 * "us", "united states" (returns nothing — too broad).
 */
export function suggestStateCodes(locations: readonly string[]): string[] {
  const codes = new Set<string>()

  for (const loc of locations) {
    const normalized = loc.trim().toLowerCase()
    if (!normalized) continue

    // Already a 2-letter code anywhere in the string
    const codeMatches = loc.toUpperCase().match(/\b([A-Z]{2})\b/g) ?? []
    for (const code of codeMatches) {
      if (US_STATE_CODES_SET.has(code)) {
        codes.add(code)
      }
    }

    // Full state name anywhere in the string
    for (const [name, code] of Object.entries(US_STATE_CODES)) {
      if (normalized.includes(name)) {
        codes.add(code)
      }
    }
  }

  return Array.from(codes)
}

/** "11-50" → {min: 11, max: 50}; "1000+" → {min: 1000}; "" → null */
export function parseEmployeeRange(
  raw: string | null | undefined
): { min?: number; max?: number } | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^\d-+]/g, '')
  if (!cleaned) return null

  if (cleaned.endsWith('+')) {
    const min = parseInt(cleaned.slice(0, -1), 10)
    if (!Number.isNaN(min)) return { min }
  }

  const parts = cleaned.split('-').map((p) => parseInt(p, 10))
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { min: parts[0], max: parts[1] }
  }
  if (parts.length === 1 && !Number.isNaN(parts[0])) {
    return { min: parts[0] }
  }
  return null
}

// ─── High-level summary builder ────────────────────────────────────────────

export interface ALAudienceSuggestion {
  /** AL Industry filter — paste directly. */
  industries: string[]
  /** Industries the buyer entered that we couldn't auto-map. */
  unmatchedIndustries: string[]
  /** AL Seniority filter — paste directly. */
  seniority: ALSeniority[]
  /** AL State filter (2-letter codes) — paste directly. */
  stateCodes: string[]
  /** AL Employee Count filter min/max. */
  employeeRange: { min?: number; max?: number } | null
  /** Custom audience topic keywords seeded from titles + solution. */
  topicSeeds: string[]
}

export function buildALSuggestion(input: {
  solution?: string | null
  titles?: readonly string[] | null
  industries?: readonly string[] | null
  employee_range?: string | null
  locations?: readonly string[] | null
}): ALAudienceSuggestion {
  const titles = input.titles ?? []
  const industries = input.industries ?? []
  const locations = input.locations ?? []

  const { matched: matchedIndustries, unmatched: unmatchedIndustries } =
    suggestIndustries(industries)

  // Topic seeds for AL custom audiences = titles + first 3 words of solution
  const topicSeeds = new Set<string>()
  for (const t of titles) {
    const cleaned = t.trim()
    if (cleaned) topicSeeds.add(cleaned)
  }
  if (input.solution) {
    const firstClause = input.solution.split(/[,.\n]/)[0].trim()
    if (firstClause && firstClause.length < 80) topicSeeds.add(firstClause)
  }

  return {
    industries: matchedIndustries,
    unmatchedIndustries,
    seniority: suggestSeniority(titles),
    stateCodes: suggestStateCodes(locations),
    employeeRange: parseEmployeeRange(input.employee_range),
    topicSeeds: Array.from(topicSeeds),
  }
}
