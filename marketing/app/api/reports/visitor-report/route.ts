/**
 * Visitor Report API Route
 * Handles exit intent popup visitor report requests
 * Sends internal lead notification + user confirmation via Resend
 */

import { NextRequest, NextResponse } from 'next/server'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Escape HTML to prevent XSS
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
 * Send visitor report emails via Resend
 */
async function sendVisitorReportEmails(data: {
  email: string
  company?: string
  reportType: string
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || 'Cursive <noreply@meetcursive.com>'
  const supportEmail = process.env.SUPPORT_EMAIL || 'hello@meetcursive.com'

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  // Internal notification email
  const internalEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Visitor Report Request</h2>

      <div style="background: #f7f9fb; border-left: 4px solid #007aff; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 8px 0;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        ${data.company ? `<p style="margin: 8px 0;"><strong>Company:</strong> ${escapeHtml(data.company)}</p>` : ''}
        <p style="margin: 8px 0;"><strong>Report Type:</strong> ${escapeHtml(data.reportType)}</p>
        <p style="margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <p style="color: #666; line-height: 1.6;">
        This lead came from the exit intent popup on meetcursive.com. Follow up within 24 hours.
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 24px;">
        Reply directly to <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>
      </p>
    </div>
  `

  // User confirmation email
  const userEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your Free Visitor Report Is Coming</h2>

      <p style="color: #666; line-height: 1.6;">
        Thanks for your interest in Cursive!
      </p>

      <p style="color: #666; line-height: 1.6;">
        Our team is preparing your free report showing the companies that recently visited your website. You'll receive it within 24 hours.
      </p>

      <div style="background: #f7f9fb; border-left: 4px solid #007aff; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 12px 0; color: #333;"><strong>While you wait:</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #666;">
          <li style="margin-bottom: 8px;">Learn how Cursive identifies anonymous website visitors on our <a href="https://www.meetcursive.com/platform" style="color: #007aff; text-decoration: none;">platform page</a></li>
          <li style="margin-bottom: 8px;">See pricing and get started at <a href="https://www.meetcursive.com/pricing" style="color: #007aff; text-decoration: none;">meetcursive.com/pricing</a></li>
          <li>Book a 30-minute demo with our team at <a href="https://cal.com/gotdarrenhill/30min" style="color: #007aff; text-decoration: none;">our calendar</a></li>
        </ul>
      </div>

      <p style="color: #666; line-height: 1.6;">
        Best regards,<br/>
        The Cursive Team
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />

      <p style="color: #999; font-size: 12px; margin: 0;">
        Cursive AI | <a href="https://www.meetcursive.com" style="color: #007aff; text-decoration: none;">meetcursive.com</a>
      </p>
    </div>
  `

  // Send internal notification
  const internalResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: supportEmail,
      subject: `New Visitor Report Request from ${data.email}`,
      html: internalEmailHtml,
      reply_to: data.email,
    }),
  })

  if (!internalResponse.ok) {
    const errorData = await internalResponse.json()
    throw new Error(`Failed to send internal email: ${JSON.stringify(errorData)}`)
  }

  // Send user confirmation
  const userResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: data.email,
      subject: 'Your free visitor report is on its way - Cursive',
      html: userEmailHtml,
    }),
  })

  if (!userResponse.ok) {
    const errorData = await userResponse.json()
    console.error('Failed to send user confirmation email:', errorData)
    // Don't throw — internal notification already sent successfully
  }
}

/**
 * POST handler for visitor report requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const data = {
      email: body.email.trim().toLowerCase(),
      company: body.company ? String(body.company).trim() : undefined,
      reportType: body.reportType ? String(body.reportType) : 'visitor_identification',
    }

    await sendVisitorReportEmails(data)

    return NextResponse.json({
      success: true,
      message: 'Report will be sent to your email shortly',
    })
  } catch (error) {
    console.error('Error processing visitor report request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
