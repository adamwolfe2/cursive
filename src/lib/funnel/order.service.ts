/**
 * Funnel Order Service
 *
 * Single source of truth for funnel_orders + funnel_portal_tokens reads/writes.
 * All callers (Stripe webhook, portal API routes, admin pages) go through here.
 * No direct supabase.from('funnel_orders') / .from('funnel_portal_tokens')
 * anywhere else in the codebase.
 *
 * State transitions are forward-only — every UPDATE filters on the allowed
 * previous status and returns null if the guard fails (race-safe).
 */

import { randomBytes } from 'node:crypto'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  FUNNEL_OFFERS,
  FUNNEL_PORTAL_BASE_URL,
  type FunnelOfferSlug,
  getFunnelOffer,
  initialPaidStatus,
  nextStatusAfterAudience,
  nextStatusAfterPixel,
} from '@/lib/stripe/funnel-products'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ─── Types ─────────────────────────────────────────────────────────────

export type FunnelOrderStatus =
  | 'pending'
  | 'paid'
  | 'awaiting_pixel'
  | 'awaiting_audience'
  | 'awaiting_delivery'
  | 'delivered'
  | 'cancelled'

export type SubscriptionState =
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'incomplete'

export interface FunnelOrder {
  id: string
  stripe_session_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  customer_email: string
  customer_name: string | null
  offer_slug: FunnelOfferSlug
  monthly_price_cents: number
  status: FunnelOrderStatus

  // Stripe billing state (separate dimension from workflow status)
  subscription_state: SubscriptionState
  subscription_cancelled_at: string | null
  subscription_past_due_at: string | null

  pixel_website_url: string | null
  pixel_domain: string | null
  pixel_audiencelab_id: string | null
  pixel_snippet: string | null
  pixel_install_url: string | null
  pixel_provisioned_at: string | null
  pixel_last_event_at: string | null
  pixel_install_reminded_at: string | null
  pixel_health_alerted_at: string | null
  first_visitor_notified_at: string | null

  audience_solution: string | null
  audience_icp_description: string | null
  audience_titles: string[] | null
  audience_industries: string[] | null
  audience_employee_range: string | null
  audience_locations: string[] | null
  audience_submitted_at: string | null

  audience_sheet_url: string | null
  audience_delivered_at: string | null
  audience_pushed_at: string | null
  fulfilled_by: string | null

  last_visitor_digest_at: string | null

  // Auto-provisioned dashboard workspace (Phase 2). Null until provisioned.
  workspace_id: string | null

  created_at: string
  updated_at: string
}

export interface FunnelPortalTokenRecord {
  id: string
  order_id: string
  token: string
  email: string
  expires_at: string
  revoked: boolean
  last_accessed_at: string | null
  created_at: string
}

// ─── Email normalization (single helper, used everywhere) ───────────────

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

// ─── Token generation ───────────────────────────────────────────────────

/** 32 random bytes → 64 hex chars. Opaque to clients. */
export function generatePortalToken(): string {
  return randomBytes(32).toString('hex')
}

// ─── Webhook entrypoint ─────────────────────────────────────────────────

/**
 * Idempotent. Called by the Stripe webhook on checkout.session.completed when
 * metadata.type === 'funnel_order'.
 */
export async function createOrderFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<{ order: FunnelOrder; portalUrl: string } | null> {
  const offerSlug = session.metadata?.offer_slug
  const offer = offerSlug ? getFunnelOffer(offerSlug) : null
  if (!offer) {
    safeError(
      '[funnel/order] checkout.session missing or invalid offer_slug:',
      { session_id: session.id, offer_slug: offerSlug }
    )
    return null
  }

  const rawEmail =
    session.customer_details?.email || session.customer_email || ''
  if (!rawEmail) {
    safeError('[funnel/order] checkout.session missing customer email:', {
      session_id: session.id,
    })
    return null
  }
  const customerEmail = normalizeEmail(rawEmail)

  // Idempotency: if an order already exists for this session, return it
  const existing = await getOrderByStripeSession(session.id)
  if (existing) {
    const existingToken = await getPortalTokenForOrder(existing.id)
    if (existingToken) {
      return {
        order: existing,
        portalUrl: portalUrlForToken(existingToken.token),
      }
    }
    // Order exists but token is missing — reissue
    const reissued = await issuePortalToken(existing.id, existing.customer_email)
    return {
      order: existing,
      portalUrl: portalUrlForToken(reissued.token),
    }
  }

  // Create new order
  const initialStatus = initialPaidStatus(offer.slug)
  const customerName = session.customer_details?.name ?? null
  const supabase = createAdminClient()

  const { data: inserted, error: insertErr } = await supabase
    .from('funnel_orders')
    .insert({
      stripe_session_id: session.id,
      stripe_customer_id: (session.customer as string | null) ?? null,
      stripe_subscription_id: (session.subscription as string | null) ?? null,
      customer_email: customerEmail,
      customer_name: customerName,
      offer_slug: offer.slug,
      monthly_price_cents: offer.monthlyPriceCents,
      status: initialStatus,
    })
    .select('*')
    .single()

  if (insertErr || !inserted) {
    safeError('[funnel/order] insert failed:', insertErr)
    return null
  }

  const tokenRecord = await issuePortalToken(
    (inserted as FunnelOrder).id,
    customerEmail
  )

  safeLog('[funnel/order] order created', {
    order_id: (inserted as FunnelOrder).id,
    offer: offer.slug,
    status: initialStatus,
  })

  return {
    order: inserted as FunnelOrder,
    portalUrl: portalUrlForToken(tokenRecord.token),
  }
}

async function issuePortalToken(
  orderId: string,
  email: string
): Promise<FunnelPortalTokenRecord> {
  const supabase = createAdminClient()
  const token = generatePortalToken()

  const { data, error } = await supabase
    .from('funnel_portal_tokens')
    .insert({
      order_id: orderId,
      token,
      email: normalizeEmail(email),
    })
    .select('*')
    .single()

  if (error || !data) {
    safeError('[funnel/order] token issue failed:', error)
    throw new Error('Failed to issue portal token')
  }
  return data as FunnelPortalTokenRecord
}

// ─── Read helpers ───────────────────────────────────────────────────────

export async function getOrderByStripeSession(
  sessionId: string
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()
  return (data as FunnelOrder | null) ?? null
}

export async function getPortalTokenForOrder(
  orderId: string
): Promise<FunnelPortalTokenRecord | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funnel_portal_tokens')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as FunnelPortalTokenRecord | null) ?? null
}

// ─── Visitor feed (token-gated, scoped to the order's pixel_id) ────────

export interface FunnelVisitor {
  id: string
  received_at: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  company_name: string | null
  company_domain: string | null
  job_title: string | null
  city: string | null
  state: string | null
  country: string | null
  linkedin_url: string | null
}

export interface FunnelVisitorFeed {
  /** Count of distinct visitors in window. */
  total: number
  /** Most recent identified visitors, capped at `limit`. */
  recent: FunnelVisitor[]
  /** ISO timestamp of the most recent event — null if no events yet. */
  last_seen_at: string | null
}

/**
 * Reads identified-visitor events for a funnel order's pixel. Scoped to
 * the order's pixel_audiencelab_id so one order's token can never see
 * another order's visitors. Dedupes by hem_sha256 (one row per identified
 * person, even if they hit the site multiple times).
 */
export async function getOrderVisitors(
  pixelAudienceLabId: string,
  opts?: { limit?: number; sinceDays?: number }
): Promise<FunnelVisitorFeed> {
  const supabase = createAdminClient()
  const limit = opts?.limit ?? 50
  const sinceDays = opts?.sinceDays ?? 90
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('audiencelab_events')
    .select('id, received_at, raw, hem_sha256')
    .eq('pixel_id', pixelAudienceLabId)
    .gte('received_at', sinceIso)
    .order('received_at', { ascending: false })
    .limit(limit * 4) // headroom for dedupe pass

  if (error) {
    safeError('[funnel/order] getOrderVisitors fetch failed:', error)
    return { total: 0, recent: [], last_seen_at: null }
  }

  type EventRow = {
    id: string
    received_at: string
    raw: Record<string, unknown> | null
    hem_sha256: string | null
  }

  const rows = (data as EventRow[] | null) ?? []
  const seen = new Set<string>()
  const recent: FunnelVisitor[] = []

  for (const row of rows) {
    const dedupKey = row.hem_sha256 || row.id
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)

    const raw = (row.raw ?? {}) as Record<string, unknown>
    const get = (k: string): string | null => {
      const v = raw[k]
      return typeof v === 'string' && v.length > 0 ? v : null
    }

    recent.push({
      id: row.id,
      received_at: row.received_at,
      first_name: get('FIRST_NAME'),
      last_name: get('LAST_NAME'),
      full_name:
        get('FULL_NAME') ??
        ([get('FIRST_NAME'), get('LAST_NAME')].filter(Boolean).join(' ') ||
          null),
      email: get('BUSINESS_EMAIL') ?? get('PERSONAL_EMAIL') ?? null,
      company_name: get('COMPANY_NAME'),
      company_domain: get('COMPANY_DOMAIN'),
      job_title: get('JOB_TITLE'),
      city: get('PERSONAL_CITY') ?? get('COMPANY_CITY') ?? null,
      state: get('PERSONAL_STATE') ?? get('COMPANY_STATE') ?? null,
      country: get('PERSONAL_COUNTRY') ?? get('COMPANY_COUNTRY') ?? null,
      linkedin_url: get('INDIVIDUAL_LINKEDIN_URL') ?? null,
    })

    if (recent.length >= limit) break
  }

  return {
    total: seen.size,
    recent,
    last_seen_at: rows[0]?.received_at ?? null,
  }
}

// ─── Subscription lifecycle ────────────────────────────────────────────

/**
 * Find a funnel order by its Stripe subscription id. Returns null if the
 * subscription isn't owned by a funnel order (e.g. it's a service tier).
 */
export async function findOrderByStripeSubscriptionId(
  stripeSubscriptionId: string
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()
  return (data as FunnelOrder | null) ?? null
}

export async function findOrderByStripeCustomerId(
  stripeCustomerId: string
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as FunnelOrder | null) ?? null
}

/**
 * Idempotent subscription state setter. Use this from every Stripe webhook
 * branch so writes are always shape-checked against the same allowed set.
 */
export async function setSubscriptionState(
  orderId: string,
  state: SubscriptionState
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()

  const patch: Record<string, unknown> = { subscription_state: state }
  if (state === 'past_due') {
    patch.subscription_past_due_at = new Date().toISOString()
  }
  if (state === 'cancelled') {
    patch.subscription_cancelled_at = new Date().toISOString()
  }
  if (state === 'active') {
    // Clear past_due timestamp so the portal banner goes away
    patch.subscription_past_due_at = null
  }

  const { data, error } = await supabase
    .from('funnel_orders')
    .update(patch)
    .eq('id', orderId)
    .select('*')
    .maybeSingle()

  if (error) {
    safeError('[funnel/order] setSubscriptionState failed:', error)
    return null
  }
  return (data as FunnelOrder | null) ?? null
}

/**
 * Hard stop on cancel: deactivate the AL pixel (events stop being processed
 * for this workspace_id=null pixel), revoke ALL portal tokens for the order,
 * and flip subscription_state to cancelled.
 *
 * The pixel snippet still loads on the buyer's site — we don't have control
 * over that — but downstream events drop on the floor because the pixel
 * row is is_active=false. If they ever resubscribe we create a fresh pixel
 * + fresh token; we don't try to revive the old one.
 */
export async function cancelAndDisableOrder(orderId: string): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()

  // 1. Flip subscription_state
  const updated = await setSubscriptionState(orderId, 'cancelled')
  if (!updated) return null

  // 2. Deactivate the AL pixel so we stop processing events for it
  if (updated.pixel_audiencelab_id) {
    const { error: pixelErr } = await supabase
      .from('audiencelab_pixels')
      .update({ is_active: false })
      .eq('pixel_id', updated.pixel_audiencelab_id)
    if (pixelErr) {
      safeError('[funnel/order] pixel deactivate failed (non-fatal):', pixelErr)
    }
  }

  // 3. Revoke ALL portal tokens for this order so any open tab loses access
  const { error: tokenErr } = await supabase
    .from('funnel_portal_tokens')
    .update({ revoked: true })
    .eq('order_id', orderId)
  if (tokenErr) {
    safeError('[funnel/order] token revoke failed (non-fatal):', tokenErr)
  }

  safeLog('[funnel/order] cancelled + disabled', { order_id: orderId })
  return updated
}

// ─── Pixel firing status ───────────────────────────────────────────────

/**
 * Updates pixel_last_event_at on the order from the latest audiencelab_events
 * row. Cheap to call on every visitor-feed request — bounded query, indexed.
 */
export async function refreshPixelLastEventTimestamp(
  orderId: string,
  pixelAudienceLabId: string
): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('audiencelab_events')
    .select('received_at')
    .eq('pixel_id', pixelAudienceLabId)
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastSeen = (data as { received_at?: string } | null)?.received_at ?? null
  if (!lastSeen) return null

  await supabase
    .from('funnel_orders')
    .update({ pixel_last_event_at: lastSeen })
    .eq('id', orderId)
  return lastSeen
}

// ─── Reminder bookkeeping ──────────────────────────────────────────────

export async function markPixelInstallReminded(orderId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('funnel_orders')
    .update({ pixel_install_reminded_at: new Date().toISOString() })
    .eq('id', orderId)
}

export async function markVisitorDigestSent(orderId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('funnel_orders')
    .update({ last_visitor_digest_at: new Date().toISOString() })
    .eq('id', orderId)
}

export async function markPixelHealthAlerted(orderId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('funnel_orders')
    .update({ pixel_health_alerted_at: new Date().toISOString() })
    .eq('id', orderId)
}

export async function markFirstVisitorNotified(orderId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('funnel_orders')
    .update({ first_visitor_notified_at: new Date().toISOString() })
    .eq('id', orderId)
}

/**
 * Funnel orders that just got their FIRST visitor event but haven't been sent
 * the "aha" email yet. pixel_last_event_at is set (an event arrived) and
 * first_visitor_notified_at is still null. Active subs only.
 */
export async function findFirstVisitorCandidates(
  limit = 100
): Promise<FunnelOrder[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('subscription_state', 'active')
    .not('pixel_last_event_at', 'is', null)
    .is('first_visitor_notified_at', null)
    .limit(limit)

  return (data as FunnelOrder[] | null) ?? []
}

/**
 * Silent funnel pixels — installed but receiving zero visitor events for longer
 * than `thresholdHours`. The signal that AudienceLab isn't posting to our
 * webhook (usually a missing/incorrect x-audiencelab-secret). Drives the ops
 * health alert. Excludes orders already alerted so we notify once, not forever.
 */
export async function findSilentPixelOrders(
  thresholdHours = 6,
  limit = 100
): Promise<FunnelOrder[]> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('subscription_state', 'active')
    .not('pixel_provisioned_at', 'is', null)
    .lt('pixel_provisioned_at', cutoff)
    .is('pixel_last_event_at', null)
    .is('pixel_health_alerted_at', null)
    .limit(limit)

  return (data as FunnelOrder[] | null) ?? []
}

// ─── Cron candidates (used by Inngest functions) ───────────────────────

/**
 * Orders that:
 *   - have a pixel provisioned >24h ago
 *   - have NEVER seen a pixel event
 *   - have not been reminded yet
 *   - subscription is still active
 */
export async function findPixelInstallReminderCandidates(
  limit = 50
): Promise<FunnelOrder[]> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('subscription_state', 'active')
    .not('pixel_provisioned_at', 'is', null)
    .lt('pixel_provisioned_at', cutoff)
    .is('pixel_last_event_at', null)
    .is('pixel_install_reminded_at', null)
    .limit(limit)

  return (data as FunnelOrder[] | null) ?? []
}

/**
 * Orders eligible for a weekly visitor digest:
 *   - delivered (audience delivered, ongoing relationship)
 *   - subscription active
 *   - either never sent a digest OR last digest >6 days ago
 */
export async function findVisitorDigestCandidates(
  limit = 200
): Promise<FunnelOrder[]> {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('subscription_state', 'active')
    .not('pixel_audiencelab_id', 'is', null)
    .or(`last_visitor_digest_at.is.null,last_visitor_digest_at.lt.${cutoff}`)
    .limit(limit)

  return (data as FunnelOrder[] | null) ?? []
}

export async function listOrders(opts?: {
  limit?: number
}): Promise<FunnelOrder[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funnel_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 200)
  return (data as FunnelOrder[] | null) ?? []
}

// ─── Token-gated reads ──────────────────────────────────────────────────

export interface OrderWithToken {
  order: FunnelOrder
  tokenRecord: FunnelPortalTokenRecord
}

export type TokenLookupError = 'not_found' | 'revoked' | 'expired'

export async function getOrderByToken(
  token: string
): Promise<
  { ok: true; data: OrderWithToken } | { ok: false; error: TokenLookupError }
> {
  const supabase = createAdminClient()

  const { data: tokenRow } = await supabase
    .from('funnel_portal_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow) return { ok: false, error: 'not_found' }
  const rec = tokenRow as FunnelPortalTokenRecord
  if (rec.revoked) return { ok: false, error: 'revoked' }
  if (new Date(rec.expires_at) < new Date()) {
    return { ok: false, error: 'expired' }
  }

  const { data: orderRow } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('id', rec.order_id)
    .maybeSingle()

  if (!orderRow) return { ok: false, error: 'not_found' }

  // Awaited last-accessed bump so serverless invocations don't drop the write.
  // Errors are not fatal but are logged so we know if there's drift.
  try {
    await supabase
      .from('funnel_portal_tokens')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', rec.id)
  } catch (err) {
    safeError('[funnel/order] last_accessed_at update failed (non-fatal)', err)
  }

  return {
    ok: true,
    data: { order: orderRow as FunnelOrder, tokenRecord: rec },
  }
}

// ─── State transitions (forward-only, race-safe) ────────────────────────

/**
 * Provision pixel data on an order in a single atomic surface. Wraps the
 * audiencelab_pixels insert AND the funnel_orders update so callers don't
 * write directly to either table.
 *
 * State guard: only allowed when status is awaiting_pixel (race-safe via
 * `.in('status', [...])` filter on the update — the update returns no rows
 * if the order has already advanced).
 */
export async function provisionFunnelPixel(
  orderId: string,
  data: {
    website_url: string
    domain: string
    audiencelab_id: string
    snippet: string
    install_url: string | null
  }
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()

  // Read current order to determine next status (pixel-only → delivered;
  // bundle → awaiting_audience). We never trust the caller for offer_slug.
  const { data: existing } = await supabase
    .from('funnel_orders')
    .select('offer_slug, status, workspace_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!existing) {
    safeError('[funnel/order] provisionFunnelPixel: order not found', {
      order_id: orderId,
    })
    return null
  }

  const offerSlug = (existing as { offer_slug: FunnelOfferSlug }).offer_slug
  const nextStatus = nextStatusAfterPixel(offerSlug)
  // Phase 3: bind the pixel to the buyer's auto-provisioned workspace so the AL
  // superpixel webhook routes identified visitors → leads in their dashboard
  // (the webhook resolves workspace_id from audiencelab_pixels). Null-safe: if
  // provisioning hasn't run yet, the pixel stays orphaned but the token portal
  // feed (scoped by pixel_id) still works.
  const orderWorkspaceId =
    (existing as { workspace_id: string | null }).workspace_id ?? null

  // Insert the audiencelab_pixels row. CRITICAL — without this, the
  // AL webhook handler can't route incoming visitor events to the
  // correct funnel order (events get orphaned).
  // trial_status must match the table check constraint:
  //   trial | expired | active | cancelled | demo
  // Funnel buyers are paid so we use 'active'. We previously had 'paid'
  // which silently failed every insert because it's outside the enum.
  const { error: pixelInsertError } = await supabase
    .from('audiencelab_pixels')
    .insert({
      pixel_id: data.audiencelab_id,
      workspace_id: orderWorkspaceId,
      domain: data.domain,
      label: `${data.domain} (funnel order ${orderId.slice(0, 8)})`,
      is_active: true,
      install_url: data.install_url,
      snippet: data.snippet,
      trial_status: 'active',
      trial_ends_at: null,
    })
  if (pixelInsertError) {
    // Now that we use a valid trial_status this should not fire on
    // a fresh pixel — but log critically if it does so ops can investigate.
    safeError(
      '[funnel/order] audiencelab_pixels insert failed (CRITICAL — visitor events will orphan):',
      pixelInsertError
    )
  }

  // Race-safe forward-only state transition. .in('status', ['awaiting_pixel'])
  // means the update returns zero rows if the order has already been
  // advanced past this step by a concurrent request.
  const { data: updated, error } = await supabase
    .from('funnel_orders')
    .update({
      pixel_website_url: data.website_url,
      pixel_domain: data.domain,
      pixel_audiencelab_id: data.audiencelab_id,
      pixel_snippet: data.snippet,
      pixel_install_url: data.install_url,
      pixel_provisioned_at: new Date().toISOString(),
      status: nextStatus,
    })
    .eq('id', orderId)
    .in('status', ['awaiting_pixel'])
    .select('*')
    .maybeSingle()

  if (error) {
    safeError('[funnel/order] provisionFunnelPixel update failed:', error)
    return null
  }
  if (!updated) {
    // Race-lost: another request advanced the order. Read the current row so
    // the caller gets the latest snippet/state. Still safe — the unique
    // constraint on audiencelab_pixels prevents double pixel rows.
    const { data: current } = await supabase
      .from('funnel_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()
    return (current as FunnelOrder | null) ?? null
  }
  return updated as FunnelOrder
}

export async function recordAudienceSubmitted(
  orderId: string,
  data: {
    solution: string
    icp_description: string
    titles: string[]
    industries: string[]
    employee_range: string
    locations: string[]
  }
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()

  // Forward-only: only allowed from awaiting_audience. Bundle orders reach
  // awaiting_audience after the pixel step; audience-only orders land there
  // straight from paid (via initialPaidStatus).
  const { data: updated, error } = await supabase
    .from('funnel_orders')
    .update({
      audience_solution: data.solution,
      audience_icp_description: data.icp_description,
      audience_titles: data.titles,
      audience_industries: data.industries,
      audience_employee_range: data.employee_range,
      audience_locations: data.locations,
      audience_submitted_at: new Date().toISOString(),
      status: nextStatusAfterAudience(),
    })
    .eq('id', orderId)
    .in('status', ['awaiting_audience'])
    .select('*')
    .maybeSingle()

  if (error) {
    safeError('[funnel/order] recordAudienceSubmitted update failed:', error)
    return null
  }
  return (updated as FunnelOrder | null) ?? null
}

export async function markOrderDelivered(
  orderId: string,
  data: { sheet_url: string; fulfilled_by: string }
): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()

  const { data: updated, error } = await supabase
    .from('funnel_orders')
    .update({
      audience_sheet_url: data.sheet_url,
      audience_delivered_at: new Date().toISOString(),
      fulfilled_by: data.fulfilled_by,
      status: 'delivered',
    })
    .eq('id', orderId)
    .in('status', ['awaiting_delivery'])
    .select('*')
    .maybeSingle()

  if (error) {
    safeError('[funnel/order] markOrderDelivered update failed:', error)
    return null
  }
  return (updated as FunnelOrder | null) ?? null
}

/**
 * Phase 4: mark that the AL audience has been pushed into the workspace leads
 * table. Idempotent — only sets the timestamp if still null, so a double
 * delivery never double-pushes.
 */
export async function markAudiencePushed(orderId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('funnel_orders')
    .update({ audience_pushed_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('audience_pushed_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    safeError('[funnel/order] markAudiencePushed failed:', error)
    return false
  }
  return !!data
}

/**
 * Admin: delete a funnel order and its directly-owned data. Removes the
 * order's audiencelab_pixels row (by pixel_id) and the order itself
 * (funnel_portal_tokens cascade automatically). Workspace teardown is handled
 * separately by purgeFunnelWorkspace so real (non-funnel) workspaces are never
 * touched. Returns the deleted order (for audit) or null if not found.
 */
export async function deleteFunnelOrder(orderId: string): Promise<FunnelOrder | null> {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('funnel_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return null

  const o = order as FunnelOrder
  if (o.pixel_audiencelab_id) {
    await supabase.from('audiencelab_pixels').delete().eq('pixel_id', o.pixel_audiencelab_id)
  }

  const { error } = await supabase.from('funnel_orders').delete().eq('id', orderId)
  if (error) {
    safeError('[funnel/order] deleteFunnelOrder failed:', error)
    return null
  }
  return o
}

// ─── Helpers ────────────────────────────────────────────────────────────

export function offerForOrder(order: FunnelOrder) {
  return FUNNEL_OFFERS[order.offer_slug]
}

export function portalUrlForToken(token: string): string {
  return `${FUNNEL_PORTAL_BASE_URL}/funnel/${token}`
}
