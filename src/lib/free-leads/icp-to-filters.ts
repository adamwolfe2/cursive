/** Pure: editable ICP -> upstream search filters, plus a stable hash for caching. */
import { createHash } from 'node:crypto'
import { LEAD_INDUSTRIES } from '@/lib/free-leads/industries'
import type { GetLeadsFilters } from '@/lib/getleads/client'
import type { Icp } from './contract'

const INDUSTRY_SET: ReadonlySet<string> = new Set(LEAD_INDUSTRIES)

function clean(values: readonly string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))]
}

export function icpToFilters(icp: Icp): GetLeadsFilters {
  const lists: Record<Exclude<keyof GetLeadsFilters, 'email_status'>, string[]> = {
    industries: clean(icp.industries).filter((i) => INDUSTRY_SET.has(i)),
    job_titles: clean(icp.job_titles),
    seniority: clean(icp.seniority),
    company_size: clean(icp.company_size),
    countries: clean(icp.countries),
    office_states: clean(icp.states),
  }
  const nonEmpty = Object.fromEntries(Object.entries(lists).filter(([, v]) => v.length > 0))
  return { ...nonEmpty, email_status: ['VALID'] }
}

/** Order-insensitive hash of the filters (used as the preview cache key). */
export function filtersHash(filters: GetLeadsFilters): string {
  const canonical = Object.keys(filters)
    .sort()
    .map((k) => [k, [...(filters[k as keyof GetLeadsFilters] ?? [])].map((v) => v.toLowerCase()).sort()])
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}
