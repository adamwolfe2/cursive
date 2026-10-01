import { COMPANY_SIZE_BANDS, SENIORITY_VALUES, type Icp } from '@/lib/free-leads/contract'

/** Pure edits on the ICP card's rows. Locations is one row over three fields (cities, states, countries). */
export type ListKey = 'industries' | 'job_titles' | 'seniority' | 'company_size' | 'locations'

/** `max` mirrors IcpSchema limits so an edit can never produce a profile the API rejects. */
export const ROWS: Array<{ key: ListKey; label: string; max: number; options?: readonly string[] }> = [
  { key: 'industries', label: 'Industries', max: 8 },
  { key: 'job_titles', label: 'Titles', max: 12 },
  { key: 'seniority', label: 'Seniority', max: 5, options: SENIORITY_VALUES },
  { key: 'company_size', label: 'Company size', max: 8, options: COMPANY_SIZE_BANDS },
  { key: 'locations', label: 'Locations', max: 25 },
]
const FIELD_MAX = { countries: 10, states: 15, cities: 12 } as const

const US_STATES = new Set(
  'alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada ohio oklahoma oregon pennsylvania tennessee texas utah vermont virginia washington wisconsin wyoming'
    .split(' ')
    .concat(['new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'rhode island', 'south carolina', 'south dakota', 'west virginia'])
)

// Places that are countries; anything else typed into Locations that is not a US state is a city.
const COUNTRIES = new Set(
  'united states,canada,mexico,united kingdom,ireland,germany,france,spain,italy,netherlands,belgium,switzerland,austria,sweden,norway,denmark,finland,poland,portugal,australia,new zealand,india,singapore,japan,brazil,argentina,south africa,israel,united arab emirates'.split(',')
)

export const sizeLabel = (v: string) => (v === '10001+' ? '10,001+ people' : `${v.replace(' to ', '-')} people`)
export const chipLabel = (key: ListKey, v: string) => (key === 'company_size' ? sizeLabel(v) : v)

export function valuesFor(icp: Partial<Icp>, key: ListKey): string[] | undefined {
  if (key === 'locations') {
    if (!icp.countries && !icp.states && !icp.cities) return undefined
    return [...(icp.cities ?? []), ...(icp.states ?? []), ...(icp.countries ?? [])]
  }
  return icp[key]
}

export function withRemoved(icp: Icp, key: ListKey, value: string): Icp {
  if (key === 'locations') {
    return {
      ...icp,
      cities: icp.cities.filter((v) => v !== value),
      states: icp.states.filter((v) => v !== value),
      countries: icp.countries.filter((v) => v !== value),
    }
  }
  return { ...icp, [key]: (icp[key] as string[]).filter((v) => v !== value) }
}

export function withAdded(icp: Icp, key: ListKey, raw: string): Icp {
  const value = raw.trim()
  if (!value) return icp
  if (key === 'locations') {
    const lower = value.toLowerCase()
    const field = US_STATES.has(lower) ? 'states' : COUNTRIES.has(lower) ? 'countries' : 'cities'
    // Title case everywhere: the lead database matches countries by exact name ("United States").
    const pretty = value.replace(/\b\w/g, (c) => c.toUpperCase())
    if (icp[field].some((v) => v.toLowerCase() === value.toLowerCase())) return icp
    if (icp[field].length >= FIELD_MAX[field]) return icp
    return { ...icp, [field]: [...icp[field], pretty] }
  }
  const list = icp[key] as string[]
  if (list.some((v) => v.toLowerCase() === value.toLowerCase())) return icp
  if (list.length >= (ROWS.find((r) => r.key === key)?.max ?? 0)) return icp
  return { ...icp, [key]: [...list, value] }
}

/** One-click ways out of a zero-match ICP, most restrictive first. */
export function widenings(icp: Icp): Array<{ label: string; next: Icp }> {
  const out: Array<{ label: string; next: Icp }> = []
  if (icp.cities.length)
    out.push({ label: icp.states.length ? `Anywhere in ${icp.states[0]}` : 'Any city', next: { ...icp, cities: [] } })
  if (icp.states.length) out.push({ label: 'Any state or region', next: { ...icp, states: [], cities: [] } })
  if (icp.company_size.length) out.push({ label: 'Any company size', next: { ...icp, company_size: [] } })
  if (icp.seniority.length) out.push({ label: 'Any seniority', next: { ...icp, seniority: [] } })
  if (icp.job_titles.length > 1)
    out.push({ label: `Drop "${icp.job_titles[icp.job_titles.length - 1]}"`, next: { ...icp, job_titles: icp.job_titles.slice(0, -1) } })
  if (icp.industries.length) out.push({ label: 'Any industry', next: { ...icp, industries: [] } })
  return out.slice(0, 3)
}

/** The list's own spelling of a typed value, matched case-insensitively; null when it is not in the list. */
export function matchOption(options: readonly string[], raw: string): string | null {
  const v = raw.trim().toLowerCase()
  return options.find((o) => o.toLowerCase() === v) ?? null
}

/**
 * Approve only a settled, non-zero count, and only a profile with at least one title, industry or
 * company size: locations and seniority alone match tens of millions of people.
 */
export function approveBlocker(icp: Icp, count: number | null, counting: boolean): 'not_ready' | 'too_broad' | null {
  if (counting || count === null || count === 0) return 'not_ready'
  if (!icp.job_titles.length && !icp.industries.length && !icp.company_size.length) return 'too_broad'
  return null
}
