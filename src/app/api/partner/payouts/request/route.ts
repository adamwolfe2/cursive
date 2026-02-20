
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

// Request validation schema
const payoutRequestSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be a valid number')
    .max(1000000, 'Amount exceeds maximum limit')
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: 'Invalid amount'
    }),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const apiKey = request.headers.get('X-API-Key')

    let partnerId: string | null = null

    // Try session-based auth first (for logged-in partners)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // User is logged in - get their linked partner
      const adminClient = createAdminClient()
      const { data: userData } = await adminClient
        .from('users')
        .select('linked_partner_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (userData?.linked_partner_id) {
        partnerId = userData.linked_partner_id
      } else {
        return NextResponse.json(
          { error: 'No partner account linked to your user' },
          { status: 403 }
        )
      }
    } else if (apiKey) {
      // Fallback to API key auth (for server-to-server integrations)
      const { data: apiPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('api_key', apiKey)
        .eq('is_active', true)
        .maybeSingle()

      if (!apiPartner) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }
      partnerId = apiPartner.id
    } else {
      return NextResponse.json(
        { error: 'Authentication required - please log in or provide API key' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = payoutRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { amount } = validation.data

    // Fetch partner data
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, stripe_account_id, stripe_onboarding_complete, available_balance, payout_threshold')
      .eq('id', partnerId)
      .eq('is_active', true)
      .maybeSingle()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Check if Stripe is connected
    if (!partner.stripe_account_id || !partner.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Please connect your Stripe account first' },
        { status: 400 }
      )
    }

    // Validate amount against available balance
    const availableBalance = Number(partner.available_balance || 0)
    const payoutThreshold = Number(partner.payout_threshold || 50)

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Amount exceeds available balance' },
        { status: 400 }
      )
    }

    if (amount < payoutThreshold) {
      return NextResponse.json(
        { error: `Minimum payout amount is $${payoutThreshold.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Check for pending payout requests
    const { data: pendingRequests } = await supabase
      .from('payout_requests')
      .select('id')
      .eq('partner_id', partner.id)
      .in('status', ['pending', 'approved', 'processing'])

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending payout request' },
        { status: 400 }
      )
    }

    // Create payout request
    const { data: payoutRequest, error: insertError } = await supabase
      .from('payout_requests')
      .insert({
        partner_id: partner.id,
        amount: amount,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select('id, partner_id, amount, status, requested_at, created_at')
      .maybeSingle()

    if (insertError) {
      safeError('[Payout Request] Failed to create payout request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create payout request' },
        { status: 500 }
      )
    }

    if (!payoutRequest) {
      return NextResponse.json(
        { error: 'Failed to create payout request' },
        { status: 500 }
      )
    }

    // Deduct from available balance atomically (will be added back if rejected)
    const { error: balanceError } = await supabase.rpc('deduct_available_balance', {
      p_partner_id: partner.id,
      p_amount: amount,
    })

    if (balanceError) {
      // Rollback payout request if balance deduction fails
      await supabase
        .from('payout_requests')
        .delete()
        .eq('id', payoutRequest.id)

      safeError('[Payout Request] Failed to deduct balance:', balanceError)
      return NextResponse.json(
        { error: 'Failed to deduct balance. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payout_request: payoutRequest,
      message: 'Payout request submitted successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      )
    }

    safeError('[Payout Request] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
