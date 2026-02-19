export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { SdrInboxRepository } from '@/lib/repositories/sdr-inbox.repository'
import { SdrConfigRepository } from '@/lib/repositories/sdr-config.repository'
import { sendEmail } from '@/lib/services/outreach/email-sender.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const OUTREACH_FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || 'team@meetcursive.com'

const bodySchema = z.object({
  body: z.string().min(1),
  subject: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { replyId } = await params

    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const inboxRepo = new SdrInboxRepository()
    const reply = await inboxRepo.findById(replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    const config = await new SdrConfigRepository().findByWorkspace(reply.workspace_id)

    const agentName = [config?.agent_first_name, config?.agent_last_name]
      .filter(Boolean)
      .join(' ') || 'The Cursive Team'

    const bodyWithCTA = config?.cal_booking_url
      ? `${parsed.data.body}\n\n---\n${config.cal_booking_url}`
      : parsed.data.body

    const result = await sendEmail({
      to: reply.from_email,
      from: config?.notification_email || OUTREACH_FROM_EMAIL,
      fromName: agentName,
      subject: parsed.data.subject || `Re: ${reply.subject || 'Following up'}`,
      bodyText: bodyWithCTA,
      replyTo: config?.notification_email || OUTREACH_FROM_EMAIL,
    })

    if (!result.success) {
      safeError('[SDR Send] sendEmail failed:', result.error)
      return NextResponse.json(
        { error: `Failed to send email: ${result.error}` },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()
    await inboxRepo.updateDraftStatus(replyId, {
      draft_status: 'sent',
      status: 'responded',
      approved_by: admin.email,
      approved_at: now,
      response_sent_at: now,
      suggested_response: parsed.data.body,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[SDR Send POST]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
