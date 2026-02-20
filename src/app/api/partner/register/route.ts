// Partner Registration API
// POST /api/partner/register - Create new partner account


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withRateLimit, getRequestIdentifier } from '@/lib/middleware/rate-limiter'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(200),
  phone: z.string().max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit: use IP-based key since this is an unauthenticated endpoint
    const rateLimitResult = await withRateLimit(
      request,
      'partner-register',
      getRequestIdentifier(request)
    )
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate input
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      )
    }

    const validatedData = validation.data
    const supabase = createAdminClient()

    // Check if partner already exists
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id, email')
      .eq('email', validatedData.email)
      .maybeSingle()

    if (existingPartner) {
      return NextResponse.json(
        {
          error: 'A partner account with this email already exists',
          partnerId: existingPartner.id,
        },
        { status: 409 }
      )
    }

    // Create partner record
    const { data: partner, error: createError } = await supabase
      .from('partners')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        company_name: validatedData.company_name,
        status: 'pending', // pending until Stripe Connect onboarding completes
        is_active: false, // not active until approved
        base_commission_rate: 0.30, // 30% default commission
      })
      .select('id, email, api_key')
      .maybeSingle()

    if (createError || !partner) {
      safeError('[Partner Register] Failed to create partner:', createError)
      return NextResponse.json(
        { error: 'Failed to create partner account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      partnerId: partner.id,
      apiKey: partner.api_key,
      message: 'Partner account created successfully',
    })
  } catch (error) {
    safeError('[Partner Register] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
