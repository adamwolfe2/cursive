/**
 * Admin view of the free-leads (/start) funnel: per-step session counts, measured cost per signup,
 * and one row per claim. Aggregation is pure (rows in, results out) so it is unit-tested with fixtures;
 * the loaders below only fetch capped, column-limited rows.
 *
 * Service role: free_lead_claims / free_lead_sessions / free_lead_events are server-only (RLS on, no
 * policies), and delivered leads live in a customer workspace. The only callers are the
 * /api/admin/free-leads routes, which are gated by requireAdmin() (platform admins only).
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import { FREE_LEAD_COUNT, FUNNEL_STEPS, IcpSchema, type Icp } from './contract'
import { CREDIT_USD } from './cost'

type Admin = ReturnType<typeof createAdminClient>

export type AdminRange = '7d' | '30d' | 'all'

export class FunnelAdminError extends Error {
  constructor(message: string, readonly code: 'db' | 'not_found') {
    super(message)
    this.name = 'FunnelAdminError'
  }
}

const MAX_CLAIMS = 500
const EVENT_PAGE = 1000
const MAX_EVENT_PAGES = 30
const CLAIM_CHUNK = 40 // 40 claims x 25 leads stays under the 1000-row response cap

// ---- Row shapes (only the columns we select) ----

export interface EventRow {
  session_id: string
  step: string
  created_at: string
  meta: Record<string, unknown> | null
}

export interface ClaimDbRow {
  id: string
  created_at: string
  email: string
  website: string
  icp: unknown
  status: string
  total_matching: number | null
  session_id: string | null
  upgrade_interest: string[] | null
}

export interface SessionDbRow {
  id: string
  attribution: Record<string, unknown> | null
}

export interface LeadFitRow {
  claim_id: string | null
  fit_score: string | number | null
}

// ---- Pure aggregation ----

const DAY_MS = 86_400_000

/** Start of the window as an ISO string, or null for all-time. */
export function rangeStart(range: AdminRange, now: Date = new Date()): string | null {
  if (range === 'all') return null
  return new Date(now.getTime() - (range === '7d' ? 7 : 30) * DAY_MS).toISOString()
}

export interface FunnelStepCount {
  step: string
  sessions: number
  /** Fraction of the previous step's sessions, null when that count is 0 or this is the first step. */
  vsPrev: number | null
  /** Fraction of `paste` sessions, null when paste is 0. */
  vsPaste: number | null
}

export function funnelCounts(events: readonly EventRow[], range: AdminRange, now: Date = new Date()): FunnelStepCount[] {
  const since = rangeStart(range, now)
  const bySteps = new Map<string, Set<string>>(FUNNEL_STEPS.map((s) => [s, new Set<string>()]))
  for (const e of events) {
    if (since && e.created_at < since) continue
    bySteps.get(e.step)?.add(e.session_id)
  }
  const counts = FUNNEL_STEPS.map((s) => bySteps.get(s)?.size ?? 0)
  const paste = counts[0]
  return FUNNEL_STEPS.map((step, i) => ({
    step,
    sessions: counts[i],
    vsPrev: i > 0 && counts[i - 1] > 0 ? counts[i] / counts[i - 1] : null,
    vsPaste: i > 0 && paste > 0 ? counts[i] / paste : null,
  }))
}

export interface StepCost {
  usd: number
  credits: number
  creditUsd: number
  totalUsd: number
}

export interface CostSummary extends StepCost {
  byStep: Record<string, StepCost>
  deliveredSessions: number
  /** totalUsd / distinct sessions with a `delivered` event; null when none delivered. */
  costPerDelivered: number | null
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function finishCost(usd: number, credits: number): StepCost {
  const creditUsd = credits * CREDIT_USD
  return { usd: round5(usd), credits, creditUsd: round5(creditUsd), totalUsd: round5(usd + creditUsd) }
}

/** `meta.usd` is model spend; `meta.credits` are lead-database credits priced at CREDIT_USD. */
export function costSummary(events: readonly EventRow[]): CostSummary {
  const acc = new Map<string, { usd: number; credits: number }>()
  const delivered = new Set<string>()
  let usd = 0
  let credits = 0
  for (const e of events) {
    if (e.step === 'delivered') delivered.add(e.session_id)
    const u = num(e.meta?.usd)
    const c = num(e.meta?.credits)
    if (!u && !c) continue
    usd += u
    credits += c
    const cur = acc.get(e.step) ?? { usd: 0, credits: 0 }
    acc.set(e.step, { usd: cur.usd + u, credits: cur.credits + c })
  }
  const total = finishCost(usd, credits)
  return {
    ...total,
    byStep: Object.fromEntries([...acc].map(([step, v]) => [step, finishCost(v.usd, v.credits)])),
    deliveredSessions: delivered.size,
    costPerDelivered: delivered.size ? round5(total.totalUsd / delivered.size) : null,
  }
}

export interface ClaimListRow {
  id: string
  created_at: string
  email: string
  website: string
  icp_summary: string | null
  total_matching: number | null
  status: string
  lead_count: number
  mean_fit_score: number | null
  upgrade_interest: string[]
  utm_source: string | null
  ref: string | null
}

const str = (v: unknown) => (typeof v === 'string' && v ? v : null)

export function claimRows(
  claims: readonly ClaimDbRow[],
  sessions: readonly SessionDbRow[],
  leads: readonly LeadFitRow[]
): ClaimListRow[] {
  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  const stats = new Map<string, { count: number; scored: number; sum: number }>()
  for (const l of leads) {
    if (!l.claim_id) continue
    const cur = stats.get(l.claim_id) ?? { count: 0, scored: 0, sum: 0 }
    const score = l.fit_score === null || l.fit_score === '' ? NaN : Number(l.fit_score)
    stats.set(l.claim_id, {
      count: cur.count + 1,
      scored: cur.scored + (Number.isFinite(score) ? 1 : 0),
      sum: cur.sum + (Number.isFinite(score) ? score : 0),
    })
  }
  return claims.map((c) => {
    const icp = IcpSchema.safeParse(c.icp)
    const attribution = (c.session_id ? sessionById.get(c.session_id)?.attribution : null) ?? {}
    const s = stats.get(c.id)
    return {
      id: c.id,
      created_at: c.created_at,
      email: c.email,
      website: c.website,
      icp_summary: icp.success ? icp.data.summary : null,
      total_matching: c.total_matching,
      status: c.status,
      lead_count: s?.count ?? 0,
      mean_fit_score: s && s.scored ? Math.round((s.sum / s.scored) * 100) / 100 : null,
      upgrade_interest: c.upgrade_interest ?? [],
      utm_source: str(attribution.utm_source),
      ref: str(attribution.ref),
    }
  })
}

export interface LeadDbRow {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string | null
  city: string | null
  state: string | null
  country: string | null
  metadata: { fit_score?: unknown; fit_why?: unknown; fit_rank?: unknown } | null
}

export interface LeadView {
  id: string
  name: string
  job_title: string
  company: string
  location: string | null
  fit_score: number | null
  fit_why: string | null
}

/** Ordered by metadata fit_rank (unranked last), capped at the free batch size. */
export function leadViews(rows: readonly LeadDbRow[]): LeadView[] {
  const rank = (r: LeadDbRow) => (typeof r.metadata?.fit_rank === 'number' ? r.metadata.fit_rank : Number.MAX_SAFE_INTEGER)
  return [...rows]
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, FREE_LEAD_COUNT)
    .map((r) => ({
      id: r.id,
      name: [r.first_name, r.last_name].filter(Boolean).join(' '),
      job_title: r.job_title ?? '',
      company: r.company_name ?? '',
      location: [r.city, r.state || r.country].filter(Boolean).join(', ') || null,
      fit_score: typeof r.metadata?.fit_score === 'number' ? r.metadata.fit_score : null,
      fit_why: str(r.metadata?.fit_why),
    }))
}

export interface TimelineEntry {
  step: string
  created_at: string
  usd: number | null
  credits: number | null
  cached: boolean | null
}

/** Whitelists meta fields so nothing else (model, source) reaches the browser. */
export function timeline(events: readonly EventRow[]): TimelineEntry[] {
  return [...events]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((e) => ({
      step: e.step,
      created_at: e.created_at,
      usd: typeof e.meta?.usd === 'number' ? e.meta.usd : null,
      credits: typeof e.meta?.credits === 'number' ? e.meta.credits : null,
      cached: typeof e.meta?.cached === 'boolean' ? e.meta.cached : null,
    }))
}

// ---- Loaders (service role; see header) ----

function dbError(context: string, error: { message: string }): FunnelAdminError {
  return new FunnelAdminError(`${context}: ${error.message}`, 'db')
}

const chunks = <T,>(xs: readonly T[], n: number): T[][] =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n))

/** Newest events first, paged, hard-capped so a busy window cannot exhaust memory. */
async function loadEvents(admin: Admin, since: string | null): Promise<{ events: EventRow[]; truncated: boolean }> {
  const events: EventRow[] = []
  for (let page = 0; page < MAX_EVENT_PAGES; page++) {
    let q = admin.from('free_lead_events').select('session_id, step, created_at, meta').order('id', { ascending: false })
    if (since) q = q.gte('created_at', since)
    const { data, error } = await q.range(page * EVENT_PAGE, (page + 1) * EVENT_PAGE - 1)
    if (error) throw dbError('free_lead_events read failed', error)
    events.push(...((data ?? []) as EventRow[]))
    if ((data ?? []).length < EVENT_PAGE) return { events, truncated: false }
  }
  safeWarn('[free-leads/funnel-admin] event window truncated', { cap: MAX_EVENT_PAGES * EVENT_PAGE })
  return { events, truncated: true }
}

async function loadClaims(admin: Admin, since: string | null): Promise<ClaimDbRow[]> {
  let q = admin
    .from('free_lead_claims')
    .select('id, created_at, email, website, icp, status, total_matching, session_id, upgrade_interest')
    .order('created_at', { ascending: false })
    .limit(MAX_CLAIMS)
  if (since) q = q.gte('created_at', since)
  const { data, error } = await q
  if (error) throw dbError('free_lead_claims read failed', error)
  return (data ?? []) as ClaimDbRow[]
}

async function loadSessions(admin: Admin, ids: readonly string[]): Promise<SessionDbRow[]> {
  const pages = await Promise.all(
    chunks(ids, 50).map(async (part) => {
      const { data, error } = await admin.from('free_lead_sessions').select('id, attribution').in('id', part)
      if (error) throw dbError('free_lead_sessions read failed', error)
      return (data ?? []) as SessionDbRow[]
    })
  )
  return pages.flat()
}

async function loadLeadFits(admin: Admin, claimIds: readonly string[]): Promise<LeadFitRow[]> {
  const pages = await Promise.all(
    chunks(claimIds, CLAIM_CHUNK).map(async (part) => {
      const { data, error } = await admin
        .from('leads')
        .select('claim_id:metadata->>free_lead_claim_id, fit_score:metadata->>fit_score')
        .eq('source', 'free_leads')
        .in('metadata->>free_lead_claim_id', part)
        .limit(CLAIM_CHUNK * FREE_LEAD_COUNT)
      if (error) throw dbError('leads read failed', error)
      return (data ?? []) as unknown as LeadFitRow[]
    })
  )
  return pages.flat()
}

export async function getFunnelOverview(range: AdminRange, admin: Admin = createAdminClient()) {
  const since = rangeStart(range)
  const [{ events, truncated }, claims] = await Promise.all([loadEvents(admin, since), loadClaims(admin, since)])
  const sessionIds = [...new Set(claims.map((c) => c.session_id).filter((id): id is string => Boolean(id)))]
  const [sessions, leads] = await Promise.all([loadSessions(admin, sessionIds), loadLeadFits(admin, claims.map((c) => c.id))])
  return {
    range,
    truncated,
    funnel: funnelCounts(events, range),
    cost: costSummary(events),
    claims: claimRows(claims, sessions, leads),
  }
}

export async function getClaimDetail(claimId: string, admin: Admin = createAdminClient()) {
  const { data: claim, error } = await admin
    .from('free_lead_claims')
    .select('id, created_at, fulfilled_at, email, website, icp, status, total_matching, credits_used, session_id, upgrade_interest, workspace_id')
    .eq('id', claimId)
    .maybeSingle()
  if (error) throw dbError('free_lead_claims read failed', error)
  if (!claim) throw new FunnelAdminError('claim not found', 'not_found')

  let leadQuery = admin
    .from('leads')
    .select('id, first_name, last_name, job_title, company_name, city, state, country, metadata')
    .eq('source', 'free_leads')
    .eq('metadata->>free_lead_claim_id', claimId)
    .limit(FREE_LEAD_COUNT * 2)
  if (claim.workspace_id) leadQuery = leadQuery.eq('workspace_id', claim.workspace_id)

  const [leadsRes, eventsRes, sessionRes] = await Promise.all([
    leadQuery,
    claim.session_id
      ? admin.from('free_lead_events').select('session_id, step, created_at, meta').eq('session_id', claim.session_id).order('created_at').limit(500)
      : Promise.resolve({ data: [], error: null }),
    claim.session_id
      ? admin.from('free_lead_sessions').select('id, attribution').eq('id', claim.session_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (leadsRes.error) throw dbError('leads read failed', leadsRes.error)
  if (eventsRes.error) throw dbError('free_lead_events read failed', eventsRes.error)
  if (sessionRes.error) throw dbError('free_lead_sessions read failed', sessionRes.error)

  const events = (eventsRes.data ?? []) as EventRow[]
  const icp = IcpSchema.safeParse(claim.icp)
  return {
    claim: {
      id: claim.id as string,
      created_at: claim.created_at as string,
      fulfilled_at: claim.fulfilled_at as string | null,
      email: claim.email as string,
      website: claim.website as string,
      status: claim.status as string,
      total_matching: claim.total_matching as number | null,
      credits_used: claim.credits_used as number,
      session_id: claim.session_id as string | null,
      upgrade_interest: ((claim.upgrade_interest as string[] | null) ?? []),
      attribution: (sessionRes.data as SessionDbRow | null)?.attribution ?? {},
    },
    icp: (icp.success ? icp.data : null) as Icp | null,
    leads: leadViews((leadsRes.data ?? []) as LeadDbRow[]),
    events: timeline(events),
    cost: costSummary(events),
  }
}
