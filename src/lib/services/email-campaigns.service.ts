/**
 * Email Campaigns Service
 * Cursive Platform
 *
 * Service for sending email campaigns with tracking.
 * Supports multiple providers: Resend, EmailBison, SendGrid
 */

import { Resend } from 'resend'

export interface EmailSendRequest {
  to: string
  toName?: string
  subject: string
  bodyHtml: string
  bodyText?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
  tags?: string[]
  metadata?: Record<string, string>
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailTrackingData {
  emailSendId: string
  trackingPixelUrl: string
  clickTrackingPrefix: string
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send an email using Resend
 */
export async function sendEmailWithResend(
  request: EmailSendRequest
): Promise<EmailSendResult> {
  try {
    const fromEmail = request.fromEmail || 'notifications@meetcursive.com'
    const fromName = request.fromName || 'Cursive'

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: request.to,
      subject: request.subject,
      html: request.bodyHtml,
      text: request.bodyText,
      reply_to: request.replyTo,
      tags: request.tags?.map((tag) => ({ name: tag, value: 'true' })),
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send email using EmailBison
 */
export async function sendEmailWithEmailBison(
  request: EmailSendRequest
): Promise<EmailSendResult> {
  const apiKey = process.env.EMAILBISON_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'EmailBison API key not configured',
    }
  }

  try {
    const response = await fetch('https://api.emailbison.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: request.to,
        to_name: request.toName,
        from: request.fromEmail || 'notifications@meetcursive.com',
        from_name: request.fromName || 'Cursive',
        subject: request.subject,
        html: request.bodyHtml,
        text: request.bodyText,
        reply_to: request.replyTo,
        track_opens: true,
        track_clicks: true,
        metadata: request.metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || `EmailBison error: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.message_id,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Parse email template with variables
 */
export function parseEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, value || '')
  }

  // Remove any remaining unmatched variables
  result = result.replace(/\{\{\s*\w+\s*\}\}/g, '')

  return result
}

/**
 * Generate tracking pixel HTML
 */
export function generateTrackingPixel(trackingUrl: string): string {
  return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`
}

/**
 * Wrap links for click tracking
 */
export function wrapLinksForTracking(
  html: string,
  trackingPrefix: string
): string {
  // Find all href links and wrap them for tracking
  const linkRegex = /href="([^"]+)"/g

  return html.replace(linkRegex, (match, url) => {
    // Don't track mailto: or tel: links
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return match
    }

    const encodedUrl = encodeURIComponent(url)
    const trackedUrl = `${trackingPrefix}?url=${encodedUrl}`
    return `href="${trackedUrl}"`
  })
}

/**
 * Add unsubscribe link to email
 */
export function addUnsubscribeLink(html: string, unsubscribeUrl: string): string {
  const unsubscribeHtml = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center;">
      <p style="color: #71717a; font-size: 12px; margin: 0;">
        Don't want to receive these emails?
        <a href="${unsubscribeUrl}" style="color: #71717a; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `

  // Insert before closing body tag or at the end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeHtml}</body>`)
  }

  return html + unsubscribeHtml
}

/**
 * Generate a complete tracked email
 */
export function prepareTrackedEmail(
  bodyHtml: string,
  tracking: EmailTrackingData
): string {
  let html = bodyHtml

  // Add click tracking to links
  html = wrapLinksForTracking(html, tracking.clickTrackingPrefix)

  // Add tracking pixel for open tracking
  const trackingPixel = generateTrackingPixel(tracking.trackingPixelUrl)

  // Insert tracking pixel before closing body tag or at the end
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${trackingPixel}</body>`)
  } else {
    html += trackingPixel
  }

  return html
}

/**
 * Send email with provider selection
 */
export async function sendEmail(
  request: EmailSendRequest,
  provider: 'resend' | 'emailbison' = 'resend'
): Promise<EmailSendResult> {
  switch (provider) {
    case 'emailbison':
      return sendEmailWithEmailBison(request)
    case 'resend':
    default:
      return sendEmailWithResend(request)
  }
}
