/**
 * Launch-funnel cockpit data assembly (read-only).
 *
 * Builds the 7-stage launch funnel — Traffic → Visitor Estimate Submitted →
 * Booked Call → Bought → Installed Pixel → First Visitor Identified → Renewed —
 * with per-stage counts over a time window.
 *
 * READ-ONLY: every query is a count/select scoped by created_at. No writes.
 * Each stage is fetched independently and failure-isolated: a failing/empty
 * stage yields `count: null` (rendered as "—") instead of crashing the page.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getFunnelStepCounts, isPostHogConfigured } from '@/lib/funnel/posthog-client'
import { FUNNEL_EVENTS } from '@/lib/funnel/tracking'
import { safeError } from '@/lib/utils/log-sanitizer'

export type FunnelRange = '7d' | '30d' | 'all'

export interface LaunchFunnelStage {
  /** Stable key for React + ordering. */
  key: string
  /** Display label. */
  label: string
  /** Human-readable data source (table.column or PostHog event). */
  source: string
  /** Count for the window, or null if the stage failed / is unavailable. */
  count: number | null
  /** Optional note rendered under the stage (e.g. "PostHog not configured"). */
  note?: string
}

export interface LaunchFunnelResult {
  range: FunnelRange
  generatedAt: string
  stages: LaunchFunnelStage[]
}

const DAYS_FOR_RANGE: Record<Exclude<FunnelRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
}

/** ISO timestamp marking the start of the window, or null for all-time. */
function windowStartIso(range: FunnelRange): string | null {
  if (range === 'all') return null
  const days = DAYS_FOR_RANGE[range]
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Count rows in a table over the time window.
 * Returns null on any error so the stage degrades gracefully.
 */
async function countSince(
  supabase: AdminClient,
  table: string,
  dateColumn: string,
  sinceIso: string | null
): Promise<number | null> {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })
    if (sinceIso) query = query.gte(dateColumn, sinceIso)
    const { count, error } = await query
    if (error) {
      safeError('[launch-funnel] count failed', { table, message: error.message })
      return null
    }
    return count ?? 0
  } catch (err) {
    safeError('[launch-funnel] count threw', { table, err })
    return null
  }
}

/** Paid + post-paid funnel order statuses (everything past the Stripe checkout). */
const PAID_ORDER_STATUSES = [
  'paid',
  'awaiting_pixel',
  'awaiting_audience',
  'awaiting_delivery',
  'delivered',
] as const

/** Stage 1 — Traffic — PostHog LANDING_VIEWED (graceful if unconfigured). */
async function trafficStage(range: FunnelRange): Promise<LaunchFunnelStage> {
  const base: LaunchFunnelStage = {
    key: 'traffic',
    label: 'Traffic',
    source: `PostHog ${FUNNEL_EVENTS.LANDING_VIEWED}`,
    count: null,
  }
  if (!isPostHogConfigured()) {
    return { ...base, note: 'PostHog not configured' }
  }
  // PostHog HogQL only supports day-based lookbacks; map all-time to a wide window.
  const daysBack = range === 'all' ? 3650 : DAYS_FOR_RANGE[range]
  try {
    const steps = await getFunnelStepCounts(daysBack)
    const landed = steps.find((s) => s.name === FUNNEL_EVENTS.LANDING_VIEWED)
    if (!landed) return { ...base, note: 'PostHog not configured' }
    return { ...base, count: landed.count }
  } catch (err) {
    safeError('[launch-funnel] traffic stage failed', err)
    return { ...base, note: 'PostHog not configured' }
  }
}

/**
 * Assemble the full launch funnel for the given window. Each Supabase stage is
 * an independent count; PostHog traffic is independent and self-isolating.
 */
export async function getLaunchFunnel(range: FunnelRange): Promise<LaunchFunnelResult> {
  const since = windowStartIso(range)
  const supabase = createAdminClient()

  const [
    traffic,
    estimates,
    bookings,
    bought,
    installed,
    firstVisitor,
    renewed,
  ] = await Promise.all([
    // 1. Traffic (PostHog)
    trafficStage(range),

    // 2. Visitor Estimate Submitted
    countSince(supabase, 'visitor_estimate_leads', 'created_at', since),

    // 3. Booked Call
    countSince(supabase, 'cal_bookings', 'created_at', since),

    // 4. Bought (funnel_orders past checkout)
    (async (): Promise<number | null> => {
      try {
        let q = supabase
          .from('funnel_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', PAID_ORDER_STATUSES as unknown as string[])
        if (since) q = q.gte('created_at', since)
        const { count, error } = await q
        if (error) {
          safeError('[launch-funnel] bought failed', { message: error.message })
          return null
        }
        return count ?? 0
      } catch (err) {
        safeError('[launch-funnel] bought threw', err)
        return null
      }
    })(),

    // 5. Installed Pixel
    (async (): Promise<number | null> => {
      try {
        let q = supabase
          .from('funnel_orders')
          .select('id', { count: 'exact', head: true })
          .not('pixel_provisioned_at', 'is', null)
        if (since) q = q.gte('created_at', since)
        const { count, error } = await q
        if (error) {
          safeError('[launch-funnel] installed failed', { message: error.message })
          return null
        }
        return count ?? 0
      } catch (err) {
        safeError('[launch-funnel] installed threw', err)
        return null
      }
    })(),

    // 6. First Visitor Identified
    (async (): Promise<number | null> => {
      try {
        let q = supabase
          .from('funnel_orders')
          .select('id', { count: 'exact', head: true })
          .not('first_visitor_notified_at', 'is', null)
        if (since) q = q.gte('created_at', since)
        const { count, error } = await q
        if (error) {
          safeError('[launch-funnel] first-visitor failed', { message: error.message })
          return null
        }
        return count ?? 0
      } catch (err) {
        safeError('[launch-funnel] first-visitor threw', err)
        return null
      }
    })(),

    // 7. Renewed — subscriptions whose buyers paid ≥2 invoices.
    renewedCount(supabase, since),
  ])

  const stages: LaunchFunnelStage[] = [
    traffic,
    {
      key: 'estimate',
      label: 'Visitor Estimate Submitted',
      source: 'visitor_estimate_leads.created_at',
      count: estimates,
    },
    {
      key: 'booked',
      label: 'Booked Call',
      source: 'cal_bookings.created_at',
      count: bookings,
    },
    {
      key: 'bought',
      label: 'Bought',
      source: `funnel_orders.status in (${PAID_ORDER_STATUSES.join(', ')})`,
      count: bought,
    },
    {
      key: 'installed',
      label: 'Installed Pixel',
      source: 'funnel_orders.pixel_provisioned_at',
      count: installed,
    },
    {
      key: 'first_visitor',
      label: 'First Visitor Identified',
      source: 'funnel_orders.first_visitor_notified_at',
      count: firstVisitor,
    },
    {
      key: 'renewed',
      label: 'Renewed',
      source: 'invoices.status=paid (≥2 per subscription)',
      count: renewed,
    },
  ]

  return {
    range,
    generatedAt: new Date().toISOString(),
    stages,
  }
}

/**
 * Renewed = subscriptions with ≥2 successfully-paid invoices in the window.
 * The funnel buyer flow is anonymous (funnel_orders has no invoice link), so
 * this measures recurring revenue via the SaaS billing tables — the cleanest
 * renewal signal available in-schema. Counts distinct subscription_ids that
 * have 2+ paid invoices.
 */
async function renewedCount(
  supabase: AdminClient,
  sinceIso: string | null
): Promise<number | null> {
  try {
    let q = supabase
      .from('invoices')
      .select('subscription_id, paid_at')
      .eq('status', 'paid')
      .not('subscription_id', 'is', null)
    if (sinceIso) q = q.gte('paid_at', sinceIso)
    const { data, error } = await q.limit(10000)
    if (error) {
      safeError('[launch-funnel] renewed failed', { message: error.message })
      return null
    }
    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const sid = (row as { subscription_id: string | null }).subscription_id
      if (!sid) continue
      counts.set(sid, (counts.get(sid) ?? 0) + 1)
    }
    let renewals = 0
    for (const n of counts.values()) if (n >= 2) renewals += 1
    return renewals
  } catch (err) {
    safeError('[launch-funnel] renewed threw', err)
    return null
  }
}
