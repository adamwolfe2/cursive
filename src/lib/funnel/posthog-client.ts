/**
 * Server-side PostHog query client (HogQL via /api/projects/.../query).
 *
 * Read-only: counts events grouped by name + day so the admin funnel
 * analytics page can show conversion + drop-off without sucking in a
 * full SDK.
 *
 * Required env (Vercel):
 *   POSTHOG_PERSONAL_API_KEY  — phx_… token (NOT the public key)
 *   NEXT_PUBLIC_POSTHOG_HOST  — already set, defaults to us.i.posthog.com
 *   POSTHOG_PROJECT_ID        — numeric project ID from PostHog URL
 *
 * If any of those are missing, the query helpers return empty results so
 * the page still renders an empty/placeholder state instead of throwing.
 */

import { safeError } from '@/lib/utils/log-sanitizer'
import { FUNNEL_EVENTS, type FunnelEventName } from './tracking'

const PH_HOST = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
).replace(/\/$/, '')

interface PHQueryResponse {
  results?: Array<Array<unknown>>
  columns?: string[]
  hasMore?: boolean
  [k: string]: unknown
}

async function runHogQL(query: string): Promise<PHQueryResponse | null> {
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  if (!personalApiKey || !projectId) return null

  try {
    const res = await fetch(
      `${PH_HOST}/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${personalApiKey}`,
        },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
        cache: 'no-store',
      }
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      safeError('[posthog-client] HogQL failed', {
        status: res.status,
        body: body.slice(0, 200),
      })
      return null
    }
    return (await res.json()) as PHQueryResponse
  } catch (err) {
    safeError('[posthog-client] HogQL error', err)
    return null
  }
}

export interface FunnelStepCount {
  name: FunnelEventName
  label: string
  count: number
}

const STEP_LABELS: Record<FunnelEventName, string> = {
  [FUNNEL_EVENTS.LANDING_VIEWED]: 'Landed on /get-leads',
  [FUNNEL_EVENTS.VSL_LOADED]: 'VSL loaded',
  [FUNNEL_EVENTS.PRICING_UNLOCKED]: 'Pricing unlocked (gate passed)',
  [FUNNEL_EVENTS.PLAN_SELECTED]: 'Selected a plan',
  [FUNNEL_EVENTS.CHECKOUT_INITIATED]: 'Initiated checkout (Stripe)',
  [FUNNEL_EVENTS.CHECKOUT_FALLBACK_SHOWN]: 'Saw popup-blocked fallback',
  [FUNNEL_EVENTS.PORTAL_VIEWED]: 'Reached the post-pay portal',
  [FUNNEL_EVENTS.PIXEL_REQUESTED]: 'Submitted pixel form',
  [FUNNEL_EVENTS.PIXEL_PROVISIONED]: 'Pixel created in AL',
  [FUNNEL_EVENTS.PIXEL_SNIPPET_COPIED]: 'Copied the snippet',
  [FUNNEL_EVENTS.PIXEL_TEST_CLICKED]: 'Clicked Test my install',
  [FUNNEL_EVENTS.PIXEL_TEST_RESULT]: 'Test result returned',
  [FUNNEL_EVENTS.AUDIENCE_STARTED]: 'Started ICP form',
  [FUNNEL_EVENTS.AUDIENCE_SUBMITTED]: 'Submitted ICP form',
  [FUNNEL_EVENTS.BILLING_PORTAL_OPENED]: 'Opened Manage billing',
  [FUNNEL_EVENTS.BILLING_SAVE_FLOW_VIEWED]: 'Saw cancel save-flow',
  [FUNNEL_EVENTS.BILLING_SAVE_FLOW_PROCEEDED]: 'Proceeded to billing anyway',
  [FUNNEL_EVENTS.BILLING_SAVE_FLOW_DISMISSED]: 'Stayed (save-flow worked)',
  [FUNNEL_EVENTS.CANCELLED_SCREEN_VIEWED]: 'Saw cancelled-screen',
  [FUNNEL_EVENTS.PAST_DUE_BANNER_VIEWED]: 'Saw past-due banner',
}

/** Ordered funnel steps from acquisition → activation. */
const FUNNEL_ORDER: FunnelEventName[] = [
  FUNNEL_EVENTS.LANDING_VIEWED,
  FUNNEL_EVENTS.PRICING_UNLOCKED,
  FUNNEL_EVENTS.PLAN_SELECTED,
  FUNNEL_EVENTS.CHECKOUT_INITIATED,
  FUNNEL_EVENTS.PORTAL_VIEWED,
  FUNNEL_EVENTS.PIXEL_REQUESTED,
  FUNNEL_EVENTS.PIXEL_PROVISIONED,
  FUNNEL_EVENTS.AUDIENCE_SUBMITTED,
]

/**
 * Returns one row per ordered funnel step with the distinct-person count
 * over the given lookback window. Used by the admin analytics page to
 * draw the conversion bars.
 */
export async function getFunnelStepCounts(
  daysBack = 30
): Promise<FunnelStepCount[]> {
  const eventList = FUNNEL_ORDER.map((e) => `'${e}'`).join(', ')
  const query = `
    select event, count(distinct distinct_id) as people
    from events
    where event in (${eventList})
      and timestamp >= now() - interval ${Number(daysBack)} day
    group by event
  `
  const data = await runHogQL(query)
  const map = new Map<string, number>()
  for (const row of data?.results ?? []) {
    const [event, people] = row
    if (typeof event === 'string') {
      map.set(event, Number(people ?? 0))
    }
  }
  return FUNNEL_ORDER.map((name) => ({
    name,
    label: STEP_LABELS[name],
    count: map.get(name) ?? 0,
  }))
}

export interface OfferBreakdown {
  offer_slug: string
  plan_selected: number
  checkout_initiated: number
}

/** Plan-tier conversion: which tier do buyers actually choose? */
export async function getOfferBreakdown(
  daysBack = 30
): Promise<OfferBreakdown[]> {
  const query = `
    select
      properties.offer_slug as offer_slug,
      countIf(event = '${FUNNEL_EVENTS.PLAN_SELECTED}') as plan_selected,
      countIf(event = '${FUNNEL_EVENTS.CHECKOUT_INITIATED}') as checkout_initiated
    from events
    where event in ('${FUNNEL_EVENTS.PLAN_SELECTED}', '${FUNNEL_EVENTS.CHECKOUT_INITIATED}')
      and timestamp >= now() - interval ${Number(daysBack)} day
      and properties.offer_slug is not null
    group by properties.offer_slug
    order by plan_selected desc
  `
  const data = await runHogQL(query)
  return (data?.results ?? [])
    .map((row) => ({
      offer_slug: String(row[0] ?? 'unknown'),
      plan_selected: Number(row[1] ?? 0),
      checkout_initiated: Number(row[2] ?? 0),
    }))
    .filter((r) => r.offer_slug !== 'unknown')
}

export interface DailyVolume {
  day: string
  landing: number
  pricing: number
  checkout: number
}

/** Day-by-day volume for the trend chart. */
export async function getDailyVolume(daysBack = 30): Promise<DailyVolume[]> {
  const query = `
    select
      toStartOfDay(timestamp) as day,
      countIf(event = '${FUNNEL_EVENTS.LANDING_VIEWED}') as landing,
      countIf(event = '${FUNNEL_EVENTS.PRICING_UNLOCKED}') as pricing,
      countIf(event = '${FUNNEL_EVENTS.CHECKOUT_INITIATED}') as checkout
    from events
    where event in (
        '${FUNNEL_EVENTS.LANDING_VIEWED}',
        '${FUNNEL_EVENTS.PRICING_UNLOCKED}',
        '${FUNNEL_EVENTS.CHECKOUT_INITIATED}'
      )
      and timestamp >= now() - interval ${Number(daysBack)} day
    group by day
    order by day
  `
  const data = await runHogQL(query)
  return (data?.results ?? []).map((row) => ({
    day: String(row[0] ?? '').slice(0, 10),
    landing: Number(row[1] ?? 0),
    pricing: Number(row[2] ?? 0),
    checkout: Number(row[3] ?? 0),
  }))
}

export function isPostHogConfigured(): boolean {
  return Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID
  )
}
