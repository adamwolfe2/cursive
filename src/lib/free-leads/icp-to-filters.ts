/** Pure: editable ICP -> upstream search filters, plus a stable hash for caching. */
import { createHash } from 'node:crypto'
import { LEAD_INDUSTRIES } from '@/lib/free-leads/industries'
import type { GetLeadsFilters } from '@/lib/getleads/client'
import type { Icp } from './contract'

const INDUSTRY_BY_LOWER: ReadonlyMap<string, string> = new Map(LEAD_INDUSTRIES.map((i) => [i.toLowerCase(), i]))

/** The database's spelling of an industry, matched case-insensitively; null when it is not in the list. */
export function canonicalIndustry(value: string): string | null {
  return INDUSTRY_BY_LOWER.get(value.trim().toLowerCase()) ?? null
}

function clean(values: readonly string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))]
}

/**
 * Umbrella tag -> its narrower tags. "Dentists" + "Hospitals and Health Care" returned hospice and
 * pharmacy staff for a dental-software seller (eval 2026-09-30): an umbrella is dropped when one of
 * its own children is also chosen. Umbrellas picked on their own (a horizontal seller's
 * "Financial Services") are kept.
 */
export const INDUSTRY_CHILDREN: Record<string, readonly string[]> = {
  'Hospitals and Health Care': [
    'Medical Practices', 'Dentists', 'Physicians', 'Optometrists', 'Chiropractors', 'Hospitals', 'Mental Health Care',
    'Home Health Care Services', 'Physical; Occupational and Speech Therapists', 'Alternative Medicine',
    'Nursing Homes and Residential Care Facilities', 'Medical and Diagnostic Laboratories', 'Veterinary Services',
  ],
  'Medical Practices': ['Dentists', 'Physicians', 'Optometrists', 'Chiropractors', 'Physical; Occupational and Speech Therapists', 'Alternative Medicine'],
  'Technology; Information and Internet': [
    'Software Development', 'IT Services and IT Consulting', 'Computer and Network Security', 'Data Security Software Products',
    'Business Intelligence Platforms', 'Internet Marketplace Platforms', 'Data Infrastructure and Analytics', 'Embedded Software Products',
    'Mobile Computing Software Products', 'Desktop Computing Software Products', 'IT System Custom Software Development',
  ],
  'Financial Services': [
    'Banking', 'Insurance', 'Investment Management', 'Venture Capital and Private Equity Principals', 'Investment Banking',
    'Capital Markets', 'Insurance Agencies and Brokerages', 'Investment Advice', 'Insurance Carriers', 'Loan Brokers', 'Credit Intermediation', 'Accounting',
  ],
  // No 'Real Estate' entry: most property managers and owners carry the plain umbrella tag, so dropping it
  // beside 'Leasing Residential Real Estate' cut leasestack.co from 6.6k to 170 contacts (probed 2026-09-30).
  Construction: [
    'Building Construction', 'Specialty Trade Contractors', 'Residential Building Construction', 'Nonresidential Building Construction',
    'Building Equipment Contractors', 'Building Structure and Exterior Contractors', 'Building Finishing Contractors', 'Civil Engineering',
  ],
  Hospitality: ['Restaurants', 'Hotels and Motels', 'Bed-and-Breakfasts; Hostels; Homestays', 'Caterers', 'Bars; Taverns; and Nightclubs', 'Food and Beverage Services'],
  'Business Consulting and Services': ['Strategic Management Services', 'Operations Consulting', 'Outsourcing and Offshoring Consulting', 'Human Resources Services'],
}

function isChildOf(parent: string, tag: string): boolean {
  if (INDUSTRY_CHILDREN[parent]?.includes(tag)) return true
  // "Retail Apparel and Fashion" under "Retail", "Wholesale Footwear" under "Wholesale", "* Manufacturing" under "Manufacturing".
  if (parent === 'Retail' || parent === 'Wholesale') return tag.startsWith(`${parent} `)
  if (parent === 'Manufacturing') return tag !== parent && tag.endsWith(' Manufacturing')
  return false
}

/** Known tags only, deduped, minus any umbrella whose narrower tag is also present. */
export function narrowIndustries(industries: readonly string[]): string[] {
  const known = clean(industries.map((i) => canonicalIndustry(i) ?? ''))
  return known.filter((parent) => !known.some((tag) => tag !== parent && isChildOf(parent, tag)))
}

// Industry / segment words models append to a title ("VP Marketing Multifamily"). Title matching is a
// contiguous substring, so such compounds match nobody (0 contacts, probed 2026-09-30); the industries
// filter carries the industry instead.
const TITLE_QUALIFIER =
  /\s+(?:multi-?family|real estate|property management|student housing|senior living|residential|commercial|healthcare|saas|software|b2b|enterprise|hospitality|retail|manufacturing)$/i
// "Director Marketing" matched 15 contacts, "Director of Marketing" 628.
const TITLE_NEEDS_OF = /^(VP|Vice President|Director)\s+(?!of\b|and\b|&)([A-Za-z]+(?:\s[A-Za-z]+){0,2})$/i
const TITLE_ROLE_WORD = /\b(manager|director|officer|lead|head|president|owner|engineer|analyst|executive)$/i

/** The plain title people actually hold: trailing industry words dropped, "VP Marketing" -> "VP of Marketing". */
export function coreTitle(title: string): string {
  let t = title.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  for (let prev = ''; prev !== t; ) {
    prev = t
    const stripped = t.replace(TITLE_QUALIFIER, '')
    // "Director of Property Management" keeps its function; never reduce to a stub.
    if (stripped.split(' ').length >= 2 && !/\b(of|and|&)$/i.test(stripped)) t = stripped
  }
  const m = TITLE_NEEDS_OF.exec(t)
  if (m && !TITLE_ROLE_WORD.test(m[2])) t = `${m[1]} of ${m[2]}`
  return t || title.trim()
}

/** Core titles, deduped case-insensitively, order kept. */
export function coreTitles(titles: readonly string[]): string[] {
  const seen = new Set<string>()
  return titles.map(coreTitle).filter((t) => {
    const k = t.toLowerCase()
    return t && !seen.has(k) && seen.add(k)
  })
}

/**
 * Titles that never buy for a small business seller. Title matching is fuzzy ("Store Manager" also
 * returned "Assistant Store Manager"), so these are excluded on every search (eval 2026-09-30).
 */
export const EXCLUDED_TITLES = ['Assistant', 'Intern', 'Student', 'Retired', 'Former'] as const

export function icpToFilters(icp: Icp): GetLeadsFilters {
  const lists: Record<Exclude<keyof GetLeadsFilters, 'email_status' | 'exclude_job_titles'>, string[]> = {
    industries: narrowIndustries(icp.industries),
    job_titles: clean(icp.job_titles),
    seniority: clean(icp.seniority),
    company_size: clean(icp.company_size),
    countries: clean(icp.countries),
    office_states: clean(icp.states),
    cities: clean(icp.cities ?? []),
  }
  const nonEmpty = Object.fromEntries(Object.entries(lists).filter(([, v]) => v.length > 0))
  return { ...nonEmpty, exclude_job_titles: [...EXCLUDED_TITLES], email_status: ['VALID'] }
}

/** Order-insensitive hash of the filters (used as the preview cache key). */
export function filtersHash(filters: GetLeadsFilters): string {
  const canonical = Object.keys(filters)
    .sort()
    .map((k) => [k, [...(filters[k as keyof GetLeadsFilters] ?? [])].map((v) => v.toLowerCase()).sort()])
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}
