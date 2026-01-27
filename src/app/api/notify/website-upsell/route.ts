import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

// Input validation schema
const requestSchema = z.object({
  businessName: z.string().min(1).max(200),
  industry: z.string().max(100).optional(),
  serviceAreas: z.array(z.string().max(100)).max(20).optional(),
  userEmail: z.string().email().max(255),
})

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const parseResult = requestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { businessName, industry, serviceAreas, userEmail } = parseResult.data

    // Escape all user input for HTML
    const safeBusinessName = escapeHtml(businessName)
    const safeIndustry = industry ? escapeHtml(industry) : 'Not specified'
    const safeServiceAreas = serviceAreas && serviceAreas.length > 0
      ? serviceAreas.map(escapeHtml).join(', ')
      : 'Not specified'
    const safeUserEmail = escapeHtml(userEmail)

    // Initialize Resend client lazily
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send notification email to admin
    const { error: emailError } = await resend.emails.send({
      from: 'Cursive <notifications@meetcursive.com>',
      to: 'adam@meetcursive.com',
      subject: `Website Upsell Request - ${safeBusinessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">New Website Upsell Opportunity</h2>

          <p>A new business signed up without a website:</p>

          <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Business Name:</strong> ${safeBusinessName}</p>
            <p><strong>Industry:</strong> ${safeIndustry}</p>
            <p><strong>Service Areas:</strong> ${safeServiceAreas}</p>
            <p><strong>Contact Email:</strong> ${safeUserEmail}</p>
          </div>

          <p>This is an opportunity to offer website development services.</p>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />

          <p style="color: #71717a; font-size: 12px;">
            This notification was sent from Cursive platform.
          </p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Failed to send upsell notification:', emailError)
      // Don't fail the request if email fails - the signup should still work
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in website upsell notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
