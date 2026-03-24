// Uses createHmac + timingSafeEqual from Node.js crypto — must stay on Node.js runtime
export const runtime = 'nodejs'

/**
 * Cal.com Webhook Handler
 *
 * Receives BOOKING_CREATED, BOOKING_RESCHEDULED, and BOOKING_CANCELLED
 * events from cal.com/cursiveteam/30min and fires Inngest events to
 * trigger the no-show recovery sequence.
 *
 * Verify the webhook in Cal.com settings → Webhooks → add secret → set
 * CAL_WEBHOOK_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

function verifyCalSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) return false // fail closed — require secret to be configured

  const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const signature = req.headers.get('x-cal-signature-256') ?? ''
  if (!verifyCalSignature(rawBody, signature)) {
    safeError('[Cal webhook] Invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { triggerEvent: string; payload: Record<string, any> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { triggerEvent, payload: booking } = payload

  safeLog('[Cal webhook] Received:', { triggerEvent, uid: booking?.uid })

  if (triggerEvent === 'BOOKING_CREATED' || triggerEvent === 'BOOKING_RESCHEDULED') {
    const attendee = Array.isArray(booking?.attendees) ? booking.attendees[0] : null
    if (!attendee?.email) {
      return NextResponse.json({ ok: true })
    }

    const bookingUid = String(booking.uid)
    const attendeeName = String(attendee.name ?? '')
    const attendeeEmail = String(attendee.email)
    const startTime = String(booking.startTime)
    const endTime = String(booking.endTime)

    // Extract affiliate ref code from Cal.com booking metadata or responses
    const refCode: string | null =
      booking.metadata?.ref ??
      booking.responses?.ref?.value ??
      null

    // Persist booking to DB for Ops Dashboard
    try {
      const adminClient = createAdminClient()

      // Check if attendee has already signed up — link workspace_id if so
      let workspaceId: string | null = null
      const { data: existingUser } = await adminClient
        .from('users')
        .select('workspace_id')
        .eq('email', attendeeEmail)
        .maybeSingle()
      if (existingUser?.workspace_id) {
        workspaceId = existingUser.workspace_id
      }

      await adminClient.from('cal_bookings').upsert({
        booking_uid: bookingUid,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        start_time: startTime,
        end_time: endTime,
        status: 'upcoming',
        ref_code: refCode ?? null,
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'booking_uid' })
    } catch (err) {
      safeError('[Cal webhook] Failed to persist booking:', err)
      // Non-fatal — continue to fire Inngest events
    }

    // Pre-attribution: create lead referral at booking time (before signup)
    if (refCode && attendeeEmail) {
      const { processAffiliateAttributionByEmail } = await import('@/lib/affiliate/activation')
      processAffiliateAttributionByEmail(refCode, attendeeEmail)
        .catch((err) => safeError('[Cal webhook] Pre-attribution failed (non-fatal):', err))
    }

    await inngest.send({
      name: 'cal/booking.created',
      data: {
        booking_uid: bookingUid,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        start_time: startTime,
        end_time: endTime,
      },
    })

    // Fire demo/booked to trigger pre-call nurture sequence
    await inngest.send({
      name: 'demo/booked',
      data: {
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        booking_uid: bookingUid,
        start_time: startTime,
        end_time: endTime,
        owner_name: 'Darren',
        owner_email: 'darren@meetcursive.com',
        calendar_link: 'https://cal.com/cursiveteam/30min',
      },
    })

    safeLog('[Cal webhook] Fired cal/booking.created + demo/booked for:', attendeeEmail)
  }

  if (triggerEvent === 'BOOKING_CANCELLED') {
    const attendee = Array.isArray(booking?.attendees) ? booking.attendees[0] : null

    // Update booking status in DB
    try {
      const adminClient = createAdminClient()
      await adminClient.from('cal_bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('booking_uid', String(booking.uid))
    } catch (err) {
      safeError('[Cal webhook] Failed to update cancelled booking:', err)
    }

    await inngest.send({
      name: 'cal/booking.cancelled',
      data: {
        booking_uid: String(booking.uid),
        attendee_email: String(attendee?.email ?? ''),
      },
    })

    // Fire demo/cancelled so demo-nurture-sequence cancelOn guard stops emails
    await inngest.send({
      name: 'demo/cancelled',
      data: {
        booking_uid: String(booking.uid),
        attendee_email: String(attendee?.email ?? ''),
      },
    })

    safeLog('[Cal webhook] Fired cal/booking.cancelled + demo/cancelled for uid:', booking.uid)
  }

  return NextResponse.json({ ok: true })
}
