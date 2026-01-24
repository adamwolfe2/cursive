import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessName, industry, serviceAreas, userEmail } = body

    // Validate required fields
    if (!businessName || !userEmail) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      )
    }

    // Send notification email to admin
    const { error: emailError } = await resend.emails.send({
      from: 'Cursive <notifications@meetcursive.com>',
      to: 'adam@meetcursive.com',
      subject: `Website Upsell Request - ${businessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">New Website Upsell Opportunity</h2>

          <p>A new business signed up without a website:</p>

          <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Business Name:</strong> ${businessName}</p>
            <p><strong>Industry:</strong> ${industry || 'Not specified'}</p>
            <p><strong>Service Areas:</strong> ${serviceAreas?.length > 0 ? serviceAreas.join(', ') : 'Not specified'}</p>
            <p><strong>Contact Email:</strong> ${userEmail}</p>
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
