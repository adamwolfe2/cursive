/**
 * Weekly leads for free-leads workspaces that subscribed (see /api/start/checkout).
 *
 * Every Monday each active order gets 25 new people for the profile it approved. Spend safety:
 * a row in free_lead_weekly_deliveries (unique per order + ISO week) is written BEFORE the paid
 * pull, so a retried or overlapping run finds it and buys nothing. A failed week stays failed
 * (alerted by the job) rather than being re-bought automatically. offset_end is the cursor that
 * moves each week past the people already pulled; stored-lead dedupe keeps out any repeats.
 *
 * Service role: claims, orders and deliveries are server-only tables; every write is scoped to
 * the order's own workspace id.
 */
import type { createAdminClient } from '@/lib/supabase/admin'
import { assertConfigured, searchContacts } from '@/lib/getleads/client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { claimIcp, findWorkspaceClaim, withoutStoredLeads } from './claims'
import { FREE_LEAD_COUNT } from './contract'
import { OVERPULL_FACTOR, scoreLeads, selectFitLeads } from './lead-fit'
import { toLeadInsert, usableContacts } from './rules'
import type { WeeklyTopLead } from '@/lib/email/templates/free-leads-weekly'

type Admin = ReturnType<typeof createAdminClient>

const WANT = Math.ceil(FREE_LEAD_COUNT * OVERPULL_FACTOR)
/** The free claim consumed the first WANT rows of the same filters; week one starts after them. */
export const FIRST_WEEKLY_OFFSET = WANT
const WEEKLY_OFFERS = ['audience_197', 'bundle_247']

export interface WeeklyOrder {
  id: string
  workspace_id: string
  /** 'paused' = cancelled at period end; still owed leads until Stripe ends the subscription. */
  subscription_state: 'active' | 'paused'
  stripe_subscription_id: string | null
}

export type WeeklyResult =
  | { status: 'delivered'; leads: number; credits: number; domain: string; top: WeeklyTopLead[] }
  | { status: 'already'; stuck: boolean }
  | { status: 'skipped'; reason: string }

/** ISO-8601 week label, e.g. 2026-W41 (weeks start Monday; week 1 holds the year's first Thursday). */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Active weekly-leads orders bound to a free-leads workspace. Trials count as active. */
export async function weeklyCandidates(admin: Admin): Promise<WeeklyOrder[]> {
  const { data: orders, error } = await admin
    .from('funnel_orders')
    .select('id, workspace_id, offer_slug, subscription_state, stripe_subscription_id')
    .in('subscription_state', ['active', 'paused'])
    .in('offer_slug', WEEKLY_OFFERS)
    .limit(1000)
  if (error) throw new Error(`weekly candidates: order lookup failed: ${error.message}`)
  const bound = ((orders ?? []) as Array<Omit<WeeklyOrder, 'workspace_id'> & { workspace_id: string | null }>).filter(
    (o): o is WeeklyOrder => Boolean(o.workspace_id)
  )
  if (!bound.length) return []

  const { data: spaces, error: wsError } = await admin
    .from('workspaces')
    .select('id, settings')
    .in('id', [...new Set(bound.map((o) => o.workspace_id))])
  if (wsError) throw new Error(`weekly candidates: workspace lookup failed: ${wsError.message}`)
  const freeLeads = new Set(
    ((spaces ?? []) as Array<{ id: string; settings: { source?: string } | null }>)
      .filter((w) => w.settings?.source === 'free_leads')
      .map((w) => w.id)
  )
  return bound
    .filter((o) => freeLeads.has(o.workspace_id))
    .map(({ id, workspace_id, subscription_state, stripe_subscription_id }) => ({ id, workspace_id, subscription_state, stripe_subscription_id }))
}

async function nextOffset(admin: Admin, orderId: string): Promise<number> {
  const { data, error } = await admin
    .from('free_lead_weekly_deliveries')
    .select('offset_end')
    .eq('order_id', orderId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`weekly cursor lookup failed: ${error.message}`)
  return (data as { offset_end: number | null } | null)?.offset_end ?? FIRST_WEEKLY_OFFSET
}

async function finish(admin: Admin, id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from('free_lead_weekly_deliveries').update(patch).eq('id', id)
  if (error) safeError('[free-leads/weekly] delivery row update failed', { id, error })
}

export async function deliverWeekly(order: WeeklyOrder, week: string, admin: Admin): Promise<WeeklyResult> {
  const claim = await findWorkspaceClaim(order.workspace_id, admin)
  if (!claim) return { status: 'skipped', reason: 'no fulfilled claim in workspace' }

  const offsetStart = await nextOffset(admin, order.id)
  // The lock: written before any spend. A duplicate (order, week) means another run owns this week.
  const { data: row, error: lockError } = await admin
    .from('free_lead_weekly_deliveries')
    .insert({ order_id: order.id, workspace_id: order.workspace_id, week, offset_start: offsetStart })
    .select('id')
    .single()
  if (lockError) {
    if ((lockError as { code?: string }).code === '23505') {
      // A row still 'started' means an earlier run died after the lock (maybe after paying): flag it.
      const { data: held } = await admin
        .from('free_lead_weekly_deliveries')
        .select('status')
        .eq('order_id', order.id)
        .eq('week', week)
        .maybeSingle()
      return { status: 'already', stuck: (held as { status?: string } | null)?.status === 'started' }
    }
    throw new Error(`weekly lock insert failed: ${lockError.message}`)
  }
  const deliveryId = (row as { id: string }).id

  let pulled: Awaited<ReturnType<typeof searchContacts>>
  try {
    assertConfigured()
    pulled = await searchContacts(claim.filters, { limit: WANT, offset: offsetStart })
  } catch (err) {
    await finish(admin, deliveryId, { status: 'failed' })
    throw new Error(`weekly pull failed for order ${order.id}: ${err instanceof Error ? err.message : String(err)}`)
  }

  const credits = pulled.contacts.length
  const candidates = await withoutStoredLeads(admin, usableContacts(pulled.contacts, WANT))
  const icp = claimIcp(claim)
  const fits = icp ? await scoreLeads(icp, claim.website, candidates, { delivery: true }) : null
  const picked = selectFitLeads(candidates, fits, FREE_LEAD_COUNT)
  // Credits are spent: if the check rejected everyone, deliver the top rows unscored rather than none.
  const chosen = picked.length || !candidates.length ? picked : selectFitLeads(candidates, null, FREE_LEAD_COUNT)

  const now = new Date().toISOString()
  const rows = chosen.map(({ item, fit }, rank) => {
    const lead = toLeadInsert(item, order.workspace_id, claim.id, now, fit ? { fit_score: fit.score, fit_why: fit.why, fit_rank: rank } : undefined)
    return { ...lead, metadata: { ...lead.metadata, weekly: week } }
  })
  if (rows.length) {
    const { error } = await admin.from('leads').insert(rows)
    if (error) {
      await finish(admin, deliveryId, { status: 'failed', credits })
      throw new Error(`weekly leads insert failed for order ${order.id}: ${error.message}`)
    }
  }

  await finish(admin, deliveryId, {
    status: 'delivered',
    offset_end: offsetStart + credits,
    leads: rows.length,
    credits,
    delivered_at: now,
  })
  safeLog('[free-leads/weekly] delivered', { order_id: order.id, workspace_id: order.workspace_id, week, leads: rows.length, credits })
  const top = chosen.slice(0, 3).map(({ item, fit }) => ({
    name: [item.first_name, item.last_name].filter(Boolean).join(' '),
    title: item.job_title,
    company: item.org_company_name,
    why: fit?.why ?? null,
  }))
  const domain = claim.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  return { status: 'delivered', leads: rows.length, credits, domain, top }
}

/** The workspace owner's email, for the Monday note. Null when there is none. */
export async function workspaceOwnerEmail(admin: Admin, workspaceId: string): Promise<string | null> {
  const { data, error } = await admin
    .from('users')
    .select('email')
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`owner lookup failed: ${error.message}`)
  return (data as { email: string | null } | null)?.email ?? null
}
