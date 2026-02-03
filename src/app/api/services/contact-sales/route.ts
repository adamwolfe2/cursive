import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
 * POST /api/services/contact-sales
 * Submit a high-touch service tier inquiry
 */
export async function POST(request: NextRequest) {
  try {
    // Optionally verify authentication (can be public or authenticated)
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

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
      .select()
      .single()

    if (error) {
      console.error('[API] Contact sales insert error:', error)
      throw new Error(error.message)
    }

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to customer

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

    console.error('[API] Contact sales error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    )
  }
}
