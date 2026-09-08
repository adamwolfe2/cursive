/**
 * One-time backfill: re-resolve SuperPixel events stored as raw batch wrappers.
 *
 * Before the unwrapWebhookPayload fix, the live AL wire format
 *   { events: [ { edid, pixel_id, event_type, hem_sha256, resolution, ... } ] }
 * was stored verbatim as one `audiencelab_events` row whose `raw` was the
 * WRAPPER, not the per-visitor envelope. normalizeALPayload found no identity
 * on the wrapper, so every such row was marked
 * processed=true / error='No identifiable information' and produced no lead.
 *
 * This script rewrites each affected row's `raw` to its envelope (and inserts
 * sibling rows for extra envelopes in the same batch), then re-runs the SAME
 * processor the webhook uses. It is idempotent: a row that already carries a
 * pixel_id is skipped.
 *
 *   pnpm exec tsx scripts/backfill-superpixel-batches.ts            # dry run
 *   pnpm exec tsx scripts/backfill-superpixel-batches.ts --apply
 *   pnpm exec tsx scripts/backfill-superpixel-batches.ts --apply --limit=50
 *   pnpm exec tsx scripts/backfill-superpixel-batches.ts --apply --workspace=<uuid>
 */

import { createAdminClient } from '../src/lib/supabase/admin'
import { unwrapWebhookPayload, extractEventType, extractIpAddress } from '../src/lib/audiencelab/field-map'
import { processEventInline } from '../src/lib/audiencelab/edge-processor'

const APPLY = process.argv.includes('--apply')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity
const wsArg = process.argv.find((a) => a.startsWith('--workspace='))
const WORKSPACE = wsArg ? wsArg.split('=')[1] : null
const PAGE = 200

type EventRow = {
  id: string
  raw: Record<string, any> | null
  workspace_id: string | null
  source: string | null
  raw_headers: Record<string, any> | null
}

/** A row still needs backfilling if its raw is a batch wrapper. */
function isBatchWrapper(raw: unknown): raw is { events: Record<string, any>[] } {
  if (!raw || typeof raw !== 'object') return false
  const r = raw as Record<string, any>
  const looksLikeEnvelope = r.pixel_id != null || r.event_key != null || r.hem_sha256 != null
  return Array.isArray(r.events) && !looksLikeEnvelope
}

function envelopeColumns(envelope: Record<string, any>) {
  return {
    pixel_id: envelope.pixel_id || null,
    event_type: extractEventType(envelope),
    hem_sha256: envelope.hem_sha256 || envelope.hem || null,
    uid: envelope.uid || null,
    profile_id: envelope.profile_id || null,
    ip_address: extractIpAddress(envelope),
    raw: envelope,
  }
}

async function main() {
  const supabase = createAdminClient()

  const stats = {
    scanned: 0,
    wrappers: 0,
    skippedNoWorkspace: 0,
    rowsRewritten: 0,
    siblingsInserted: 0,
    leadsCreated: 0,
    stillUnidentified: 0,
    errors: 0,
  }

  let offset = 0
  let processedCount = 0

  while (processedCount < LIMIT) {
    let query = supabase
      .from('audiencelab_events')
      .select('id, raw, workspace_id, source, raw_headers')
      .eq('source', 'superpixel')
      .is('pixel_id', null)

    if (WORKSPACE) query = query.eq('workspace_id', WORKSPACE)

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE - 1)

    if (error) throw new Error(`fetch failed: ${error.message}`)
    if (!data || data.length === 0) break

    for (const row of data as EventRow[]) {
      if (processedCount >= LIMIT) break
      stats.scanned++

      if (!isBatchWrapper(row.raw)) continue
      stats.wrappers++

      const envelopes = unwrapWebhookPayload(row.raw)
      if (envelopes.length === 0) continue

      if (!row.workspace_id) {
        // No workspace = we cannot attribute a lead. Leave the row untouched
        // so a later pixel->workspace remap can still recover it.
        stats.skippedNoWorkspace++
        continue
      }

      processedCount++

      if (!APPLY) {
        stats.rowsRewritten++
        stats.siblingsInserted += envelopes.length - 1
        continue
      }

      try {
        // 1. Rewrite this row to the first envelope, unprocessed.
        const { error: upErr } = await supabase
          .from('audiencelab_events')
          .update({ ...envelopeColumns(envelopes[0]), processed: false, error: null })
          .eq('id', row.id)
        if (upErr) throw new Error(`update ${row.id}: ${upErr.message}`)
        stats.rowsRewritten++

        const idsToProcess = [row.id]

        // 2. Extra envelopes in the same batch become sibling rows.
        for (const envelope of envelopes.slice(1)) {
          const { data: inserted, error: insErr } = await supabase
            .from('audiencelab_events')
            .insert({
              source: 'superpixel',
              ...envelopeColumns(envelope),
              raw_headers: row.raw_headers,
              processed: false,
              workspace_id: row.workspace_id,
            })
            .select('id')
            .maybeSingle()
          if (insErr) throw new Error(`insert sibling: ${insErr.message}`)
          if (inserted) {
            idsToProcess.push(inserted.id)
            stats.siblingsInserted++
          }
        }

        // 3. Run the same processor the webhook runs.
        for (const id of idsToProcess) {
          const result = await processEventInline(id, row.workspace_id, row.source || 'superpixel')
          if (result.success && result.lead_id) stats.leadsCreated++
          else if (result.success) stats.stillUnidentified++
          else stats.errors++
        }
      } catch (err) {
        stats.errors++
        console.error(`  ! ${row.id}:`, err instanceof Error ? err.message : err)
      }
    }

    // When applying, rewritten rows drop out of the `pixel_id is null` filter,
    // so the window stays at 0. In dry-run nothing changes, so we must page.
    if (!APPLY) offset += PAGE
    if (data.length < PAGE && !APPLY) break
  }

  console.log(APPLY ? '\n=== BACKFILL APPLIED ===' : '\n=== DRY RUN (no writes) ===')
  console.table(stats)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
