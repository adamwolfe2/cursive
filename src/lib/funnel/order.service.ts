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

  pixel_website_url: string | null
  pixel_domain: string | null
  pixel_audiencelab_id: string | null
  pixel_snippet: string | null
  pixel_install_url: string | null
  pixel_provisioned_at: string | null

  audience_solution: string | null
  audience_icp_description: string | null
  audience_titles: string[] | null
  audience_industries: string[] | null
  audience_employee_range: string | null
  audience_locations: string[] | null
  audience_submitted_at: string | null

  audience_sheet_url: string | null
  audience_delivered_at: string | null
  fulfilled_by: string | null

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
    .select('offer_slug, status')
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

  // Insert the audiencelab_pixels row first. Non-fatal if it fails — the
  // snippet is also stored on the order, so the buyer still gets working
  // code. We log + alert so ops can backfill if needed.
  const { error: pixelInsertError } = await supabase
    .from('audiencelab_pixels')
    .insert({
      pixel_id: data.audiencelab_id,
      workspace_id: null,
      domain: data.domain,
      label: `${data.domain} (funnel order ${orderId.slice(0, 8)})`,
      is_active: true,
      install_url: data.install_url,
      snippet: data.snippet,
      trial_status: 'paid',
      trial_ends_at: null,
    })
  if (pixelInsertError) {
    safeError(
      '[funnel/order] audiencelab_pixels insert failed (non-fatal):',
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

// ─── Helpers ────────────────────────────────────────────────────────────

export function offerForOrder(order: FunnelOrder) {
  return FUNNEL_OFFERS[order.offer_slug]
}

export function portalUrlForToken(token: string): string {
  return `${FUNNEL_PORTAL_BASE_URL}/funnel/${token}`
}
