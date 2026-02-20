
import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, createEmailTemplate, EMAIL_CONFIG } from '@/lib/email/resend-client'

const contactSalesSchema = z.object({
  tier_slug: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().nullable()
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
 * POST /api/services/contact-sales
 * Submit a high-touch service tier inquiry
 */
export async function POST(request: NextRequest) {
  try {
    // Optionally verify authentication (can be public or authenticated)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Parse and validate request body
    const body = await request.json()
    const validated = contactSalesSchema.parse(body)

    // Get client info
    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       null
    const user_agent = request.headers.get('user-agent') || null

    // Create support message with high priority
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('support_messages')
      .insert({
        name: validated.name,
        email: validated.email,
        subject: `Service Inquiry: ${validated.tier_slug}`,
        message: `
Company: ${validated.company}
${validated.phone ? `Phone: ${validated.phone}` : ''}
${validated.website ? `Website: ${validated.website}` : ''}
Service Tier: ${validated.tier_slug}

Message:
${validated.message}
        `.trim(),
        priority: 'high',
        status: 'unread',
        source: 'service_inquiry',
        ip_address,
        user_agent,
      })
      .select('id')
      .maybeSingle()

    if (error) {
      safeError('[API] Contact sales insert error:', error)
      throw new Error(error.message)
    }

    // Send notification email to sales team
    const salesNotificationHtml = createEmailTemplate({
      preheader: `New service inquiry from ${escapeHtml(validated.name)} at ${escapeHtml(validated.company)}`,
      title: 'New Service Inquiry',
      content: `
        <h1 class="email-title">New Service Inquiry: ${escapeHtml(validated.tier_slug)}</h1>

        <div style="background: #f4f4f5; border-left: 4px solid ${EMAIL_CONFIG.colors.primary}; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 8px 0;"><strong>Name:</strong> ${escapeHtml(validated.name)}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${escapeHtml(validated.email)}</p>
          <p style="margin: 8px 0;"><strong>Company:</strong> ${escapeHtml(validated.company)}</p>
          ${validated.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${escapeHtml(validated.phone)}</p>` : ''}
          ${validated.website ? `<p style="margin: 8px 0;"><strong>Website:</strong> <a href="${escapeHtml(validated.website)}" style="color: ${EMAIL_CONFIG.colors.primary};">${escapeHtml(validated.website)}</a></p>` : ''}
          <p style="margin: 8px 0;"><strong>Service Tier:</strong> ${escapeHtml(validated.tier_slug)}</p>
          <p style="margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <h3 style="margin-top: 24px;">Message:</h3>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">
          ${escapeHtml(validated.message)}
        </div>

        <p style="color: ${EMAIL_CONFIG.colors.textMuted}; font-size: 14px; margin-top: 24px;">
          Reply directly to the lead at <a href="mailto:${escapeHtml(validated.email)}" style="color: ${EMAIL_CONFIG.colors.primary};">${escapeHtml(validated.email)}</a>
        </p>
      `,
    })

    const salesEmailResult = await sendEmail({
      to: 'hello@meetcursive.com',
      subject: `New Service Inquiry: ${validated.tier_slug} - ${validated.name} (${validated.company})`,
      html: salesNotificationHtml,
    })

    if (!salesEmailResult.success) {
      safeError('[API] Failed to send sales notification email:', salesEmailResult.error)
    }

    // Send confirmation email to customer
    const customerConfirmationHtml = createEmailTemplate({
      preheader: `We received your inquiry and will be in touch within 24 hours.`,
      title: 'We Received Your Inquiry',
      content: `
        <h1 class="email-title">Thanks for reaching out, ${escapeHtml(validated.name)}.</h1>

        <p class="email-text">
          We received your inquiry about our <strong>${escapeHtml(validated.tier_slug)}</strong> service tier and are excited to learn more about how we can help ${escapeHtml(validated.company)}.
        </p>

        <p class="email-text">
          Here's what happens next:
        </p>

        <ul style="margin: 16px 0; padding-left: 24px;">
          <li style="margin-bottom: 8px;">A member of our team will review your inquiry</li>
          <li style="margin-bottom: 8px;">We'll reach out within 24 hours to schedule a call</li>
          <li style="margin-bottom: 8px;">We'll put together a tailored plan for your needs</li>
        </ul>

        <p class="email-text">
          In the meantime, you can book a call directly if you'd like to get started sooner:
        </p>

        <a href="https://cal.com/adamwolfe/cursive-ai-audit" class="email-button">
          Book a Call
        </a>

        <p class="email-text">
          Questions? Just reply to this email. I read every one.
        </p>

        <div class="email-signature">
          <p class="email-text" style="margin-bottom: 0;">
            Adam
          </p>
        </div>
      `,
    })

    const customerEmailResult = await sendEmail({
      to: validated.email,
      subject: 'We received your inquiry - Cursive',
      html: customerConfirmationHtml,
    })

    if (!customerEmailResult.success) {
      safeError('[API] Failed to send customer confirmation email:', customerEmailResult.error)
      // Don't throw - the inquiry was saved successfully
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your inquiry! Our team will contact you within 24 hours.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[API] Contact sales error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    )
  }
}
