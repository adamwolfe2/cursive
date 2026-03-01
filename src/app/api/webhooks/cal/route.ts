/**
 * Cal.com Webhook Handler
 *
 * Receives BOOKING_CREATED, BOOKING_RESCHEDULED, and BOOKING_CANCELLED
 * events from cal.com/gotdarrenhill/30min and fires Inngest events to
 * trigger the no-show recovery sequence.
 *
 * Verify the webhook in Cal.com settings → Webhooks → add secret → set
 * CAL_WEBHOOK_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { inngest } from '@/inngest/client'
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

    await inngest.send({
      name: 'cal/booking.created',
      data: {
        booking_uid: String(booking.uid),
        attendee_name: String(attendee.name ?? ''),
        attendee_email: String(attendee.email),
        start_time: String(booking.startTime),
        end_time: String(booking.endTime),
      },
    })

    safeLog('[Cal webhook] Fired cal/booking.created for:', attendee.email)
  }

  if (triggerEvent === 'BOOKING_CANCELLED') {
    const attendee = Array.isArray(booking?.attendees) ? booking.attendees[0] : null

    await inngest.send({
      name: 'cal/booking.cancelled',
      data: {
        booking_uid: String(booking.uid),
        attendee_email: String(attendee?.email ?? ''),
      },
    })

    safeLog('[Cal webhook] Fired cal/booking.cancelled for uid:', booking.uid)
  }

  return NextResponse.json({ ok: true })
}
