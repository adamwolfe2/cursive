export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { SdrInboxRepository } from '@/lib/repositories/sdr-inbox.repository'
import { SdrConfigRepository } from '@/lib/repositories/sdr-config.repository'
import { sendEmail } from '@/lib/services/outreach/email-sender.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const OUTREACH_FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || 'team@meetcursive.com'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { replyId } = await params

    const inboxRepo = new SdrInboxRepository()
    const reply = await inboxRepo.findById(replyId)
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }
    if (!reply.suggested_response) {
      return NextResponse.json({ error: 'No draft to approve' }, { status: 400 })
    }

    const config = await new SdrConfigRepository().findByWorkspace(reply.workspace_id)

    const agentName = [config?.agent_first_name, config?.agent_last_name]
      .filter(Boolean)
      .join(' ') || 'The Cursive Team'

    const bodyWithCTA = config?.cal_booking_url
      ? `${reply.suggested_response}\n\n---\n${config.cal_booking_url}`
      : reply.suggested_response

    const result = await sendEmail({
      to: reply.from_email,
      from: config?.notification_email || OUTREACH_FROM_EMAIL,
      fromName: agentName,
      subject: `Re: ${reply.subject || 'Following up'}`,
      bodyText: bodyWithCTA,
      replyTo: config?.notification_email || OUTREACH_FROM_EMAIL,
      ...(config?.auto_bcc_address ? { bcc: config.auto_bcc_address } : {}),
    })

    if (!result.success) {
      safeError('[SDR Approve] sendEmail failed:', result.error)
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
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[SDR Approve POST]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
