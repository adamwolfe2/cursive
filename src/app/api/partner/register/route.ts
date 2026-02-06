// Partner Registration API
// POST /api/partner/register - Create new partner account

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Validate input
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const supabase = createAdminClient()

    // Check if partner already exists
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id, email')
      .eq('email', validatedData.email)
      .single()

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
      .single()

    if (createError || !partner) {
      console.error('[Partner Register] Failed to create partner:', createError)
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
    console.error('[Partner Register] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
