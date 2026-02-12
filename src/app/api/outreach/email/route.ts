/**
 * Email Outreach API
 * POST /api/outreach/email - Send email(s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, sendBulkEmails, logSentEmail } from '@/lib/services/outreach/email-sender.service'

const singleEmailSchema = z.object({
  lead_id: z.string().uuid().optional(),
  to: z.string().email(),
  to_name: z.string().optional(),
  subject: z.string().min(1).max(200),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
  account_id: z.string().uuid().optional(),
})

const bulkEmailSchema = z.object({
  emails: z.array(z.object({
    lead_id: z.string().uuid().optional(),
    to: z.string().email(),
    to_name: z.string().optional(),
    subject: z.string().min(1).max(200),
    body_html: z.string().optional(),
    body_text: z.string().optional(),
  })).min(1).max(100),
  account_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()

    // Check if it's a bulk request
    if (body.emails && Array.isArray(body.emails)) {
      const { emails, account_id } = bulkEmailSchema.parse(body)

      // Get sender info
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', user.workspace_id)
        .single()

      const { data: account } = await supabase
        .from('email_accounts')
        .select('email_address, display_name')
        .eq('workspace_id', user.workspace_id)
        .eq(account_id ? 'id' : 'is_primary', account_id || true)
        .single()

      const fromEmail = account?.email_address || process.env.DEFAULT_FROM_EMAIL || 'noreply@cursive.io'
      const fromName = account?.display_name || workspace?.name || 'Cursive'

      // Send bulk emails
      const result = await sendBulkEmails(
        emails.map((e) => ({
          ...e,
          from: fromEmail,
          fromName,
          leadId: e.lead_id,
        })),
        user.workspace_id,
        account_id
      )

      return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
      })
    }

    // Single email
    const { lead_id, to, to_name, subject, body_html, body_text, account_id } = singleEmailSchema.parse(body)

    // Validate body
    if (!body_html && !body_text) {
      return NextResponse.json({ error: 'Either body_html or body_text is required' }, { status: 400 })
    }

    // Get sender info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', user.workspace_id)
      .single()

    const { data: account } = await supabase
      .from('email_accounts')
      .select('id, email_address, display_name')
      .eq('workspace_id', user.workspace_id)
      .eq(account_id ? 'id' : 'is_primary', account_id || true)
      .single()

    const fromEmail = account?.email_address || process.env.DEFAULT_FROM_EMAIL || 'noreply@cursive.io'
    const fromName = account?.display_name || workspace?.name || 'Cursive'

    // Send email
    const result = await sendEmail(
      {
        to,
        toName: to_name,
        from: fromEmail,
        fromName,
        subject,
        bodyHtml: body_html,
        bodyText: body_text,
      },
      account?.id,
      user.workspace_id
    )

    // Log the email
    await logSentEmail(
      user.workspace_id,
      lead_id || null,
      account?.id || null,
      {
        to,
        toName: to_name,
        from: fromEmail,
        fromName,
        subject,
        bodyHtml: body_html,
        bodyText: body_text,
      },
      result
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message_id: result.messageId,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
