/**
 * AudienceLab Provisioning Helpers
 *
 * Pure functions used by `provisionWorkspaceAudience` (Inngest job).
 * Extracted here so they can be unit-tested in isolation without mocking
 * Inngest's `step` runtime.
 *
 * Three concerns live here:
 *  1. Polling schedule + outcome calc — turns "AL audience is async" into
 *     a deterministic, bounded sequence of wait+check attempts.
 *  2. Workspace ICP post-filter — second line of defense in case AL's
 *     server-side filters miss (or ignore) our targeting.
 *  3. Profile → V4 resolution mapper — used by both the audience and the
 *     pixel-v4 pull paths so the insert layer sees one consistent shape.
 *
 * NOTE: This file deliberately has no Inngest, no Supabase, no fetch
 * imports. Everything is pure so tests don't need network/db setup.
 */

import type {
  ALEnrichedProfile,
  ALPixelResolutionV4,
} from './api-client'

/**
 * Wait schedule between successive `fetchAudienceRecords` poll attempts
 * after `createAudience` returns. Seconds. Total wall-clock max ≈ 8.5 min
 * — comfortable inside the 12-min step timeout, generous enough to let
 * AL finish building a typical workspace audience.
 *
 * Exported so tests can override with [0,0,0,…] for fast paths.
 */
export const AUDIENCE_POLL_DELAYS_SECONDS = [20, 40, 60, 90, 120, 180] as const

/**
 * Decide whether a single poll result means "ready", "still building",
 * "empty segment", or "unfiltered abort". Pure function of one record's
 * `total_records` plus the unfiltered threshold.
 *
 * - ready: AL returned a usable record count
 * - building: AL accepted the audience but hasn't materialized records yet
 * - unfiltered: AL returned a global slice — abort to avoid garbage leads
 */
export type PollOutcome =
  | { state: 'ready'; totalRecords: number }
  | { state: 'building' }
  | { state: 'unfiltered'; totalRecords: number }

export function classifyPollResult(
  totalRecords: number,
  unfilteredThreshold: number
): PollOutcome {
  if (totalRecords >= unfilteredThreshold) {
    return { state: 'unfiltered', totalRecords }
  }
  if (totalRecords > 0) {
    return { state: 'ready', totalRecords }
  }
  return { state: 'building' }
}

/**
 * Apply a workspace's ICP (industries + state codes) as a post-fetch
 * filter on a single AL record. AL's server-side filters occasionally
 * leak unrelated records, so we re-check here.
 *
 * Returns true when the record passes (or when the workspace has no
 * preference for that axis).
 */
export function matchesWorkspaceICP(
  record: ALEnrichedProfile,
  industries: string[],
  states: string[]
): boolean {
  if (industries.length > 0) {
    const recIndustry = (record.COMPANY_INDUSTRY || '').toLowerCase()
    if (!recIndustry) return false
    const hit = industries.some((i) => {
      const wanted = i.toLowerCase()
      return recIndustry.includes(wanted) || wanted.includes(recIndustry)
    })
    if (!hit) return false
  }

  if (states.length > 0) {
    const recState = record.PERSONAL_STATE || record.COMPANY_STATE
    if (recState && !states.includes(recState)) return false
  }

  return true
}

/**
 * Convert an AL pixel v4 resolution object into the AL enriched-profile
 * shape used by `insertLeadFromALRecord`. The two payloads share most
 * field names; this mapper fills the small gaps so callers can pretend
 * everything came from the same endpoint.
 *
 * - MOBILE_PHONE inferred from ALL_MOBILES (first entry) when missing
 * - DIRECT_NUMBER inferred from ALL_LANDLINES (first entry) when missing
 * - LinkedIn / verified email passthrough
 *
 * Returns a plain object literal — no class instance — so the catch-all
 * `[key: string]: unknown` on ALEnrichedProfile passes extra v4 fields
 * (DEPARTMENT, SENIORITY_LEVEL, HEADLINE…) through unchanged for the
 * inserter to consume.
 */
export function v4ResolutionToProfile(
  resolution: ALPixelResolutionV4
): ALEnrichedProfile {
  const firstMobile = firstCsvValue(resolution.ALL_MOBILES)
  const firstLandline = firstCsvValue(resolution.ALL_LANDLINES)

  // V4 resolution uses an index signature for non-enumerated fields, so
  // we have to coerce the inherited MOBILE_PHONE / DIRECT_NUMBER values
  // to string explicitly. They are strings at runtime when present.
  const existingMobile =
    typeof resolution.MOBILE_PHONE === 'string' ? resolution.MOBILE_PHONE : undefined
  const existingDirect =
    typeof resolution.DIRECT_NUMBER === 'string' ? resolution.DIRECT_NUMBER : undefined

  // Spread the v4 fields first so they're all carried through the
  // catch-all signature, then overlay our normalized fields on top so
  // the inserter finds them at the canonical names.
  const profile: ALEnrichedProfile = {
    ...resolution,
    MOBILE_PHONE: existingMobile || firstMobile || undefined,
    DIRECT_NUMBER: existingDirect || firstLandline || undefined,
  }

  return profile
}

function firstCsvValue(val: unknown): string | undefined {
  if (!val) return undefined
  const s = String(val)
  if (!s) return undefined
  const first = s.split(',')[0]?.trim()
  return first || undefined
}

/**
 * Extract the best email from an AL record/resolution. Mirrors the
 * canonical priority used inside `insertLeadFromALRecord` so callers
 * can early-skip records the inserter would also discard.
 */
/**
 * True when the record carries an AudienceLab-VERIFIED email
 * (BUSINESS_VERIFIED_EMAILS or PERSONAL_VERIFIED_EMAILS). The quality gate for
 * managed/funnel delivery: we only hand a client a lead whose email AL has
 * already validated, so we never deliver a bounced or junk contact. Deterministic
 * (reads AL's own verified flags) so it does not depend on a flaky live verify call.
 */
export function hasVerifiedEmail(record: ALEnrichedProfile): boolean {
  const present = (v: unknown): boolean => {
    if (Array.isArray(v)) return v.some((e) => typeof e === 'string' && e.includes('@'))
    return typeof v === 'string' && v.includes('@')
  }
  return present(record.BUSINESS_VERIFIED_EMAILS) || present(record.PERSONAL_VERIFIED_EMAILS)
}

export function pickBestEmail(record: ALEnrichedProfile): string | null {
  const bve = record.BUSINESS_VERIFIED_EMAILS
  const pve = record.PERSONAL_VERIFIED_EMAILS

  const bveVal = Array.isArray(bve)
    ? bve[0]
    : typeof bve === 'string' && bve.length > 0
      ? bve.split(',')[0]?.trim()
      : null

  if (bveVal) return bveVal

  const pveVal = Array.isArray(pve)
    ? pve[0]
    : typeof pve === 'string' && pve.length > 0
      ? pve.split(',')[0]?.trim()
      : null

  if (pveVal) return pveVal

  const personalCsv =
    typeof record.PERSONAL_EMAILS === 'string'
      ? record.PERSONAL_EMAILS.split(',')[0]?.trim()
      : null

  if (personalCsv) return personalCsv

  return record.BUSINESS_EMAIL || null
}
