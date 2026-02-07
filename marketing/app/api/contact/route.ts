/**
 * Contact Form API Route
 * Handles contact form submissions and sends email notifications
 */

import { NextRequest, NextResponse } from 'next/server'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Types for form data
interface ContactFormData {
  name: string
  email: string
  company?: string
  message: string
}

interface ContactFormError {
  field: string
  message: string
}

/**
 * Validate contact form data
 */
function validateContactForm(data: Record<string, unknown>): { valid: boolean; errors: ContactFormError[] } {
  const errors: ContactFormError[] = []

  // Validate name
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' })
  }

  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  // Validate message
  if (!data.message || typeof data.message !== 'string') {
    errors.push({ field: 'message', message: 'Message is required' })
  } else if (data.message.trim().length < 10) {
    errors.push({ field: 'message', message: 'Message must be at least 10 characters' })
  }

  // Validate company (optional but if provided, validate length)
  if (data.company && typeof data.company === 'string' && data.company.trim().length > 200) {
    errors.push({ field: 'company', message: 'Company name is too long' })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Send contact form email using Resend
 */
async function sendContactEmail(formData: ContactFormData): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || 'Cursive <noreply@meetcursive.com>'
  const supportEmail = process.env.SUPPORT_EMAIL || 'hello@meetcursive.com'

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  // Email template for internal notification
  const internalEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contact Form Submission</h2>

      <div style="background: #f7f9fb; border-left: 4px solid #007aff; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 8px 0;"><strong>Name:</strong> ${escapeHtml(formData.name)}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${escapeHtml(formData.email)}</p>
        ${formData.company ? `<p style="margin: 8px 0;"><strong>Company:</strong> ${escapeHtml(formData.company)}</p>` : ''}
        <p style="margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <h3 style="color: #333; margin-top: 24px;">Message:</h3>
      <div style="background: #f7f9fb; padding: 16px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">
        ${escapeHtml(formData.message)}
      </div>

      <p style="color: #666; font-size: 12px; margin-top: 24px;">
        Reply to this contact at <a href="mailto:${escapeHtml(formData.email)}">${escapeHtml(formData.email)}</a>
      </p>
    </div>
  `

  // Email template for customer confirmation
  const customerEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Reaching Out</h2>

      <p style="color: #666; line-height: 1.6;">
        Hi ${escapeHtml(formData.name)},
      </p>

      <p style="color: #666; line-height: 1.6;">
        We received your message and appreciate you taking the time to get in touch. Our team will review your inquiry and get back to you within 24 hours.
      </p>

      <div style="background: #f7f9fb; border-left: 4px solid #007aff; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #666;">
          <strong>In the meantime:</strong>
        </p>
        <ul style="margin: 12px 0; padding-left: 20px; color: #666;">
          <li>Check out our <a href="https://meetcursive.com/faq" style="color: #007aff; text-decoration: none;">FAQ page</a> for quick answers</li>
          <li>Visit our <a href="https://meetcursive.com/platform" style="color: #007aff; text-decoration: none;">platform page</a> to learn more</li>
          <li>Book a demo at <a href="https://cal.com/adamwolfe/cursive-ai-audit" style="color: #007aff; text-decoration: none;">our calendar</a></li>
        </ul>
      </div>

      <p style="color: #666; line-height: 1.6;">
        Best regards,<br/>
        The Cursive Team
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />

      <p style="color: #999; font-size: 12px; margin: 0;">
        Cursive AI | <a href="https://meetcursive.com" style="color: #007aff; text-decoration: none;">meetcursive.com</a>
      </p>
    </div>
  `

  // Send internal notification
  const internalResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: supportEmail,
      subject: `New Contact Form Submission from ${formData.name}`,
      html: internalEmailHtml,
      reply_to: formData.email,
    }),
  })

  if (!internalResponse.ok) {
    const errorData = await internalResponse.json()
    throw new Error(`Failed to send internal email: ${JSON.stringify(errorData)}`)
  }

  // Send customer confirmation email
  const customerResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: formData.email,
      subject: 'We received your message - Cursive',
      html: customerEmailHtml,
    }),
  })

  if (!customerResponse.ok) {
    const errorData = await customerResponse.json()
    console.error('Failed to send customer confirmation email:', errorData)
    // Don't throw here as the internal email was sent successfully
  }
}

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
 * POST handler for contact form submissions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate form data
    const validation = validateContactForm(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    // Prepare form data
    const formData: ContactFormData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      company: body.company ? body.company.trim() : undefined,
      message: body.message.trim(),
    }

    // Send emails
    await sendContactEmail(formData)

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing contact form:', error)

    // Return generic error message for security
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request. Please try again later.',
      },
      { status: 500 }
    )
  }
}
