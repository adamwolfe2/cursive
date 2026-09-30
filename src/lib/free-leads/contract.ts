/**
 * Free-leads flow — shared contract between API routes (/api/start/*) and UI (/start/*).
 * Spec: .claude/specs/2026-09-30-free-leads-flow.md. Change this file only with both sides in mind.
 */
import { z } from 'zod'

export const SENIORITY_VALUES = ['C-Team', 'VP', 'Director', 'Manager', 'Staff'] as const
export const COMPANY_SIZE_BANDS = [
  '1 to 10',
  '11 to 50',
  '51 to 200',
  '201 to 500',
  '501 to 1000',
  '1001 to 5000',
  '5001 to 10000',
  '10001+',
] as const

/** The editable ICP. Every array maps 1:1 onto a GetLeads search filter. */
export const IcpSchema = z.object({
  /** One sentence, second person: "You sell SOC 2 audits to Series A SaaS teams." */
  summary: z.string().min(1).max(240),
  /** GetLeads industry values only (see src/lib/getleads/industries.ts). */
  industries: z.array(z.string().min(1)).max(8),
  /** Free-text titles, e.g. "Head of Growth". */
  job_titles: z.array(z.string().min(1).max(80)).max(12),
  seniority: z.array(z.enum(SENIORITY_VALUES)).max(5),
  company_size: z.array(z.enum(COMPANY_SIZE_BANDS)).max(8),
  /** Country names, e.g. "United States". */
  countries: z.array(z.string().min(1)).max(10),
  /** US state names ("Texas") or other regions; maps to office_states. */
  states: z.array(z.string().min(1)).max(15),
})
export type Icp = z.infer<typeof IcpSchema>

/** Short, factual observations shown while the scan runs. */
export const FindingSchema = z.object({
  label: z.string().max(40), // "What you sell", "Who buys", "Deal size"
  text: z.string().max(160),
})
export type Finding = z.infer<typeof FindingSchema>

/** Server-Sent Events from POST /api/start/scan (body: { url }). One JSON object per `data:` line. */
export type ScanEvent =
  | { type: 'site'; domain: string; title: string | null; description: string | null; favicon: string | null }
  | { type: 'finding'; finding: Finding }
  | { type: 'icp_partial'; icp: Partial<Icp> }
  | { type: 'icp'; icp: Icp }
  | { type: 'count'; total: number }
  | { type: 'error'; code: 'invalid_url' | 'unreachable' | 'rate_limited' | 'failed'; message: string }
  | { type: 'done' }

/** POST /api/start/count  body: { icp }  -> free, no credits. */
export interface CountResponse {
  total: number
}

/** POST /api/start/refine  body: { icp, instruction }  -> AI edit of the ICP ("only Texas, add CMOs"). */
export interface RefineResponse {
  icp: Icp
  /** One short sentence describing what changed. */
  note: string
  total: number
}

/** Masked lead for the anonymous preview. */
export interface MaskedLead {
  first_name: string
  last_initial: string
  job_title: string
  company: string
  company_domain: string | null
  location: string | null
  /** e.g. "r•••@jones-dilworth.com" */
  email_masked: string
  has_linkedin: boolean
  has_phone: boolean
}

/** POST /api/start/preview  body: { icp }  -> 5 masked leads (costs credits, cached + rate-limited). */
export interface PreviewResponse {
  leads: MaskedLead[]
  total: number
}

/** POST /api/start/claim  body: ClaimRequest -> sends magic link; credits are spent only after the mailbox is verified. */
export const ClaimRequestSchema = z.object({
  email: z.string().email().max(254),
  website: z.string().min(3).max(253),
  icp: IcpSchema,
})
export type ClaimRequest = z.infer<typeof ClaimRequestSchema>
export type ClaimResponse =
  | { status: 'sent' }
  | { status: 'personal_email' } // gmail etc. — ask for a work email
  | { status: 'already_claimed' } // this email or company domain already got its free 25
  | { status: 'rate_limited' }

/** Full lead, shown only inside the authenticated workspace (/start/leads). */
export interface FullLead {
  id: string
  first_name: string
  last_name: string
  job_title: string
  seniority: string | null
  company: string
  company_domain: string | null
  industry: string | null
  company_size: string | null
  location: string | null
  email: string
  linkedin_url: string | null
  phone: string | null
}

/** GET /api/start/leads (authenticated) -> materializes the claim on first call (idempotent). */
export type LeadsResponse =
  | { status: 'ready'; icp: Icp; website: string; leads: FullLead[]; total_matching: number }
  | { status: 'no_claim' } // signed in but never claimed -> send to /start
  | { status: 'failed'; message: string }

export const UPGRADE_TIERS = ['weekly_leads', 'linkedin_outreach', 'ai_dashboard'] as const
export type UpgradeTier = (typeof UPGRADE_TIERS)[number]

/** POST /api/start/interest (authenticated) body: { tier } -> records intent, returns a booking URL. */
export interface InterestResponse {
  ok: true
  booking_url: string
}

export const FREE_LEAD_COUNT = 25
export const PREVIEW_LEAD_COUNT = 5
export const BOOKING_URL = 'https://cal.com/meetcursive/intro'
