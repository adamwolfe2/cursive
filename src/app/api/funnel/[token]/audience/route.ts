/**
 * POST /api/funnel/[token]/audience
 *
 * Captures the buyer's ICP form. Stores on funnel_orders + transitions
 * status to awaiting_delivery. Admin fulfills manually for now (Google
 * Sheet drop) — automation can replace this later by enqueuing an Inngest
 * audience-build job here.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { FUNNEL_TRIAL_DAYS } from '@/lib/stripe/funnel-products'
import { z } from 'zod'
import {
  getOrderByToken,
  recordAudienceSubmitted,
  hasPaid,
} from '@/lib/funnel/order.service'
import { pushFunnelAudienceToWorkspace } from '@/lib/funnel/workspace-provision'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { sendFunnelAdminNotificationEmail } from '@/lib/email/templates/funnel-admin-notification'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  solution: z.string().trim().min(3).max(500),
  icp_description: z.string().trim().min(3).max(1000),
  titles: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  industries: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  employee_range: z.string().trim().max(40).default(''),
  locations: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const lookup = await getOrderByToken(token)

    if (!lookup.ok) {
      return NextResponse.json(
        { error: 'Link no longer valid' },
        { status: lookup.error === 'not_found' ? 404 : 403 }
      )
    }

    const { order } = lookup.data

    if (order.offer_slug === 'pixel_97') {
      return NextResponse.json(
        { error: 'Your plan does not include a managed audience.' },
        { status: 409 }
      )
    }

    // The managed audience is the expensive deliverable (a live AudienceLab
    // segment, up to 200 records, plus enrichment). A $0 trialer who never
    // converts would otherwise cost us that on day one, repeatably. The pixel
    // stays free during the trial — that is the part that proves the product.
    if (FUNNEL_TRIAL_DAYS > 0 && !hasPaid(order)) {
      return NextResponse.json(
        {
          error:
            'Your weekly audience unlocks when your trial converts. Your pixel is live now — visitors are being identified in the meantime.',
          reason: 'trial_not_converted',
          trial_ends_at: order.trial_ends_at,
        },
        { status: 402 }
      )
    }

    if (order.audience_submitted_at) {
      return NextResponse.json(
        { error: 'Audience already submitted.' },
        { status: 409 }
      )
    }

    // Bundle orders must install the pixel first (so the funnel feels linear)
    if (order.offer_slug === 'bundle_247' && !order.pixel_provisioned_at) {
      return NextResponse.json(
        { error: 'Install your pixel first.' },
        { status: 409 }
      )
    }

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            'Please complete the required fields.',
        },
        { status: 400 }
      )
    }

    const updated = await recordAudienceSubmitted(order.id, parsed.data)
    if (!updated) {
      return NextResponse.json(
        { error: 'Could not save. Please try again.' },
        { status: 500 }
      )
    }

    safeLog('[funnel/audience] submitted', {
      order_id: order.id,
      titles_count: parsed.data.titles.length,
    })

    // #5 — Auto-build the audience the moment the ICP is submitted, straight
    // into the buyer's dashboard, instead of waiting for a manual admin
    // delivery. Reuses the idempotent Phase 4 push (guards on
    // audience_pushed_at), so a later "mark delivered" never double-pushes.
    //
    // Notify admin via Slack (existing channel) + email (new).
    //
    // All three are AWAITED (not fire-and-forget) — this repo has proven live
    // that an un-awaited promise can be frozen mid-flight the instant a
    // serverless invocation returns its response (see commit 49896c02), so
    // the work either never completes or lands minutes late. Promise.allSettled
    // still keeps the buyer's submit non-fatal: any individual failure here is
    // logged, never thrown, and never blocks the response below.
    const results = await Promise.allSettled([
      pushFunnelAudienceToWorkspace(updated),
      sendSlackAlert({
        type: 'pipeline_update',
        severity: 'info',
        message: `Funnel audience submitted — needs fulfillment (${order.offer_slug})`,
        metadata: {
          order_id: order.id,
          email: order.customer_email,
          solution: parsed.data.solution.slice(0, 120),
          titles: parsed.data.titles.join(', ').slice(0, 200),
        },
      }),
      sendFunnelAdminNotificationEmail(updated),
    ])

    const [pushResult, slackResult, emailResult] = results
    if (pushResult.status === 'rejected') {
      safeError('[funnel/audience] auto audience push failed:', pushResult.reason)
    }
    if (slackResult.status === 'rejected') {
      safeError('[funnel/audience] slack alert failed:', slackResult.reason)
    }
    if (emailResult.status === 'rejected') {
      safeError('[funnel/audience] admin email failed:', emailResult.reason)
    }

    return NextResponse.json({ order: updated })
  } catch (err) {
    safeError('[funnel/audience] error:', err)
    return NextResponse.json(
      { error: 'Could not save your audience. Please try again.' },
      { status: 500 }
    )
  }
}
