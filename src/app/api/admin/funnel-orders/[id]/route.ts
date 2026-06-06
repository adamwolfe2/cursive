/**
 * DELETE /api/admin/funnel-orders/[id]
 *
 * Platform-admin only. Removes a funnel order and its owned data — for clearing
 * test orders. Deletes the order (+ portal tokens cascade) and its pixel, and
 * tears down the auto-provisioned workspace IF it was funnel-created. Real
 * workspaces (e.g. Cursive HQ, source != 'funnel_order') are never touched.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteFunnelOrder } from '@/lib/funnel/order.service'
import { purgeFunnelWorkspace } from '@/lib/funnel/workspace-provision'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

export async function DELETE(
  _req: NextRequest,
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

    // Capture the linked workspace before deleting the order.
    const supabase = createAdminClient()
    const { data: order } = await supabase
      .from('funnel_orders')
      .select('id, customer_email, offer_slug, workspace_id')
      .eq('id', id)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Tear down the auto-provisioned workspace first (no-op + protected for
    // non-funnel workspaces like Cursive HQ).
    let workspacePurged = false
    if (order.workspace_id) {
      workspacePurged = await purgeFunnelWorkspace(order.workspace_id)
    }

    const deleted = await deleteFunnelOrder(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }

    await logAdminAction('funnel_order_delete', 'funnel_order', id, null, {
      customer_email: order.customer_email,
      offer_slug: order.offer_slug,
      workspace_purged: workspacePurged,
    })

    safeLog('[funnel/delete] order deleted', {
      order_id: id,
      deleted_by: admin.email,
      workspace_purged: workspacePurged,
    })

    return NextResponse.json({
      success: true,
      workspace_purged: workspacePurged,
    })
  } catch (err) {
    safeError('[funnel/delete] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
