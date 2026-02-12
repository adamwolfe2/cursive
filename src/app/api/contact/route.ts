export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required'),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'public-form')
    if (rateLimited) return rateLimited

    const body = await request.json()
    const validated = contactSchema.parse(body)

    // Get client info
    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       null
    const user_agent = request.headers.get('user-agent') || null

    // Insert message using admin client (bypasses RLS for public submission)
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
        message: validated.message,
        priority: validated.priority,
        status: 'unread',
        source: 'website',
        ip_address,
        user_agent,
      })
      .select('id')
      .single()

    if (error) {
      safeError('[Contact] Insert error:', error)
      throw new Error('Database insert failed')
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully!'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[Contact] Submission error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
