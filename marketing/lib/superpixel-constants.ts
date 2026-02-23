export const CURSIVE_STATS = {
  idRate: 0.70,
  bounceRate: 0.0005,
  intentQualifiedPct: 0.45,
  contacts: '420M+',
  householdCoverage: '98%',
  dailyIntentSignals: '60B+',
  ncoaRefresh: '30 days',
}

export const COMPETITOR_STATS = {
  claimedMatchRate: 0.60,
  actualUsableRate: 0.15,
  bounceRate: 0.20,
}

export const STATUS_QUO = {
  organicConversionRate: 0.02,
}

export const CLOSE_RATES: Record<string, number> = {
  'B2B SaaS': 0.05,
  'Home Services': 0.15,
  'Financial Services': 0.08,
  'Agencies': 0.10,
  'Ecommerce': 0.03,
  'Education': 0.07,
  'Real Estate': 0.12,
  'Healthcare': 0.08,
  'Other': 0.08,
}

export const TRAFFIC_RANGES: Record<string, number> = {
  'Under 1,000': 500,
  '1,000–5,000': 3000,
  '5,000–10,000': 7500,
  '10,000–25,000': 17500,
  '25,000–50,000': 37500,
  '50,000–100,000': 75000,
  '100,000+': 150000,
}

export function calculateScenarios(monthlyVisitors: number, dealSize: number, industry: string) {
  const closeRate = CLOSE_RATES[industry] ?? 0.08

  // Scenario A: No Pixel
  const noPixelLeads = monthlyVisitors * STATUS_QUO.organicConversionRate
  const noPixelRevenue = noPixelLeads * closeRate * dealSize

  // Scenario B: Standard Competitor Pixel
  const compIdentified = monthlyVisitors * COMPETITOR_STATS.actualUsableRate
  const compContactable = compIdentified * (1 - COMPETITOR_STATS.bounceRate)
  const compRevenue = compContactable * closeRate * dealSize

  // Scenario C: Cursive Super Pixel
  const cursiveIdentified = monthlyVisitors * CURSIVE_STATS.idRate
  const cursiveContactable = cursiveIdentified * (1 - CURSIVE_STATS.bounceRate)
  const cursiveIntentQualified = cursiveContactable * CURSIVE_STATS.intentQualifiedPct
  const cursiveRevenue = cursiveIntentQualified * closeRate * dealSize

  return {
    noPixel: {
      leads: Math.round(noPixelLeads),
      monthlyRevenue: Math.round(noPixelRevenue),
      annualRevenue: Math.round(noPixelRevenue * 12),
    },
    competitor: {
      identified: Math.round(compIdentified),
      contactable: Math.round(compContactable),
      monthlyRevenue: Math.round(compRevenue),
      annualRevenue: Math.round(compRevenue * 12),
    },
    cursive: {
      identified: Math.round(cursiveIdentified),
      contactable: Math.round(cursiveContactable),
      intentQualified: Math.round(cursiveIntentQualified),
      monthlyRevenue: Math.round(cursiveRevenue),
      annualRevenue: Math.round(cursiveRevenue * 12),
    },
    revenueLeak: Math.round((cursiveRevenue - noPixelRevenue) * 12),
    cursiveAdvantage: Math.round((cursiveRevenue - compRevenue) * 12),
  }
}

export function formatDollar(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}
