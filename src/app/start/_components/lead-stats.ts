import { COMPANY_SIZE_BANDS, SENIORITY_VALUES, type FullLead } from '@/lib/free-leads/contract'

export type Facet = 'seniority' | 'size' | 'place'

export interface Bar {
  /** The raw lead value this bar counts, used to filter the table. */
  key: string
  label: string
  count: number
}

export interface LeadFilter {
  facet: Facet
  key: string
  label: string
}

const FACET_VALUE: Record<Facet, (l: FullLead) => string | null> = {
  seniority: (l) => l.seniority,
  size: (l) => l.company_size,
  place: (l) => l.location?.trim() || null,
}

export function matchesFilter(lead: FullLead, f: LeadFilter | null): boolean {
  return !f || FACET_VALUE[f.facet](lead) === f.key
}

export interface LeadStats {
  total: number
  linkedin: number
  phone: number
  companies: number
  locations: number
  /** C-Team, VP and Director. Null when no lead carries a seniority. */
  deciders: number | null
  seniority: Bar[]
  sizes: Bar[]
  places: Bar[]
  /** Leads with a location beyond the top places shown. */
  otherPlaces: number
}

const SENIORITY_LABEL: Record<string, string> = { 'C-Team': 'C-suite', VP: 'VP', Director: 'Director', Manager: 'Manager', Staff: 'Individual contributor' }
const DECIDERS = new Set(['C-Team', 'VP', 'Director'])

function tally(values: Array<string | null>): Map<string, number> {
  const m = new Map<string, number>()
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1)
  return m
}

/** Bars in a fixed order (seniority ladder, size bands); values outside the order go last, biggest first. */
function ordered(m: Map<string, number>, order: readonly string[], label: (v: string) => string): Bar[] {
  const rank = (v: string) => (order.includes(v) ? order.indexOf(v) : order.length)
  return [...m.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1])
    .map(([v, count]) => ({ key: v, label: label(v), count }))
}

/** Every number on the leads overview, derived from the delivered list alone. */
export function leadStats(leads: FullLead[], topPlaces = 5): LeadStats {
  const seniority = tally(leads.map(FACET_VALUE.seniority))
  const places = [...tally(leads.map(FACET_VALUE.place)).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const shown = places.slice(0, topPlaces)
  const located = places.reduce((n, [, c]) => n + c, 0)
  return {
    total: leads.length,
    linkedin: leads.filter((l) => l.linkedin_url).length,
    phone: leads.filter((l) => l.phone).length,
    companies: new Set(leads.map((l) => (l.company_domain || l.company).toLowerCase())).size,
    locations: places.length,
    deciders: seniority.size ? leads.filter((l) => l.seniority && DECIDERS.has(l.seniority)).length : null,
    seniority: ordered(seniority, SENIORITY_VALUES, (v) => SENIORITY_LABEL[v] ?? v),
    sizes: ordered(tally(leads.map(FACET_VALUE.size)), COMPANY_SIZE_BANDS, (v) => `${v.replace(' to ', '-')} people`),
    places: shown.map(([key, count]) => ({ key, label: key, count })),
    otherPlaces: located - shown.reduce((n, [, c]) => n + c, 0),
  }
}
