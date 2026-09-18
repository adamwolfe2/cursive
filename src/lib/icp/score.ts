/**
 * ICP fit scoring (0-100). Pure — no I/O.
 *
 *   work email ........ 20 (25 when verified)
 *   industry .......... 25   exact AudienceLab taxonomy match
 *   seniority ......... 20
 *   title keyword ..... 15   whole-word match
 *   company size ...... 10
 *   LinkedIn profile ..  5
 *
 * Matching is exact or whole-word only: substring matching invents meaning
 * ("manufacturing" inside "manufacturing sales rep at a staffing agency").
 */
import type { IcpProfile } from './profile'

export interface IcpFitInput {
  workEmail: string | null
  workEmailVerified: boolean
  personalEmail: string | null
  companyDomain: string | null
  industry: string | null
  seniority: string | null
  jobTitle: string | null
  employeeCount: number | null
  linkedinUrl: string | null
}

export interface IcpFit {
  score: number
  isMatch: boolean
  reasons: string[]
  excluded: string | null
}

const norm = (s: string | null | undefined) => (s || '').toLowerCase().trim()

function wordMatch(text: string, keyword: string): boolean {
  const escaped = keyword.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  return escaped.length > 0 && new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text)
}

function domainOf(email: string | null): string {
  const at = (email || '').lastIndexOf('@')
  return at >= 0 ? norm(email!.slice(at + 1)) : ''
}

export function scoreIcpFit(input: IcpFitInput, icp: IcpProfile): IcpFit {
  const title = norm(input.jobTitle)
  const excludedDomains = new Set(icp.excludeDomains.map(norm))
  const domains = [norm(input.companyDomain), domainOf(input.workEmail)].filter(Boolean)
  const hitDomain = domains.find(d => excludedDomains.has(d))
  if (hitDomain) return { score: 0, isMatch: false, reasons: [], excluded: `domain ${hitDomain}` }
  const hitTitle = title ? icp.excludeTitleKeywords.find(k => wordMatch(title, k)) : undefined
  if (hitTitle) return { score: 0, isMatch: false, reasons: [], excluded: `title "${hitTitle}"` }

  let score = 0
  const reasons: string[] = []

  if (input.workEmail) {
    score += input.workEmailVerified ? 25 : 20
    reasons.push(input.workEmailVerified ? 'verified work email' : 'work email')
  }
  const industry = norm(input.industry)
  const industryMatch = !!industry && icp.industries.some(i => norm(i) === industry)
  if (industryMatch) {
    score += 25
    reasons.push(`industry: ${industry}`)
  }
  const seniority = norm(input.seniority)
  if (seniority && icp.seniority.some(s => norm(s) === seniority)) {
    score += 20
    reasons.push(`seniority: ${seniority}`)
  }
  const titleHit = title ? icp.titleKeywords.find(k => wordMatch(title, k)) : undefined
  if (titleHit) {
    score += 15
    reasons.push(`title: ${titleHit}`)
  }
  const n = input.employeeCount
  const hasSizeRule = icp.employeeMin !== undefined || icp.employeeMax !== undefined
  if (hasSizeRule && n !== null && n >= (icp.employeeMin ?? 0) && n <= (icp.employeeMax ?? Number.MAX_SAFE_INTEGER)) {
    score += 10
    reasons.push(`company size: ${n}+`)
  }
  if (input.linkedinUrl) {
    score += 5
    reasons.push('linkedin')
  }

  let final = Math.min(score, 100)
  if (icp.requireIndustry && icp.industries.length > 0 && !industryMatch) {
    final = Math.min(final, Math.max(icp.minScore - 1, 0))
  }
  return { score: final, isMatch: final >= icp.minScore, reasons, excluded: null }
}

/** Seniority: pixel events send "Cxo"/"Vp"/"Director"; audiences may send the same lowercased. */
function firstOf(val: unknown): string | null {
  if (Array.isArray(val)) return (val.find(v => typeof v === 'string' && v.trim()) as string) || null
  if (typeof val !== 'string') return null
  return val.split(',').map(s => s.trim()).find(Boolean) || null
}

function toInt(val: unknown): number | null {
  if (typeof val === 'number') return Number.isFinite(val) ? Math.trunc(val) : null
  const n = parseInt(String(val ?? '').trim(), 10)
  return Number.isFinite(n) ? n : null
}

/** Build scoring input from a raw AudienceLab record (pixel resolution or audience row). */
export function icpInputFromALRecord(r: Record<string, unknown>): IcpFitInput {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = firstOf(r[k])
      if (v) return v
    }
    return null
  }
  const verifiedWork = pick('BUSINESS_VERIFIED_EMAILS', 'business_verified_emails')
  return {
    workEmail: verifiedWork || pick('BUSINESS_EMAIL', 'BUSINESS_EMAILS', 'business_email', 'b2b_email'),
    workEmailVerified: !!verifiedWork,
    personalEmail: pick('PERSONAL_VERIFIED_EMAILS', 'PERSONAL_EMAILS', 'personal_email'),
    companyDomain: pick('COMPANY_DOMAIN', 'company_domain'),
    industry: pick('COMPANY_INDUSTRY', 'company_industry'),
    seniority: pick('SENIORITY_LEVEL', 'seniority_level'),
    jobTitle: pick('JOB_TITLE', 'job_title'),
    employeeCount: toInt(r.COMPANY_EMPLOYEE_COUNT ?? r.company_employee_count),
    linkedinUrl: pick('INDIVIDUAL_LINKEDIN_URL', 'LINKEDIN_URL', 'individual_linkedin_url', 'linkedin_url'),
  }
}
