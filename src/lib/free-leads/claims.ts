/**
 * free_lead_claims repository + fulfillment (the only place credits are spent for claims).
 *
 * Service role is required throughout: free_lead_claims has RLS enabled with no
 * policies (server-only table), and provisioning writes workspaces/users rows
 * for a user who has no workspace yet. Every leads read/write is scoped by
 * workspace_id.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { slugifyWorkspace } from '@/lib/funnel/workspace-provision'
import { FUNNEL_TIER_FEATURES } from '@/lib/workspaces/feature-flags'
import { assertConfigured, searchContacts, type GetLeadsFilters } from '@/lib/getleads/client'
import { FREE_LEAD_COUNT, IcpSchema, type FullLead, type Icp } from './contract'
import { cacheGet, previewRowsKey } from './cache'
import { OVERPULL_FACTOR, scoreLeads, selectFitLeads } from './lead-fit'
import { claudeUsd } from './cost'
import type { GetLeadsContact } from '@/lib/getleads/client'
import {
  FREE_LEADS_SOURCE,
  leadHashKey,
  STORED_LEAD_COLUMNS,
  toFullLead,
  toLeadInsert,
  usableContacts,
  MAX_PAID_PULLS,
  STALE_PROCESSING_MS,
  type ClaimStatus,
  type StoredLeadRow,
} from './rules'

type Admin = ReturnType<typeof createAdminClient>

export interface ClaimRow {
  id: string
  email: string
  email_domain: string
  website: string
  icp: unknown
  filters: GetLeadsFilters
  status: ClaimStatus
  workspace_id: string | null
  auth_user_id: string | null
  total_matching: number | null
  claim_token_hash: string | null
  attempts: number
  processing_started_at: string | null
  session_id?: string | null
}

const CLAIM_COLUMNS =
  'id, email, email_domain, website, icp, filters, status, workspace_id, auth_user_id, total_matching, claim_token_hash, attempts, processing_started_at, session_id'

/** Post-verification daily cap on paid 25-lead pulls (processing, fulfilled or failed in the last 24h). */
const DAILY_FULFILLMENT_CAP = Number(process.env.FREE_LEADS_DAILY_CLAIM_CAP) || 30

export class ClaimError extends Error {
  constructor(
    message: string,
    readonly code: 'db' | 'domain_taken' | 'upstream' | 'store',
    /** Credits billed before the failure (for cost accounting). */
    readonly credits = 0
  ) {
    super(message)
    this.name = 'ClaimError'
  }
}

function dbError(context: string, error: { message: string; code?: string }): ClaimError {
  safeError(`[free-leads/claims] ${context}`, error)
  return new ClaimError(`${context}: ${error.message}`, 'db')
}

export async function findLatestClaimByEmail(email: string, admin: Admin = createAdminClient()): Promise<ClaimRow | null> {
  const { data, error } = await admin
    .from('free_lead_claims')
    .select(CLAIM_COLUMNS)
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw dbError('claim lookup failed', error)
  return (data as ClaimRow | null) ?? null
}

/** True when a colleague at the same company already got (or is getting) the free leads. */
export async function isDomainTaken(domain: string, admin: Admin = createAdminClient()): Promise<boolean> {
  const { count, error } = await admin
    .from('free_lead_claims')
    .select('id', { count: 'exact', head: true })
    .eq('email_domain', domain)
    .in('status', ['processing', 'fulfilled'])
  if (error) throw dbError('domain lookup failed', error)
  return (count ?? 0) > 0
}

export interface PendingClaimInput {
  email: string
  emailDomain: string
  website: string
  icp: Icp
  filters: GetLeadsFilters
  ipHash: string
  /** sha256 of the link token. A refresh rotates it, so only the newest email's link works. */
  tokenHash: string
  /** Funnel session that made the claim (links later steps opened on another device). */
  sessionId?: string | null
}

/** Creates the pending claim, or refreshes an existing pending one for the same email. */
export async function upsertPendingClaim(input: PendingClaimInput, admin: Admin = createAdminClient()): Promise<void> {
  const row = {
    email: input.email,
    email_domain: input.emailDomain,
    website: input.website,
    icp: input.icp,
    filters: input.filters,
    ip_hash: input.ipHash,
    claim_token_hash: input.tokenHash,
    status: 'pending' as const,
    ...(input.sessionId ? { session_id: input.sessionId } : {}),
  }
  const { error } = await admin.from('free_lead_claims').insert(row)
  if (!error) return
  if (error.code !== '23505') throw dbError('claim insert failed', error)
  const { error: updErr } = await admin
    .from('free_lead_claims')
    .update({
      website: row.website,
      icp: row.icp,
      filters: row.filters,
      ip_hash: row.ip_hash,
      claim_token_hash: row.claim_token_hash,
      ...(input.sessionId ? { session_id: input.sessionId } : {}),
    })
    .eq('email', input.email)
    .eq('status', 'pending')
  if (updErr) throw dbError('claim refresh failed', updErr)
}

/** New link token for an already-fulfilled claim (login link back to the stored leads; no new pull). */
export async function rotateFulfilledClaimToken(claimId: string, tokenHash: string, admin: Admin = createAdminClient()): Promise<void> {
  const { error } = await admin
    .from('free_lead_claims')
    .update({ claim_token_hash: tokenHash })
    .eq('id', claimId)
    .eq('status', 'fulfilled')
  if (error) throw dbError('claim token rotate failed', error)
}

/**
 * Atomic pending -> processing. Returns false when another request already won.
 * The partial unique index on email_domain turns a colleague race into 23505,
 * which we record as failed (invariant 2).
 */
export async function beginFulfillment(claimId: string, authUserId: string, admin: Admin): Promise<boolean> {
  const { data, error } = await admin
    .from('free_lead_claims')
    .update({ status: 'processing', auth_user_id: authUserId, processing_started_at: new Date().toISOString() })
    .eq('id', claimId)
    .eq('status', 'pending')
    .lt('attempts', MAX_PAID_PULLS)
    .select('id')
    .maybeSingle()
  if (error?.code === '23505') {
    await setStatus(admin, claimId, 'failed', {})
    throw new ClaimError('company domain already claimed', 'domain_taken')
  }
  if (error) throw dbError('claim transition failed', error)
  return Boolean(data)
}

/**
 * processing -> pending. Only valid before the paid request was sent (attempts
 * still 0), which the filter enforces: after a pull the claim can never go back.
 */
export async function releaseClaim(claimId: string, admin: Admin): Promise<void> {
  const { error } = await admin
    .from('free_lead_claims')
    .update({ status: 'pending', processing_started_at: null })
    .eq('id', claimId)
    .eq('status', 'processing')
    .eq('attempts', 0)
  if (error) throw dbError('claim release failed', error)
}

/** processing -> pending for a claim stuck before any paid request (attempts 0, stale lock). */
export async function recoverStaleClaim(claimId: string, admin: Admin): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
  const { error } = await admin
    .from('free_lead_claims')
    .update({ status: 'pending', processing_started_at: null })
    .eq('id', claimId)
    .eq('status', 'processing')
    .eq('attempts', 0)
    .lt('processing_started_at', cutoff)
  if (error) throw dbError('stale claim recovery failed', error)
}

/**
 * Daily cap on paid pulls, checked after the caller already holds the processing
 * lock (so its own claim is in the count). Count-after-claim means concurrent
 * callers can only over-deny, never over-spend; a denied caller releases its lock.
 */
export async function withinDailyFulfillmentCap(admin: Admin, cap = DAILY_FULFILLMENT_CAP): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await admin
    .from('free_lead_claims')
    .select('id', { count: 'exact', head: true })
    .in('status', ['processing', 'fulfilled', 'failed'])
    .gte('processing_started_at', since)
  if (error) throw dbError('fulfillment cap count failed', error)
  return (count ?? 0) <= cap
}

/** Records the paid attempt before the request goes out. False if the lock was lost. */
async function markPullStarted(admin: Admin, claim: ClaimRow): Promise<boolean> {
  const { data, error } = await admin
    .from('free_lead_claims')
    .update({ attempts: claim.attempts + 1, processing_started_at: new Date().toISOString() })
    .eq('id', claim.id)
    .eq('status', 'processing')
    .eq('attempts', claim.attempts)
    .select('id')
    .maybeSingle()
  if (error) throw dbError('claim attempt record failed', error)
  return Boolean(data)
}

async function setStatus(admin: Admin, claimId: string, status: ClaimStatus, extra: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from('free_lead_claims').update({ status, ...extra }).eq('id', claimId)
  if (error) throw dbError(`claim -> ${status} failed`, error)
}

/** Reuses the verified user's workspace, or provisions a free one. */
async function ensureWorkspace(admin: Admin, claim: ClaimRow, authUserId: string): Promise<string> {
  const { data: existing, error } = await admin
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw dbError('user lookup failed', error)
  if (existing?.workspace_id) return existing.workspace_id as string

  const domain = claim.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const { data: ws, error: wsErr } = await admin
    .from('workspaces')
    .insert({
      name: domain || claim.email_domain,
      slug: slugifyWorkspace(domain || claim.email_domain),
      website_url: claim.website,
      visible_features: FUNNEL_TIER_FEATURES,
      onboarding_status: 'completed',
      settings: { source: 'free_leads', free_lead_claim_id: claim.id },
    })
    .select('id')
    .single()
  if (wsErr || !ws) throw dbError('workspace insert failed', wsErr ?? { message: 'no row' })

  const { error: userErr } = await admin.from('users').insert({
    auth_user_id: authUserId,
    workspace_id: ws.id,
    email: claim.email,
    role: 'owner',
    plan: 'free',
  })
  if (userErr) throw dbError('user insert failed', userErr)
  return ws.id as string
}

/**
 * Pull exactly FREE_LEAD_COUNT contacts and store them in one insert. Caller holds the processing lock.
 * Before the paid request: failures release the claim back to pending (a refresh retries).
 * After it is sent: any failure is final ('failed'); a timeout may already have been billed.
 */
/** Event meta convention: `usd` is model spend only; credits are priced separately (CREDIT_USD). */
export interface DeliveryCost {
  credits: number
  usd: number
  reused_preview: number
}

export async function fulfillClaim(claim: ClaimRow, authUserId: string, admin: Admin): Promise<DeliveryCost> {
  if (claim.attempts >= MAX_PAID_PULLS) {
    await setStatus(admin, claim.id, 'failed', {})
    throw new ClaimError('paid pull already attempted', 'upstream')
  }
  let workspaceId: string
  try {
    workspaceId = await ensureWorkspace(admin, claim, authUserId)
    assertConfigured()
    if (!(await markPullStarted(admin, claim))) throw new Error('processing lock lost')
  } catch (err) {
    safeError('[free-leads/claims] fulfillment failed before the paid request', err)
    await releaseClaim(claim.id, admin)
    throw new ClaimError('fulfillment failed', 'upstream')
  }

  // The anonymous preview for these exact filters already bought the first rows (upstream order is
  // stable, verified 2026-09-30): reuse them and buy only what comes after.
  const want = Math.ceil(FREE_LEAD_COUNT * OVERPULL_FACTOR)
  const preview = await cacheGet<{ contacts: GetLeadsContact[] }>(previewRowsKey(claim.filters), admin)
  const reused = (preview?.contacts ?? []).slice(0, want - 1)

  let pulled: Awaited<ReturnType<typeof searchContacts>>
  try {
    pulled = await searchContacts(claim.filters, { limit: want - reused.length, offset: reused.length })
  } catch (err) {
    safeError('[free-leads/claims] paid pull failed; not retrying', err)
    await setStatus(admin, claim.id, 'failed', { workspace_id: workspaceId })
    throw new ClaimError('fulfillment failed', 'upstream')
  }

  const now = new Date().toISOString()
  const candidates = await withoutStoredLeads(admin, usableContacts([...reused, ...pulled.contacts], want))
  const icp = claimIcp(claim)
  // Never throws: a failed check delivers the top rows unscored (logged in scoreLeads).
  let fitUsd = 0
  const fits = icp
    ? await scoreLeads(icp, claim.website, candidates, { delivery: true, onUsage: ({ usage, model }) => (fitUsd += claudeUsd(model, usage)) })
    : null
  const picked = selectFitLeads(candidates, fits, FREE_LEAD_COUNT)
  // Credits are already spent: if the check rejected every row, deliver them unscored rather than none.
  const chosen = picked.length || !candidates.length ? picked : selectFitLeads(candidates, null, FREE_LEAD_COUNT)
  const rows = chosen.map(({ item, fit }, rank) =>
    toLeadInsert(item, workspaceId, claim.id, now, fit ? { fit_score: fit.score, fit_why: fit.why, fit_rank: rank } : undefined)
  )
  const { error } = rows.length ? await admin.from('leads').insert(rows) : { error: null }
  if (error) {
    safeError('[free-leads/claims] leads insert failed after pull', error)
    await setStatus(admin, claim.id, 'failed', { workspace_id: workspaceId, credits_used: pulled.contacts.length })
    throw new ClaimError('storing leads failed', 'store', pulled.contacts.length)
  }
  await setStatus(admin, claim.id, 'fulfilled', {
    workspace_id: workspaceId,
    credits_used: pulled.contacts.length,
    total_matching: pulled.totalAvailable,
    fulfilled_at: now,
  })
  safeLog('[free-leads/claims] fulfilled', { claim_id: claim.id, workspace_id: workspaceId, leads: rows.length })
  return { credits: pulled.contacts.length, usd: fitUsd, reused_preview: reused.length }
}

/**
 * leads.hash_key (email|domain|phone) is unique across ALL workspaces, so one person already stored
 * anywhere would fail the whole insert after credits are spent. Skip them; the over-pull covers it.
 * Service role, cross-workspace by necessity: reads only hash_key, nothing reaches the caller.
 * A lookup error is logged and the insert proceeds (it then reports any conflict itself).
 */
async function withoutStoredLeads(admin: Admin, contacts: GetLeadsContact[]): Promise<GetLeadsContact[]> {
  if (!contacts.length) return contacts
  const hashes = contacts.map(leadHashKey)
  const { data, error } = await admin.from('leads').select('hash_key').in('hash_key', hashes)
  if (error) {
    safeError('[free-leads/claims] stored-lead lookup failed; inserting unfiltered', error)
    return contacts
  }
  const taken = new Set((data ?? []).map((r: { hash_key: string | null }) => r.hash_key))
  return contacts.filter((_, i) => !taken.has(hashes[i]))
}

export async function loadStoredLeads(workspaceId: string, claimId: string, admin: Admin): Promise<FullLead[]> {
  const { data, error } = await admin
    .from('leads')
    .select(STORED_LEAD_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('source', FREE_LEADS_SOURCE)
    .eq('metadata->>free_lead_claim_id', claimId)
    .order('created_at', { ascending: true })
    .limit(FREE_LEAD_COUNT)
  if (error) throw dbError('stored leads read failed', error)
  const rank = (r: StoredLeadRow) => (typeof r.metadata?.fit_rank === 'number' ? r.metadata.fit_rank : Number.MAX_SAFE_INTEGER)
  return [...((data ?? []) as StoredLeadRow[])].sort((a, b) => rank(a) - rank(b)).map(toFullLead)
}

export function claimIcp(claim: ClaimRow): Icp | null {
  const parsed = IcpSchema.safeParse(claim.icp)
  return parsed.success ? parsed.data : null
}

/** Adds the tier to the claim's upgrade interest. Returns true only when it is new. */
export async function recordInterest(claimId: string, tier: string, admin: Admin): Promise<boolean> {
  const { data, error } = await admin.from('free_lead_claims').select('upgrade_interest').eq('id', claimId).single()
  if (error) throw dbError('interest read failed', error)
  const current = ((data as { upgrade_interest: string[] | null }).upgrade_interest ?? []) as string[]
  if (current.includes(tier)) return false
  const { error: updErr } = await admin
    .from('free_lead_claims')
    .update({ upgrade_interest: [...current, tier] })
    .eq('id', claimId)
  if (updErr) throw dbError('interest write failed', updErr)
  return true
}
