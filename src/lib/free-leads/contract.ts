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

/** The editable ICP. Every array maps 1:1 onto a lead-database search filter. */
export const IcpSchema = z.object({
  /** One sentence, second person: "You sell SOC 2 audits to Series A SaaS teams." */
  summary: z.string().min(1).max(240),
  /** Lead-database industry values only (see src/lib/free-leads/industries.ts). */
  industries: z.array(z.string().min(1).max(80)).max(8),
  /** Free-text titles, e.g. "Head of Growth". */
  job_titles: z.array(z.string().min(1).max(80)).max(12),
  seniority: z.array(z.enum(SENIORITY_VALUES)).max(5),
  company_size: z.array(z.enum(COMPANY_SIZE_BANDS)).max(8),
  /** Country names, e.g. "United States". */
  countries: z.array(z.string().min(1).max(80)).max(10),
  /** US state names ("Texas") or other regions; maps to office_states. */
  states: z.array(z.string().min(1).max(80)).max(15),
  /** Metro cities for local/regional sellers ("Austin", "Round Rock"); maps to the person's city. */
  cities: z.array(z.string().min(1).max(80)).max(12).default([]),
})
export type Icp = z.infer<typeof IcpSchema>

/** What the scan extracted. `site` facts come straight from the pages; `model` facts from reading them. */
export const FACT_KEYS = ['offer', 'customers', 'pricing', 'locations', 'company'] as const
export type FactKey = (typeof FACT_KEYS)[number]
export const FACT_LABELS: Record<FactKey, string> = {
  offer: 'What you sell',
  customers: 'Who buys',
  pricing: 'Pricing',
  locations: 'Where',
  company: 'Company',
}
export interface Fact {
  key: FactKey
  label: string
  text: string // <= 160 chars
  source: 'site' | 'model'
}

/**
 * Server-Sent Events from POST /api/start/scan (body: ScanRequest). One JSON object per `data:` line.
 * Every event reports real backend progress, in this order:
 *   page(fetching "/") -> site -> page(read "/") -> page(fetching|read|failed, sub-pages) -> fact(site)*
 *   -> fact(model)* -> icp_partial* (one per completed field) -> icp -> count -> persona? -> done
 * `persona` is best-effort: a failed persona call skips the event, never the scan.
 * A repeat scan of a recently scanned site starts with `replay` and then the same events, instantly.
 */
/** One believable, fictional buyer drawn from the ICP. Plain language, no em dashes. */
export interface Persona {
  name: string // first name only, e.g. "Dana"
  role: string // "VP Operations"
  company: string // "a 12-property student-housing operator in Austin"
  day: string // 2-3 sentences: what her week actually looks like
  measured_on: string[] // 2-3 short items: what her boss judges her on
  replies_when: string // 1-2 sentences: what makes her answer a cold message
  // Absent on personas cached before 2026-10-01.
  gender?: 'woman' | 'man'
  age?: number
  /** What a portrait would show: hair, clothes for the job, the workplace behind them. Feeds the photo prompt. */
  look?: string
  /** AI-generated portrait as a data: URL (best effort; the card falls back to an initial). */
  photo?: string
}

export type ScanEvent =
  | { type: 'replay'; scanned_at: string }
  | { type: 'page'; path: string; state: 'fetching' | 'read' | 'failed'; title?: string | null; chars?: number }
  | { type: 'site'; domain: string; title: string | null; description: string | null; favicon: string | null }
  | { type: 'fact'; fact: Fact }
  | { type: 'icp_partial'; icp: Partial<Icp> }
  | { type: 'icp'; icp: Icp }
  | { type: 'count'; total: number }
  | { type: 'persona'; persona: Persona }
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
  /** One line on why this person fits (fit check); null when unavailable. */
  why: string | null
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

/** POST /api/start/email-icp body -> { status } . "Email me this profile": soft capture, any mailbox. */
/** The emailed profile is the one our scan stored for this session (anti-relay); `icp` is ignored. */
export const EmailIcpRequestSchema = z.object({
  email: z.string().email().max(254),
  website: z.string().min(3).max(253),
  icp: IcpSchema.optional(),
})
export type EmailIcpResponse = { status: 'sent' } | { status: 'rate_limited' } | { status: 'invalid_email' }
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
  /** One line on why this person fits the ICP (fit check); null when the check was unavailable. */
  why: string | null
}

/** GET /api/start/leads (authenticated) -> materializes the claim on first call (idempotent). */
export type LeadsResponse =
  | { status: 'ready'; icp: Icp; website: string; leads: FullLead[]; total_matching: number }
  | { status: 'no_claim' } // signed in but never claimed -> send to /start
  | { status: 'failed'; message: string; retryable?: boolean }

export const UPGRADE_TIERS = ['weekly_leads', 'linkedin_outreach', 'ai_dashboard'] as const
export type UpgradeTier = (typeof UPGRADE_TIERS)[number]

/** POST /api/start/interest (authenticated) body: { tier } -> records intent, returns a booking URL. */
export interface InterestResponse {
  ok: true
  booking_url: string
}

export const FREE_LEAD_COUNT = 25
export const PREVIEW_LEAD_COUNT = 5
export const BOOKING_URL = 'https://cal.com/cursiveteam/30min'

// ---- Request bodies (added by backend; additive, backward compatible) ----

/** First-touch attribution, sent with the first scan of a session. */
export const AttributionSchema = z.object({
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  ref: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
  landing: z.string().max(500).optional(),
})
export type Attribution = z.infer<typeof AttributionSchema>

/** POST /api/start/scan body. Send `url`, or `description` when the site is unreachable (paste fallback). */
export const ScanRequestSchema = z
  .object({
    url: z.string().trim().min(3).max(2048).optional(),
    description: z.string().trim().min(40).max(4000).optional(),
    attribution: AttributionSchema.optional(),
  })
  .refine((b) => Boolean(b.url || b.description), { message: 'url or description is required' })
export type ScanRequest = z.infer<typeof ScanRequestSchema>

/** POST /api/start/count and /api/start/preview body. */
export const IcpRequestSchema = z.object({ icp: IcpSchema })

/** POST /api/start/refine body. */
export const RefineRequestSchema = z.object({
  icp: IcpSchema,
  instruction: z.string().trim().min(2).max(500),
})

/** POST /api/start/interest body. */
export const InterestRequestSchema = z.object({ tier: z.enum(UPGRADE_TIERS) })

// ---- Funnel (every step, per anonymous session) ----

/** Client-generated session id (uuid v4, localStorage), sent on every /api/start/* request. */
export const SESSION_HEADER = 'x-fl-session'
export const SessionIdSchema = z.string().uuid()

export const FUNNEL_STEPS = [
  'paste', // scan requested
  'scan_done', // ICP shown
  'icp_approved', // client: primary Approve
  'icp_emailed', // "Email me this profile" sent
  'preview', // masked preview shown
  'claim', // work email submitted, link sent
  'link_opened', // magic link opened (leads page with token)
  'delivered', // 25 leads pulled and stored
  'delivery_failed', // paid pull or store failed (meta.credits billed)
  'leads_viewed', // leads page rendered the list
  'csv', // client: CSV downloaded
  'upgrade_weekly_leads',
  'upgrade_linkedin_outreach',
  'upgrade_ai_dashboard',
] as const
export type FunnelStep = (typeof FUNNEL_STEPS)[number]

/** Steps only the browser can observe. POST /api/start/event { step } with SESSION_HEADER. */
export const CLIENT_STEPS = ['icp_approved', 'csv'] as const
export const ClientEventSchema = z.object({ step: z.enum(CLIENT_STEPS) })
