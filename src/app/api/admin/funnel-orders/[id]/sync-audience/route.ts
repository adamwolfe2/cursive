/**
 * POST /api/admin/funnel-orders/[id]/sync-audience
 *
 * Platform-admin only. The quality path for audience delivery: AL's /audiences
 * filter API does not target, so an admin builds the targeted list in AL's
 * Audience Builder / Studio and pastes its audience ID here. We validate the
 * audience exists + has records, then pull it into the buyer's workspace
 * (verified-gated + enrich-topped-up) and register it for the weekly refresh.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import { getOrderById } from '@/lib/funnel/order.service'
import { pushFunnelAudienceToWorkspace } from '@/lib/funnel/workspace-provision'
import { fetchAudienceRecords } from '@/lib/audiencelab/api-client'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  // AL audience IDs are UUIDs.
  audience_id: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F-]{8,}$/, 'Expected an AudienceLab audience ID (UUID)'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let admin: { id: string; email: string }
    try {
      admin = await requireAdmin()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid audience ID' },
        { status: 400 }
      )
    }
    const audienceId = parsed.data.audience_id

    const order = await getOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!order.workspace_id) {
      return NextResponse.json(
        { error: 'Order has no workspace yet — provision the workspace first.' },
        { status: 409 }
      )
    }

    // Validate the audience exists and has records before we commit to a sync.
    try {
      const probe = await fetchAudienceRecords(audienceId, 1, 1)
      const sampleCount = probe.data?.length ?? 0
      // total_records is null when the id is not a real audience (e.g. a Studio
      // SEGMENT id or list id, or a mistyped/truncated id) vs 0 for a genuinely
      // empty audience. Distinguish so the admin gets an actionable message.
      const total = probe.total_records
      if ((total === null || total === undefined) && sampleCount === 0) {
        return NextResponse.json(
          { error: "Couldn't find that audience. Use the AUDIENCE id from the /audience/... URL (36-char UUID) — not the Studio segment id or the list id." },
          { status: 422 }
        )
      }
      if (sampleCount === 0) {
        return NextResponse.json(
          { error: 'That audience is empty. Build + save it in Studio first, then sync.' },
          { status: 422 }
        )
      }
    } catch (err) {
      safeError('[admin/sync-audience] audience validation failed:', err)
      return NextResponse.json(
        { error: 'Could not read that audience from AudienceLab. Double-check the audience id.' },
        { status: 422 }
      )
    }

    // Force-push (admin re-sync) from the Studio-built audience.
    const enqueued = await pushFunnelAudienceToWorkspace(order, { audienceId, force: true })
    if (!enqueued) {
      return NextResponse.json(
        { error: 'Could not enqueue the sync (no workspace owner?).' },
        { status: 409 }
      )
    }

    await logAdminAction(
      'funnel_order_sync_audience',
      'funnel_order',
      id,
      null,
      { audience_id: audienceId, fulfilled_by: admin.email },
      order.workspace_id
    ).catch((err) => safeError('[admin/sync-audience] audit log failed:', err))

    safeLog('[admin/sync-audience] enqueued Studio audience sync', {
      order_id: id,
      workspace_id: order.workspace_id,
      audience_id: audienceId,
    })

    return NextResponse.json({
      success: true,
      message: 'Audience sync started. Verified leads will land in the buyer\'s dashboard shortly.',
    })
  } catch (err) {
    safeError('[admin/sync-audience] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
