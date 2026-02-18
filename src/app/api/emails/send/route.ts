// Email Send API
// Send transactional emails via Resend


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.string(),
  data: z.record(z.any()),
})

/**
 * Escape HTML to prevent XSS in email templates
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Generate HTML content based on template name and data
 */
function renderTemplate(template: string, data: Record<string, any>): { html: string; text: string } {
  switch (template) {
    case 'notification': {
      const title = String(data.title || 'Notification')
      const message = String(data.message || '')
      const actionUrl = data.actionUrl ? String(data.actionUrl) : null
      const actionLabel = data.actionLabel ? String(data.actionLabel) : 'View Details'

      const html = createEmailTemplate({
        preheader: message.substring(0, 100),
        title,
        content: `
          <h1 class="email-title">${escapeHtml(title)}</h1>
          <p class="email-text">${escapeHtml(message)}</p>
          ${actionUrl ? `<a href="${escapeHtml(actionUrl)}" class="email-button">${escapeHtml(actionLabel)}</a>` : ''}
        `,
      })

      const text = `${title}\n\n${message}${actionUrl ? `\n\n${actionLabel}: ${actionUrl}` : ''}`

      return { html, text }
    }

    case 'welcome': {
      const name = String(data.name || 'there')
      const loginUrl = data.loginUrl ? String(data.loginUrl) : null

      const html = createEmailTemplate({
        preheader: `Welcome to Cursive, ${name}!`,
        title: 'Welcome to Cursive',
        content: `
          <h1 class="email-title">Welcome to Cursive, ${escapeHtml(name)}!</h1>
          <p class="email-text">
            We're excited to have you on board. Your account is ready to go.
          </p>
          ${loginUrl ? `<a href="${escapeHtml(loginUrl)}" class="email-button">Get Started</a>` : ''}
          <div class="email-signature">
            <p class="email-text" style="margin-bottom: 0;">Adam</p>
          </div>
        `,
      })

      const text = `Welcome to Cursive, ${name}!\n\nWe're excited to have you on board. Your account is ready to go.${loginUrl ? `\n\nGet Started: ${loginUrl}` : ''}\n\nAdam`

      return { html, text }
    }

    case 'confirmation': {
      const name = String(data.name || 'there')
      const message = String(data.message || 'Your request has been received.')

      const html = createEmailTemplate({
        preheader: message.substring(0, 100),
        title: 'Confirmation',
        content: `
          <h1 class="email-title">Hi ${escapeHtml(name)},</h1>
          <p class="email-text">${escapeHtml(message)}</p>
          <div class="email-signature">
            <p class="email-text" style="margin-bottom: 0;">The Cursive Team</p>
          </div>
        `,
      })

      const text = `Hi ${name},\n\n${message}\n\nThe Cursive Team`

      return { html, text }
    }

    case 'alert': {
      const title = String(data.title || 'Alert')
      const message = String(data.message || '')
      const severity = String(data.severity || 'info')
      const borderColor = severity === 'error' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#2563eb'

      const html = createEmailTemplate({
        preheader: `${title}: ${message.substring(0, 80)}`,
        title,
        content: `
          <h1 class="email-title">${escapeHtml(title)}</h1>
          <div style="background: #f4f4f5; border-left: 4px solid ${borderColor}; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0;">${escapeHtml(message)}</p>
          </div>
        `,
      })

      const text = `${title}\n\n${message}`

      return { html, text }
    }

    default: {
      // Generic template: render data as a simple message
      const title = String(data.title || data.subject || 'Message')
      const message = String(data.message || data.body || JSON.stringify(data))

      const html = createEmailTemplate({
        preheader: message.substring(0, 100),
        title,
        content: `
          <h1 class="email-title">${escapeHtml(title)}</h1>
          <p class="email-text">${escapeHtml(message)}</p>
        `,
      })

      const text = `${title}\n\n${message}`

      return { html, text }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - prevent unauthenticated email sending
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const validated = emailSchema.parse(body)

    // Render the template into HTML and plain text
    const { html, text } = renderTemplate(validated.template, validated.data)

    // Send the email via Resend
    const result = await sendEmail({
      to: validated.to,
      subject: validated.subject,
      html,
      text,
    })

    if (!result.success) {
      safeError('[API] Email send failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.data?.data?.id,
    })
  } catch (error) {
    safeError('Error sending email:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
