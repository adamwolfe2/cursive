export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { APP_URL } from '@/lib/config/urls'
import { safeError } from '@/lib/utils/log-sanitizer'

const requestSchema = z.object({
  clientId: z.string().uuid(),
  testEmail: z.string().email().optional(), // preview: send to this address instead, don't mark as sent
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { clientId, testEmail } = parsed.data
    const supabase = createAdminClient()

    // Look up client
    const { data: client, error: clientError } = await supabase
      .from('onboarding_clients')
      .select('id, company_name, primary_contact_name, primary_contact_email')
      .eq('id', clientId)
      .maybeSingle()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Generate portal token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .insert({
        client_id: clientId,
        email: client.primary_contact_email,
      })
      .select('id, token')
      .single()

    if (tokenError || !tokenRecord) {
      safeError('[Portal] Failed to create token:', tokenError)
      return NextResponse.json({ error: 'Failed to generate portal token' }, { status: 500 })
    }

    const portalUrl = `${APP_URL}/portal/${tokenRecord.token}`
    // HTML-escape ALL client-supplied values before embedding in the email
    // template. The form is public, so a malicious submission with HTML in
    // primary_contact_name or company_name would otherwise be rendered into
    // the outgoing email and could plant a phishing link.
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const firstName = escapeHtml(client.primary_contact_name?.split(' ')[0] ?? 'there')
    const companyNameHtml = escapeHtml(client.company_name ?? '')

    const content = `
      <h1 class="email-title">Your Cursive onboarding portal is ready</h1>

      <p class="email-text">
        Hi ${firstName}, your onboarding portal for <strong>${companyNameHtml}</strong> is now live.
        Use the link below to complete the remaining steps to get your campaign activated.
      </p>

      <p class="email-text"><strong>In the portal you will:</strong></p>
      <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #000000; font-size: 16px; line-height: 28px;">
        <li>Review and sign your contract</li>
        <li>Pay your setup invoice</li>
        <li>Approve your sender domains and identities</li>
        <li>Review and approve your email copy</li>
      </ul>

      <div style="text-align: center;">
        <a href="${portalUrl}" class="email-button" style="display: inline-block; margin: 8px 0 24px 0; padding: 14px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Open My Portal
        </a>
      </div>

      <p class="email-text" style="font-size: 14px; color: #71717a;">
        This link is unique to you and expires in 60 days. Do not share it with others.
      </p>

      <div class="email-signature">
        <p style="margin: 0 0 4px 0;"><strong>Adam at Cursive</strong></p>
        <p style="margin: 0; color: #71717a;">Questions? Reply to this email and I will get back to you.</p>
      </div>
    `

    const html = createEmailTemplate({
      preheader: `Your ${companyNameHtml} onboarding portal is ready, sign, pay, and approve to get started.`,
      title: 'Your Cursive onboarding portal is ready',
      content,
    })

    const recipientEmail = testEmail ?? client.primary_contact_email
    const subjectLine = testEmail
      ? `[PREVIEW] Your Cursive onboarding portal is ready`
      : 'Your Cursive onboarding portal is ready'

    const emailResult = await sendEmail({
      to: recipientEmail,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: subjectLine,
      html,
    })

    if (!emailResult.success) {
      safeError('[Portal] Failed to send invite email:', emailResult.error)
      return NextResponse.json({ error: 'Failed to send portal invite email' }, { status: 500 })
    }

    // Only mark as sent when it goes to the real client (not a preview)
    if (!testEmail) {
      await supabase
        .from('onboarding_clients')
        .update({ portal_invite_sent_at: new Date().toISOString() })
        .eq('id', clientId)
    }

    return NextResponse.json({
      success: true,
      portalUrl,
      tokenId: tokenRecord.id,
    })
  } catch (error) {
    safeError('[Portal] send-invite error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
