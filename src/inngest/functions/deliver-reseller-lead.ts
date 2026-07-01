/**
 * Deliver Reseller Lead — Inngest Function
 *
 * Subscribes to the EXISTING `lead/created` event (already fired for every new
 * lead by edge-processor.ts). For leads whose workspace belongs to a reseller
 * end-customer, forwards the lead to the partner's configured endpoint with
 * caps, throttling, metering, signing, and retries. No-ops (fast) for all
 * non-reseller workspaces — this is why the ingestion hot path needed ZERO edits.
 *
 * Retries are handled INTERNALLY (so metering runs exactly once per lead). The
 * Inngest function itself never throws, so there are no outer retries that would
 * double-count the meter.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { decideDelivery, consumeDelivery, recordDelivery } from '@/lib/reseller/metering.service'
import { buildOutboundPayload } from '@/lib/reseller/payload'
import { deliverToPartner } from '@/lib/reseller/delivery.service'
import type { Reseller, ResellerPixel, LeadRow, DeliveryOutcome } from '@/lib/reseller/types'

const LEAD_COLUMNS =
  'id, email, first_name, last_name, full_name, company_name, company_domain, job_title, phone, city, state, state_code, created_at'

const RETRY_BACKOFF_MS = [0, 2_000, 6_000, 15_000, 30_000] // 5 attempts

export const deliverResellerLead = inngest.createFunction(
  { id: 'deliver-reseller-lead', retries: 0, timeouts: { finish: '3m' } },
  { event: 'lead/created' },
  async ({ event }) => {
    const { lead_id, workspace_id } = event.data as { lead_id: string; workspace_id: string }
    if (!lead_id || !workspace_id) return { skipped: true, reason: 'missing_ids' }

    const supabase = createAdminClient()

    // 1. Is this workspace a reseller end-customer? (single indexed lookup)
    const { data: pixelRow } = await supabase
      .from('reseller_pixels')
      .select('*')
      .eq('workspace_id', workspace_id)
      .maybeSingle()

    if (!pixelRow) return { skipped: true, reason: 'not_reseller' }
    const pixel = pixelRow as ResellerPixel

    // 2. Load reseller + lead in parallel. The lead is fetched scoped to the
    //    SAME workspace as the reseller pixel — a malformed/replayed event whose
    //    lead_id belongs to a different workspace resolves to null and is
    //    skipped, so a reseller can never receive another tenant's lead.
    const [{ data: resellerRow }, { data: leadRow }] = await Promise.all([
      supabase.from('resellers').select('*').eq('id', pixel.reseller_id).maybeSingle(),
      supabase.from('leads').select(LEAD_COLUMNS).eq('id', lead_id).eq('workspace_id', workspace_id).maybeSingle(),
    ])

    if (!resellerRow) return { skipped: true, reason: 'reseller_missing' }
    if (!leadRow) return { skipped: true, reason: 'lead_missing' }
    const reseller = resellerRow as Reseller
    const lead = leadRow as LeadRow

    // 3. Cheap pre-check (status + obvious cap). The authoritative, race-safe
    //    gate is consumeDelivery() below; this avoids a DB txn for clearly-
    //    blocked cases (suspended/inactive/way-over-cap).
    const pre = decideDelivery(reseller, pixel)
    if (!pre.deliver) {
      await logDelivery(supabase, pixel, lead_id, 'skipped_cap', pre.throttled, null, pre.reason)
      await recordDelivery(reseller.id, pixel.id, 'skipped_cap')
      safeLog(`[ResellerDelivery] lead ${lead_id} not delivered (${pre.reason})`)
      return { delivered: false, reason: pre.reason }
    }

    // 4. No destination configured yet — record the gap. Do this BEFORE consuming
    //    a cap slot so an un-configured pixel never burns the partner's quota.
    if (!pixel.destination_url || !pixel.signing_secret) {
      await logDelivery(supabase, pixel, lead_id, 'no_destination', pre.throttled, null, 'no_destination')
      await recordDelivery(reseller.id, pixel.id, 'no_destination')
      safeLog(`[ResellerDelivery] lead ${lead_id} has no destination configured for pixel ${pixel.pixel_id}`)
      return { delivered: false, reason: 'no_destination' }
    }

    // 5. Atomic cap enforcement + slot consumption (race-safe; authoritative).
    //    Fails closed. If a concurrent worker won the last slot, this returns
    //    allowed=false and we skip rather than over-deliver past the cap.
    const consumed = await consumeDelivery(reseller.id, pixel.id)
    if (!consumed.deliver) {
      await logDelivery(supabase, pixel, lead_id, 'skipped_cap', consumed.throttled, null, consumed.reason)
      await recordDelivery(reseller.id, pixel.id, 'skipped_cap')
      safeLog(`[ResellerDelivery] lead ${lead_id} skipped at atomic gate (${consumed.reason})`)
      return { delivered: false, reason: consumed.reason }
    }

    // 6. Build payload (throttled = reduced subset) and deliver with internal retries.
    //    throttled comes from the RPC (authoritative).
    const payload = buildOutboundPayload({
      lead,
      pixelId: pixel.pixel_id,
      externalCustomerRef: pixel.external_customer_ref,
      throttled: consumed.throttled,
    })

    let lastStatus: number | null = null
    let lastError: string | null = null
    let success = false
    let attempts = 0

    for (let i = 0; i < RETRY_BACKOFF_MS.length; i++) {
      if (RETRY_BACKOFF_MS[i] > 0) {
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[i]))
      }
      attempts = i + 1
      try {
        const result = await deliverToPartner(pixel.destination_url, pixel.signing_secret, payload)
        lastStatus = result.statusCode ?? null
        if (result.success) {
          success = true
          break
        }
        lastError = result.error ?? `HTTP ${result.statusCode ?? 'error'}`
        // 4xx (except 408/429) are not retryable — stop early.
        if (lastStatus && lastStatus >= 400 && lastStatus < 500 && lastStatus !== 408 && lastStatus !== 429) {
          break
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    const outcome: DeliveryOutcome = success ? (consumed.throttled ? 'throttled' : 'delivered') : 'failed'
    await logDelivery(supabase, pixel, lead_id, outcome, consumed.throttled, lastStatus, lastError, attempts)
    await recordDelivery(reseller.id, pixel.id, outcome)

    safeLog(`[ResellerDelivery] lead ${lead_id} -> ${outcome} (status=${lastStatus ?? 'n/a'}, attempts=${attempts})`)
    return { delivered: success, outcome, statusCode: lastStatus }
  },
)

async function logDelivery(
  supabase: ReturnType<typeof createAdminClient>,
  pixel: ResellerPixel,
  leadId: string,
  status: DeliveryOutcome,
  throttled: boolean,
  responseStatus: number | null,
  error: string | null | undefined,
  attempts = 0,
): Promise<void> {
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
}
