/**
 * Deliver Reseller Lead — Inngest Function (isolated `cursive-reseller` app)
 *
 * Subscribes to the EXISTING `lead/created` event (already fired for every new
 * lead by edge-processor.ts). For leads whose workspace belongs to a reseller
 * end-customer, forwards the lead to the partner's configured endpoint with
 * caps, throttling, metering, signing, and retries. No-ops (fast) for all
 * non-reseller workspaces — this is why the ingestion hot path needed ZERO edits.
 *
 * SURGE HARDENING (why this uses steps, not an in-function sleep loop):
 *  - Retries are Inngest STEP retries, not a `setTimeout` loop. A failed POST
 *    releases the concurrency slot between attempts (the run is parked with
 *    backoff), so a slow/dead partner endpoint can NEVER block other deliveries.
 *  - `concurrency` caps this function to 3 concurrent runs account-wide, so
 *    reseller work can consume at most 3 of the Free plan's 5 slots — it can't
 *    starve the rest of the platform. A secondary per-end-customer key adds
 *    fairness so one customer's burst can't hog all 3.
 *  - EXACTLY-ONCE METERING: `reseller_consume_delivery` runs inside a memoized
 *    `step.run`. Inngest replays completed steps from cache on every retry, so
 *    the meter is consumed exactly once per lead even across retries. A delivery
 *    attempt consumes a slot; a subsequent failed POST is not refunded (v1).
 *
 * Served under the SEPARATE `cursive-reseller` Inngest app (see
 * src/inngest/reseller-client.ts) so it syncs on the Free plan even though the
 * main app's sync is rejected for declaring concurrency above the account cap.
 */

import { resellerInngest } from '../reseller-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { decideDelivery, consumeDelivery, recordDelivery } from '@/lib/reseller/metering.service'
import { buildOutboundPayload } from '@/lib/reseller/payload'
import { deliverToPartner } from '@/lib/reseller/delivery.service'
import type { Reseller, ResellerPixel, LeadRow, DeliveryOutcome } from '@/lib/reseller/types'

const LEAD_COLUMNS =
  'id, email, first_name, last_name, full_name, company_name, company_domain, job_title, phone, city, state, state_code, created_at'

/** A 4xx (except 408/429) is a permanent partner-side rejection — do not retry. */
function isRetryableStatus(status: number | null): boolean {
  if (status == null) return true // network/timeout — retry
  if (status >= 500) return true
  return status === 408 || status === 429
}

/** 4 retries = 5 total attempts per step, matching the prior backoff loop. */
const STEP_RETRIES = 4

/**
 * Map a block reason to the audit/rollup status. Inactive and suspended skips
 * must NOT be counted as 'skipped_cap' — otherwise a deactivated pixel (which
 * keeps capturing by design) inflates leads_skipped_cap forever and partners
 * conclude their caps are too low. Cap reasons (reseller_cap/pixel_cap) and any
 * unexpected reason fall through to 'skipped_cap'.
 */
function skipStatusForReason(reason: string | null | undefined): DeliveryOutcome {
  if (reason === 'inactive') return 'skipped_inactive'
  if (reason === 'reseller_suspended') return 'skipped_suspended'
  return 'skipped_cap'
}

export const deliverResellerLead = resellerInngest.createFunction(
  {
    id: 'deliver-reseller-lead',
    // Between attempts the concurrency slot is FREED (Inngest backoff), unlike the
    // old setTimeout loop which held the slot the whole time.
    retries: STEP_RETRIES,
    // Account-pool protection: never use more than 3 of the Free plan's 5 slots.
    // Secondary key = per-end-customer fairness (event data only carries
    // workspace_id; each reseller pixel maps 1:1 to a child workspace, so this is
    // effectively per-end-customer). We cannot key on reseller_id because
    // edge-processor fires a generic `lead/created` (zero-diff hot path).
    concurrency: [
      { limit: 3 },
      { limit: 2, key: 'event.data.workspace_id' },
    ],
    // Wall-clock bound for a whole run INCLUDING retry backoff. Inngest's default
    // backoff table is ~15s/30s/60s/120s (+0-30s jitter each), so 4 retries of the
    // deliver step can legitimately take ~7 minutes end to end. 5m (the previous
    // value) would CANCEL the run mid-backoff and skip the record-outcome step,
    // consuming a cap slot with no audit row. 15m clears the worst case with
    // headroom while still killing zombie runs.
    timeouts: { finish: '15m' },
  },
  { event: 'lead/created' },
  async ({ event, step, attempt }) => {
    const { lead_id, workspace_id } = event.data as { lead_id: string; workspace_id: string }
    if (!lead_id || !workspace_id) return { skipped: true, reason: 'missing_ids' }

    // 1. Load all context in ONE memoized step (read-only; safe to replay).
    //    The lead is fetched scoped to the SAME workspace as the reseller pixel —
    //    a malformed/replayed event whose lead_id belongs to another workspace
    //    resolves to null and is skipped, so a reseller can never receive another
    //    tenant's lead.
    const ctx = await step.run('load-context', async () => {
      const supabase = createAdminClient()
      const { data: pixelRow } = await supabase
        .from('reseller_pixels')
        .select('*')
        .eq('workspace_id', workspace_id)
        .maybeSingle()
      if (!pixelRow) return { pixel: null, reseller: null, lead: null }

      const pixel = pixelRow as ResellerPixel
      const [{ data: resellerRow }, { data: leadRow }] = await Promise.all([
        supabase.from('resellers').select('*').eq('id', pixel.reseller_id).maybeSingle(),
        supabase
          .from('leads')
          .select(LEAD_COLUMNS)
          .eq('id', lead_id)
          .eq('workspace_id', workspace_id)
          .maybeSingle(),
      ])
      return {
        pixel,
        reseller: (resellerRow as Reseller) ?? null,
        lead: (leadRow as LeadRow) ?? null,
      }
    })

    if (!ctx.pixel) return { skipped: true, reason: 'not_reseller' }
    if (!ctx.reseller) return { skipped: true, reason: 'reseller_missing' }
    if (!ctx.lead) return { skipped: true, reason: 'lead_missing' }
    const pixel = ctx.pixel
    const reseller = ctx.reseller
    const lead = ctx.lead

    // 2. Cheap pre-check (status + obvious cap). Blocked cases are terminal —
    //    record once and return (single step, no retry).
    const pre = decideDelivery(reseller, pixel)
    if (!pre.deliver) {
      await step.run('record-precheck-block', () =>
        recordTerminal(pixel, lead_id, skipStatusForReason(pre.reason), pre.throttled, null, pre.reason),
      )
      safeLog(`[ResellerDelivery] lead ${lead_id} not delivered (${pre.reason})`)
      return { delivered: false, reason: pre.reason }
    }

    // 3. No destination configured — record the gap BEFORE consuming a cap slot
    //    so an un-configured pixel never burns the partner's quota.
    if (!pixel.destination_url || !pixel.signing_secret) {
      await step.run('record-no-destination', () =>
        recordTerminal(pixel, lead_id, 'no_destination', pre.throttled, null, 'no_destination'),
      )
      safeLog(`[ResellerDelivery] lead ${lead_id} has no destination for pixel ${pixel.pixel_id}`)
      return { delivered: false, reason: 'no_destination' }
    }

    // 4. Atomic cap enforcement + slot consumption — EXACTLY ONCE.
    //    Memoized: once it succeeds, every later retry replays the cached
    //    decision, so the meter is never double-consumed. A transient RPC error
    //    THROWS inside the step (see consumeDelivery), so a DB blip is retried
    //    with backoff instead of silently dropping the lead as cap-blocked.
    const consumed = await step.run('consume-delivery', () =>
      consumeDelivery(reseller.id, pixel.id),
    )
    if (!consumed.deliver) {
      await step.run('record-cap-block', () =>
        recordTerminal(pixel, lead_id, skipStatusForReason(consumed.reason), consumed.throttled, null, consumed.reason),
      )
      safeLog(`[ResellerDelivery] lead ${lead_id} skipped at atomic gate (${consumed.reason})`)
      return { delivered: false, reason: consumed.reason }
    }

    // 5. Build payload (throttled = reduced subset; authoritative flag from RPC).
    const payload = buildOutboundPayload({
      lead,
      pixelId: pixel.pixel_id,
      externalCustomerRef: pixel.external_customer_ref,
      throttled: consumed.throttled,
    })

    // 6. Deliver in a retryable step:
    //    - success or PERMANENT 4xx  → RETURN a result (no retry).
    //    - retryable 5xx/timeout     → THROW so Inngest retries with backoff,
    //      releasing the concurrency slot between attempts.
    //    If retries are exhausted the StepError surfaces here and we record 'failed'.
    let result: { success: boolean; statusCode: number | null; error: string | null; attempts: number } | null = null
    try {
      result = await step.run('deliver', async () => {
        const r = await deliverToPartner(pixel.destination_url!, pixel.signing_secret!, payload)
        const statusCode = r.statusCode ?? null
        // `attempt` is the zero-indexed attempt of the request executing THIS
        // step, so attempt+1 = how many delivery attempts actually happened.
        if (r.success) return { success: true, statusCode, error: null, attempts: attempt + 1 }
        const errMsg = r.error ?? `HTTP ${statusCode ?? 'error'}`
        if (!r.permanent && isRetryableStatus(statusCode)) {
          // Throw → Inngest retries this step (frees the concurrency slot).
          throw new Error(`Retryable delivery failure: ${errMsg}`)
        }
        // Permanent rejection (4xx / unsafe destination) — do not retry.
        return { success: false, statusCode, error: errMsg, attempts: attempt + 1 }
      })
    } catch (err) {
      // A retryable error that exhausted all attempts. statusCode is unknown at
      // this layer (it was 5xx/timeout); the message carries the detail.
      result = {
        success: false,
        statusCode: null,
        error: err instanceof Error ? err.message : 'delivery failed',
        attempts: STEP_RETRIES + 1,
      }
    }

    // 7. Record final outcome exactly once (audit row + daily rollup).
    const success = !!result?.success
    const outcome: DeliveryOutcome = success ? (consumed.throttled ? 'throttled' : 'delivered') : 'failed'
    await step.run('record-outcome', () =>
      recordTerminal(
        pixel,
        lead_id,
        outcome,
        consumed.throttled,
        result?.statusCode ?? null,
        result?.error ?? null,
        result?.attempts ?? 0,
      ),
    )

    safeLog(`[ResellerDelivery] lead ${lead_id} -> ${outcome} (status=${result?.statusCode ?? 'n/a'})`)
    return { delivered: success, outcome, statusCode: result?.statusCode ?? null }
  },
)

/**
 * Write the delivery audit row AND update the daily rollup counters. Called from
 * inside a memoized step so it runs exactly once per outcome. Never throws — a
 * metering hiccup must not fail the (already-completed) delivery.
 */
async function recordTerminal(
  pixel: ResellerPixel,
  leadId: string,
  status: DeliveryOutcome,
  throttled: boolean,
  responseStatus: number | null,
  error: string | null | undefined,
  attempts = 0,
): Promise<{ recorded: true }> {
  const supabase = createAdminClient()
  const { error: logErr } = await supabase.from('reseller_lead_deliveries').insert({
    reseller_id: pixel.reseller_id,
    reseller_pixel_id: pixel.id,
    lead_id: leadId,
    status,
    throttled,
    response_status: responseStatus,
    error_message: error ?? null,
    attempts,
  })
  if (logErr) safeError('[ResellerDelivery] failed to write delivery audit row:', logErr)
  await recordDelivery(pixel.reseller_id, pixel.id, status)
  return { recorded: true }
}
