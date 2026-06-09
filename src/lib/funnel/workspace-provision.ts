/**
 * Funnel Workspace Provisioning (Phase 2)
 *
 * Turns a paid, anonymous funnel order into a real, loginnable workspace so
 * the buyer can access the full dashboard — not just the token portal.
 *
 * On checkout we create:
 *   1. a Supabase auth user (so magic-link login works)
 *   2. a `workspaces` row (visible_features = funnel preset → clean 3-item nav)
 *   3. a `public.users` row (role=owner) linking auth user ↔ workspace
 *   4. funnel_orders.workspace_id (race-safe, forward-only)
 *
 * Idempotent: re-running for the same order/email reuses the existing
 * workspace and never creates duplicates. Non-fatal by contract — the caller
 * (Stripe webhook) treats failure as a soft warning; the token portal still
 * delivers fulfillment regardless.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { normalizeEmail, markAudiencePushed } from './order.service'
import { FUNNEL_TIER_FEATURES } from '@/lib/workspaces/feature-flags'
import { inngest } from '@/inngest/client'
import type { FunnelOrder } from './order.service'
import { randomBytes } from 'node:crypto'

export interface ProvisionResult {
  workspaceId: string
  userId: string
  authUserId: string
  created: boolean
}

/**
 * Build a URL-safe workspace slug from a domain or email, with a short random
 * suffix so it's globally unique without a DB round-trip. Pure + testable.
 */
export function slugifyWorkspace(base: string): string {
  let raw = (base || 'workspace')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
  if (raw.includes('@')) {
    // Email → keep the local part (incl. dots), never treat it as a TLD.
    raw = raw.replace(/@.*/, '')
  } else {
    // Domain → drop a trailing TLD (.com/.io/…).
    raw = raw.replace(/\.[a-z]{2,}$/i, '')
  }
  const cleaned = raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const stem = cleaned || 'workspace'
  const suffix = randomBytes(3).toString('hex')
  return `${stem}-${suffix}`
}

/** Human-friendly workspace name from a funnel order. Pure + testable. */
export function workspaceNameForOrder(
  order: Pick<FunnelOrder, 'pixel_domain' | 'customer_name' | 'customer_email'>
): string {
  if (order.pixel_domain) return order.pixel_domain
  if (order.customer_name && order.customer_name.trim())
    return order.customer_name.trim()
  return order.customer_email
}

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Find or create the Supabase auth user for an email. Returns the auth user id.
 * createUser is the common path (brand-new buyer); the lookup branch covers the
 * rare case where an auth user exists without a public.users row.
 */
async function getOrCreateAuthUser(
  admin: AdminClient,
  email: string,
  fullName: string | null
): Promise<string | null> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  })

  if (created?.user?.id) return created.user.id

  // Likely "email already registered" — locate the existing auth user.
  const message = (error?.message || '').toLowerCase()
  if (
    error &&
    !message.includes('already') &&
    !message.includes('registered') &&
    !message.includes('exists')
  ) {
    safeError('[funnel/provision] createUser failed:', error)
    return null
  }

  for (let page = 1; page <= 20; page++) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (listErr || !list) break
    const found = list.users.find(
      (u) => (u.email || '').toLowerCase() === email
    )
    if (found) return found.id
    if (list.users.length < 200) break
  }

  safeError(
    '[funnel/provision] could not resolve existing auth user for funnel buyer'
  )
  return null
}

/**
 * Provision (or reuse) a workspace for a funnel order. Idempotent + race-safe.
 */
export async function provisionFunnelWorkspace(
  order: FunnelOrder
): Promise<ProvisionResult | null> {
  const admin = createAdminClient()
  const email = normalizeEmail(order.customer_email)

  // 0. Already provisioned for this order? Re-read to avoid stale input.
  const { data: freshOrder } = await admin
    .from('funnel_orders')
    .select('workspace_id')
    .eq('id', order.id)
    .maybeSingle()
  const existingWsId =
    (freshOrder as { workspace_id: string | null } | null)?.workspace_id ?? null
  if (existingWsId) {
    const { data: u } = await admin
      .from('users')
      .select('id, auth_user_id')
      .eq('workspace_id', existingWsId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return {
      workspaceId: existingWsId,
      userId: (u as { id: string } | null)?.id ?? '',
      authUserId: (u as { auth_user_id: string } | null)?.auth_user_id ?? '',
      created: false,
    }
  }

  // 1. Existing platform user with this email? Reuse their workspace entirely.
  const { data: existingUser } = await admin
    .from('users')
    .select('id, auth_user_id, workspace_id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser?.workspace_id) {
    await linkOrderToWorkspace(admin, order.id, existingUser.workspace_id)
    safeLog('[funnel/provision] reused existing user workspace', {
      order_id: order.id,
      workspace_id: existingUser.workspace_id,
    })
    return {
      workspaceId: existingUser.workspace_id,
      userId: existingUser.id,
      authUserId: existingUser.auth_user_id,
      created: false,
    }
  }

  // 2. Fresh provision — auth user first (public.users.auth_user_id is NOT NULL).
  const authUserId = await getOrCreateAuthUser(
    admin,
    email,
    order.customer_name
  )
  if (!authUserId) return null

  // 3. Workspace with the clean funnel nav preset.
  const name = workspaceNameForOrder(order)
  const { data: ws, error: wsErr } = await admin
    .from('workspaces')
    .insert({
      name,
      slug: slugifyWorkspace(order.pixel_domain || email),
      website_url: order.pixel_website_url ?? null,
      visible_features: FUNNEL_TIER_FEATURES,
      has_pixel_access: true,
      onboarding_status: 'completed',
      managed_by_cursive: true,
      stripe_customer_id: order.stripe_customer_id ?? null,
      settings: {
        source: 'funnel_order',
        funnel_order_id: order.id,
        offer_slug: order.offer_slug,
      },
    })
    .select('id')
    .single()

  if (wsErr || !ws) {
    safeError('[funnel/provision] workspace insert failed:', wsErr)
    return null
  }

  // 4. public.users row (owner). visible_features on the workspace gives them
  //    the clean nav; role=owner lets them manage their own workspace.
  const { data: userRow, error: userErr } = await admin
    .from('users')
    .insert({
      auth_user_id: authUserId,
      workspace_id: ws.id,
      email,
      full_name: order.customer_name ?? null,
      role: 'owner',
      plan: 'pro',
      stripe_customer_id: order.stripe_customer_id ?? null,
      stripe_subscription_id: order.stripe_subscription_id ?? null,
    })
    .select('id')
    .single()

  if (userErr || !userRow) {
    safeError('[funnel/provision] users insert failed:', userErr)
    return null
  }

  // 5. Link order → workspace, race-safe (only if still unset).
  const winnerWsId = await linkOrderToWorkspace(admin, order.id, ws.id)

  safeLog('[funnel/provision] workspace provisioned', {
    order_id: order.id,
    workspace_id: winnerWsId,
    user_id: userRow.id,
  })

  return {
    workspaceId: winnerWsId,
    userId: userRow.id,
    authUserId,
    created: true,
  }
}

/**
 * Phase 4: push the buyer's AL audience into their workspace as leads so they
 * appear in the dashboard ("Recent Leads" / "Hot Leads"). Reuses the existing
 * `provisionWorkspaceAudience` Inngest job (industry + geo segment pull) rather
 * than building a new pipeline. Idempotent via funnel_orders.audience_pushed_at.
 *
 * Non-fatal by contract — the Google Sheet remains the canonical deliverable,
 * so a failed push never blocks the admin's "mark delivered" action.
 */
export async function pushFunnelAudienceToWorkspace(
  order: FunnelOrder,
  opts: {
    /** A Studio-built audience ID to pull from (the quality path). */
    audienceId?: string
    /** Bypass the audience_pushed_at idempotency guard (admin re-sync). */
    force?: boolean
  } = {}
): Promise<boolean> {
  if (!order.workspace_id) {
    safeLog('[funnel/provision] audience push skipped — no workspace', {
      order_id: order.id,
    })
    return false
  }
  if (!opts.force && order.audience_pushed_at) return false

  const admin = createAdminClient()

  // Resolve the workspace owner for lead attribution/routing.
  const { data: owner } = await admin
    .from('users')
    .select('id')
    .eq('workspace_id', order.workspace_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const userId = (owner as { id: string } | null)?.id
  if (!userId) {
    safeError('[funnel/provision] audience push skipped — no owner user', {
      order_id: order.id,
    })
    return false
  }

  // Claim the push first (idempotent) so a retry/double-deliver can't enqueue
  // twice. An admin force-sync (a deliberate, real Studio audience) bypasses it.
  if (!opts.force) {
    const claimed = await markAudiencePushed(order.id)
    if (!claimed) return false
  }

  try {
    await inngest.send({
      name: 'audiencelab/provision-workspace-audience',
      data: {
        workspace_id: order.workspace_id,
        user_id: userId,
        industries: order.audience_industries ?? [],
        states: order.audience_locations ?? [],
        titles: order.audience_titles ?? [],
        employeeRange: order.audience_employee_range ?? '',
        ...(opts.audienceId ? { audienceId: opts.audienceId } : {}),
      },
    })
    safeLog('[funnel/provision] audience push enqueued', {
      order_id: order.id,
      workspace_id: order.workspace_id,
    })
    return true
  } catch (err) {
    safeError('[funnel/provision] inngest send failed:', err)
    return false
  }
}

/**
 * Admin: tear down a workspace that was auto-created by the funnel
 * (settings.source === 'funnel_order'). SAFETY: refuses to delete any
 * workspace not stamped as funnel-sourced — so real/admin workspaces (e.g.
 * Cursive HQ) are never removed even if a funnel order happens to be linked.
 *
 * Clears the NO-ACTION FK dependents that would otherwise block the delete
 * (audiencelab_*), then deletes the workspace (the many ON DELETE CASCADE
 * children — users, leads, crm_*, etc. — go automatically). Auth users are
 * intentionally left intact: a funnel buyer's email may also be a real
 * platform identity, so we never delete from auth.users here.
 *
 * Returns true if a funnel workspace was deleted, false if skipped/protected.
 */
export async function purgeFunnelWorkspace(workspaceId: string): Promise<boolean> {
  const admin = createAdminClient()

  const { data: ws } = await admin
    .from('workspaces')
    .select('id, settings')
    .eq('id', workspaceId)
    .maybeSingle()
  if (!ws) return false

  const source = (ws.settings as { source?: string } | null)?.source
  if (source !== 'funnel_order') {
    safeLog('[funnel/provision] purge skipped — workspace not funnel-sourced', {
      workspace_id: workspaceId,
    })
    return false
  }

  // Clear NO-ACTION FK dependents (these block a workspace delete if present).
  for (const table of [
    'audiencelab_events',
    'audiencelab_identities',
    'audiencelab_pixels',
    'audiencelab_import_jobs',
    'agents',
    'brand_workspaces',
    'ghl_app_installs',
  ]) {
    const { error } = await admin.from(table).delete().eq('workspace_id', workspaceId)
    if (error) {
      safeError(`[funnel/provision] purge dependent ${table} failed:`, error)
    }
  }

  const { error: wsErr } = await admin.from('workspaces').delete().eq('id', workspaceId)
  if (wsErr) {
    safeError('[funnel/provision] purge workspace delete failed:', wsErr)
    return false
  }

  safeLog('[funnel/provision] funnel workspace purged', { workspace_id: workspaceId })
  return true
}

/**
 * Set funnel_orders.workspace_id only if currently null (forward-only,
 * race-safe). Returns the winning workspace_id (ours, or the concurrent
 * winner's if we lost the race).
 */
async function linkOrderToWorkspace(
  admin: AdminClient,
  orderId: string,
  workspaceId: string
): Promise<string> {
  const { data: updated } = await admin
    .from('funnel_orders')
    .update({ workspace_id: workspaceId })
    .eq('id', orderId)
    .is('workspace_id', null)
    .select('workspace_id')
    .maybeSingle()

  if (updated?.workspace_id) return updated.workspace_id

  // Lost the race — read the winner.
  const { data: current } = await admin
    .from('funnel_orders')
    .select('workspace_id')
    .eq('id', orderId)
    .maybeSingle()
  return (
    (current as { workspace_id: string | null } | null)?.workspace_id ??
    workspaceId
  )
}
