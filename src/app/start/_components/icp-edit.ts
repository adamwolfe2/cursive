import { COMPANY_SIZE_BANDS, SENIORITY_VALUES, type Icp } from '@/lib/free-leads/contract'

/** Pure edits on the ICP card's rows. Locations is one row over two fields (states, countries). */
export type ListKey = 'industries' | 'job_titles' | 'seniority' | 'company_size' | 'locations'

/** `max` mirrors IcpSchema limits so an edit can never produce a profile the API rejects. */
export const ROWS: Array<{ key: ListKey; label: string; max: number; options?: readonly string[] }> = [
  { key: 'industries', label: 'Industries', max: 8 },
  { key: 'job_titles', label: 'Titles', max: 12 },
  { key: 'seniority', label: 'Seniority', max: 5, options: SENIORITY_VALUES },
  { key: 'company_size', label: 'Company size', max: 8, options: COMPANY_SIZE_BANDS },
  { key: 'locations', label: 'Locations', max: 25 },
]
const FIELD_MAX = { countries: 10, states: 15 } as const

const US_STATES = new Set(
  'alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada ohio oklahoma oregon pennsylvania tennessee texas utah vermont virginia washington wisconsin wyoming'
    .split(' ')
    .concat(['new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'rhode island', 'south carolina', 'south dakota', 'west virginia'])
)

export const sizeLabel = (v: string) => (v === '10001+' ? '10,001+ people' : `${v.replace(' to ', '–')} people`)
export const chipLabel = (key: ListKey, v: string) => (key === 'company_size' ? sizeLabel(v) : v)

export function valuesFor(icp: Partial<Icp>, key: ListKey): string[] | undefined {
  if (key === 'locations') {
    if (!icp.countries && !icp.states) return undefined
    return [...(icp.states ?? []), ...(icp.countries ?? [])]
  }
  return icp[key]
}

export function withRemoved(icp: Icp, key: ListKey, value: string): Icp {
  if (key === 'locations') {
    return {
      ...icp,
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
    const isState = US_STATES.has(value.toLowerCase())
    const field = isState ? 'states' : 'countries'
    const pretty = isState ? value.replace(/\b\w/g, (c) => c.toUpperCase()) : value
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
  if (icp.states.length) out.push({ label: 'Any state or region', next: { ...icp, states: [] } })
  if (icp.company_size.length) out.push({ label: 'Any company size', next: { ...icp, company_size: [] } })
  if (icp.seniority.length) out.push({ label: 'Any seniority', next: { ...icp, seniority: [] } })
  if (icp.job_titles.length > 1)
    out.push({ label: `Drop "${icp.job_titles[icp.job_titles.length - 1]}"`, next: { ...icp, job_titles: icp.job_titles.slice(0, -1) } })
  if (icp.industries.length) out.push({ label: 'Any industry', next: { ...icp, industries: [] } })
  return out.slice(0, 3)
}
