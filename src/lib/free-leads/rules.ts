/** Pure rules for the free-leads flow: email checks, masking, row mapping, claim decisions. */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { GetLeadsContact } from '@/lib/getleads/client'
import type { FullLead, MaskedLead } from './contract'

// Neutral on purpose: source and tags render in lead cards (invariant 6).
export const FREE_LEADS_SOURCE = 'free_leads'

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

const PERSONAL_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me', 'pm.me',
  'mail.com', 'gmx.com', 'gmx.net', 'yandex.com', 'yandex.ru', 'zoho.com',
  'hey.com', 'fastmail.com', 'tutanota.com', 'duck.com', 'qq.com', '163.com',
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'cox.net',
  // Disposable
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getnada.com', 'dispostable.com', 'throwawaymail.com', 'maildrop.cc',
])

/** Regional variants such as yahoo.co.uk, hotmail.fr, outlook.de. */
const PERSONAL_PREFIX = /^(yahoo|hotmail|outlook|live|gmx|yandex)\.[a-z.]+$/

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@').pop() ?? ''
}

// ponytail: hand-kept list of two-label public suffixes, not the full Public Suffix List.
// Enough to stop free sub-domains of one registered domain (a@x1.acme.com, a@x2.acme.com) from
// each claiming; add suffixes (or the tldts package) if claims come from unlisted country domains.
const TWO_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'ltd.uk', 'plc.uk', 'me.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'org.nz',
  'co.za', 'com.br', 'com.mx', 'com.ar', 'co.jp', 'co.kr', 'co.in', 'com.sg', 'com.hk', 'com.tr', 'co.il', 'com.cn',
])

/** Registrable company domain of an email: "a@mail.eu.acme.co.uk" -> "acme.co.uk" (one free claim per company). */
export function companyDomain(email: string): string {
  const labels = emailDomain(email).split('.').filter(Boolean)
  const lastTwo = labels.slice(-2).join('.')
  return TWO_LABEL_SUFFIXES.has(lastTwo) ? labels.slice(-3).join('.') : lastTwo
}

export function isPersonalEmail(email: string): boolean {
  const domain = emailDomain(email)
  return PERSONAL_EMAIL_DOMAINS.has(domain) || PERSONAL_PREFIX.test(domain)
}

/** "risa@jones-dilworth.com" -> "r•••@jones-dilworth.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split('@')
  if (!local || !domain) return '•••'
  return `${local[0]}•••@${domain}`
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(`free-leads:${ip}`).digest('hex').slice(0, 32)
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function location(c: GetLeadsContact): string | null {
  const parts = [c.person_city, c.state_name || c.person_country_name].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

export function toMaskedLead(c: GetLeadsContact, why: string | null = null): MaskedLead {
  return {
    first_name: c.first_name,
    last_initial: c.last_name ? c.last_name[0].toUpperCase() : '',
    job_title: c.job_title,
    company: c.org_company_name,
    company_domain: c.org_domain || null,
    location: location(c),
    email_masked: maskEmail(c.email_address),
    has_linkedin: Boolean(c.person_linkedin_url),
    has_phone: Boolean(c.cellphone),
    why,
  }
}

/** Insert payload for `leads`. Mirrors the existing lead-inserter columns. */
export interface FitMeta {
  fit_score: number
  fit_why: string
  fit_rank: number
}

export function toLeadInsert(c: GetLeadsContact, workspaceId: string, claimId: string, nowIso: string, fit?: FitMeta) {
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return {
    workspace_id: workspaceId,
    source: FREE_LEADS_SOURCE,
    enrichment_status: 'enriched',
    status: 'new',
    delivered_at: nowIso,
    first_name: c.first_name || null,
    last_name: c.last_name || null,
    full_name: fullName || null,
    email: c.email_address.toLowerCase(),
    phone: c.cellphone || null,
    job_title: c.job_title || null,
    seniority_level: c.job_level ? c.job_level.slice(0, 20) : null,
    company_name: c.org_company_name || null,
    company_domain: c.org_domain || null,
    company_industry: c.org_industry_linkedin || null,
    company_size: c.employee_count_range || null,
    city: c.person_city || null,
    state: c.state_name || null,
    country: c.person_country_name || null,
    linkedin_url: c.person_linkedin_url || null,
    has_email: true,
    has_phone: Boolean(c.cellphone),
    validated: true,
    verification_status: 'verified',
    verified_at: nowIso,
    tags: [FREE_LEADS_SOURCE],
    metadata: { free_lead_claim_id: claimId, ...fit },
  }
}

export interface StoredLeadRow {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  seniority_level: string | null
  company_name: string | null
  company_domain: string | null
  company_industry: string | null
  company_size: string | null
  city: string | null
  state: string | null
  country: string | null
  email: string | null
  linkedin_url: string | null
  phone: string | null
  metadata?: { fit_why?: unknown; fit_rank?: unknown } | null
}

export const STORED_LEAD_COLUMNS =
  'id, first_name, last_name, job_title, seniority_level, company_name, company_domain, company_industry, company_size, city, state, country, email, linkedin_url, phone, metadata'

export function toFullLead(r: StoredLeadRow): FullLead {
  const loc = [r.city, r.state || r.country].filter(Boolean).join(', ')
  return {
    id: r.id,
    first_name: r.first_name ?? '',
    last_name: r.last_name ?? '',
    job_title: r.job_title ?? '',
    seniority: r.seniority_level,
    company: r.company_name ?? '',
    company_domain: r.company_domain,
    industry: r.company_industry,
    company_size: r.company_size,
    location: loc || null,
    email: r.email ?? '',
    linkedin_url: r.linkedin_url,
    phone: r.phone,
    why: typeof r.metadata?.fit_why === 'string' ? r.metadata.fit_why : null,
  }
}

/** Keep only rows with an email, one per address, capped at `max`. */
export function usableContacts(contacts: readonly GetLeadsContact[], max: number): GetLeadsContact[] {
  const seen = new Set<string>()
  return contacts
    .filter((c) => {
      const email = c.email_address.trim().toLowerCase()
      if (!email.includes('@') || seen.has(email)) return false
      seen.add(email)
      return true
    })
    .slice(0, max)
}

// ---------------------------------------------------------------------------
// Claim link token: proves mailbox access (a session alone does not, since a
// password signup may be auto-confirmed). Only the sha256 is stored.
// ---------------------------------------------------------------------------

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function newClaimToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: sha256Hex(token) }
}

/** Constant-time check of the link token against the stored hash. */
export function claimTokenMatches(token: string | null | undefined, storedHash: string | null | undefined): boolean {
  if (!token || !storedHash) return false
  const given = Buffer.from(sha256Hex(token), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  return stored.length === given.length && timingSafeEqual(given, stored)
}

/** Mailbox proof for GET /api/start/leads: the emailed link token, or being the user who already fulfilled the claim. */
export function mayAccessClaim(
  claim: { status: ClaimStatus; auth_user_id: string | null; claim_token_hash: string | null },
  token: string | null,
  userId: string
): boolean {
  if (claimTokenMatches(token, claim.claim_token_hash)) return true
  return claim.status !== 'pending' && claim.auth_user_id !== null && claim.auth_user_id === userId
}

// ---------------------------------------------------------------------------
// Claim state machine: pending -> processing -> fulfilled | failed
// processing -> pending only when nothing was sent to the paid endpoint yet.
// Once the paid pull request is sent, a failure is final (it may be billed).
// ---------------------------------------------------------------------------

export type ClaimStatus = 'pending' | 'processing' | 'fulfilled' | 'failed'

/** Paid pulls allowed per claim. Never retried automatically. */
export const MAX_PAID_PULLS = 1
/** A processing claim older than this is treated as failed (the pull may have been billed). */
export const STALE_PROCESSING_MS = 5 * 60 * 1000

export interface ClaimState {
  status: ClaimStatus
  attempts: number
  processing_started_at: string | null
}

/** What GET /api/start/leads should do for the caller's latest claim. */
export type LeadsAction = 'no_claim' | 'fulfill' | 'wait' | 'return_stored' | 'failed'

export function leadsActionFor(claim: ClaimState | null, now = Date.now()): LeadsAction {
  if (!claim) return 'no_claim'
  switch (claim.status) {
    case 'pending':
      return claim.attempts >= MAX_PAID_PULLS ? 'failed' : 'fulfill'
    case 'processing': {
      const started = claim.processing_started_at ? Date.parse(claim.processing_started_at) : NaN
      return Number.isFinite(started) && now - started < STALE_PROCESSING_MS ? 'wait' : 'failed'
    }
    case 'fulfilled':
      return 'return_stored'
    default:
      return 'failed'
  }
}

/**
 * Claim-time decision for an existing claim by the same email / same company domain.
 *  relink: this email already has its leads -> email a fresh login link to them.
 *  silent: nothing to send (colleague claimed, or this claim failed / is in flight).
 * The API answers `sent` for every case so it never reveals who has claimed.
 */
export type ClaimDecision = 'new' | 'resend' | 'relink' | 'silent'

export function claimDecisionFor(sameEmailStatus: ClaimStatus | null, domainTaken: boolean): ClaimDecision {
  if (sameEmailStatus === 'fulfilled') return 'relink'
  if (sameEmailStatus && sameEmailStatus !== 'pending') return 'silent'
  if (domainTaken) return 'silent'
  return sameEmailStatus === 'pending' ? 'resend' : 'new'
}
