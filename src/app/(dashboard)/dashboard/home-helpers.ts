import type { FullLead, Icp } from '@/lib/free-leads/contract'

/** Pure helpers for FreeLeadsHome. No I/O, no mutation of inputs. */

const DECISION_SENIORITY = /^(c-?team|c-suite|cxo|vp|director|owner|founder|partner)/i
const DECISION_TITLE = /chief|founder|owner|vp|head|director|president/i

/** The next Monday strictly after `now` (UTC), as "Mon, Oct 6". */
export function nextMonday(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + (((8 - d.getUTCDay()) % 7) || 7))
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function brandName(domain: string): string {
  const root = domain.replace(/^www\./, '').split('.')[0] ?? domain
  return root.charAt(0).toUpperCase() + root.slice(1)
}

export interface HomeStat {
  label: string
  value: number
}

export function leadStats(leads: FullLead[]): HomeStat[] {
  const deciders = leads.filter((l) => DECISION_SENIORITY.test(l.seniority ?? '') || DECISION_TITLE.test(l.job_title)).length
  const companies = new Set(leads.map((l) => l.company_domain ?? l.company)).size
  return [
    { label: 'Leads in your list', value: leads.length },
    { label: 'With a checked work email', value: leads.filter((l) => l.email).length },
    { label: 'Decision makers', value: deciders },
    { label: 'Companies', value: companies },
  ]
}

/** Short, readable chips describing the ICP, in the order a person would say it. Capped so it never wraps into a wall. */
export function icpChips(icp: Icp | null, max = 8): string[] {
  if (!icp) return []
  const all = [
    ...icp.job_titles,
    ...icp.industries,
    ...icp.company_size.map((s) => `${s} people`),
    ...icp.cities,
    ...icp.states,
    ...icp.countries,
  ]
  return Array.from(new Set(all)).slice(0, max)
}

export type DeliveryStatus = 'delivering' | 'payment_issue' | 'setting_up' | 'off'

/**
 * What the weekly job will actually do for this order. Mirrors src/lib/free-leads/weekly.ts,
 * which only delivers to 'active' and 'paused' (cancelled at period end) orders.
 */
export function deliveryStatus(weekly: { state: string } | null): DeliveryStatus {
  switch (weekly?.state) {
    case 'active':
    case 'paused':
      return 'delivering'
    case 'past_due':
      return 'payment_issue'
    case 'incomplete':
      return 'setting_up'
    default:
      return 'off'
  }
}
