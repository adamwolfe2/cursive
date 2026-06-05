/**
 * POST /api/admin/funnel-orders/[id]/deliver
 *
 * Platform-admin only. Marks a funnel order as delivered with a Google Sheet
 * URL, emails the buyer, and writes an admin_audit_logs row via logAdminAction.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin, logAdminAction } from '@/lib/auth/admin'
import {
  getPortalTokenForOrder,
  markOrderDelivered,
  portalUrlForToken,
} from '@/lib/funnel/order.service'
import { sendFunnelAudienceDeliveredEmail } from '@/lib/email/templates/funnel-audience-delivered'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  sheet_url: z
    .string()
    .url()
    .refine((url) => /^https?:\/\//i.test(url), 'Must be an https URL'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Canonical platform-admin guard. Throws if not authorized → caught below
    // and converted to a 401.
    let admin: { id: string; email: string }
    try {
      admin = await requirePlatformAdmin()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid sheet URL' },
        { status: 400 }
      )
    }

    const updated = await markOrderDelivered(id, {
      sheet_url: parsed.data.sheet_url,
      fulfilled_by: admin.email,
    })

    if (!updated) {
      // Forward-only guard fired — order wasn't in awaiting_delivery
      return NextResponse.json(
        { error: 'Could not mark delivered (order is not awaiting delivery).' },
        { status: 409 }
      )
    }

    // Look up portal token for the email link
    const token = await getPortalTokenForOrder(updated.id)
    const portalUrl = token ? portalUrlForToken(token.token) : ''

    // Send delivery email — non-fatal if it fails
    try {
      await sendFunnelAudienceDeliveredEmail({
        to: updated.customer_email,
        customerName: updated.customer_name,
        sheetUrl: parsed.data.sheet_url,
        portalUrl,
      })
    } catch (emailErr) {
      safeError('[funnel/deliver] email failed (non-fatal)', emailErr)
    }

    // Audit log — admin_audit_logs row for the money-touching action.
    // logAdminAction swallows its own failures so we never block delivery on
    // audit infrastructure being down.
    await logAdminAction(
      'funnel_order_deliver',
      'funnel_order',
      updated.id,
      null,
      {
        sheet_url: parsed.data.sheet_url,
        customer_email: updated.customer_email,
        offer_slug: updated.offer_slug,
      }
    )

    safeLog('[funnel/deliver] order delivered', {
      order_id: updated.id,
      delivered_by: admin.email,
    })

    return NextResponse.json({ order: updated })
  } catch (err) {
    safeError('[funnel/deliver] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
