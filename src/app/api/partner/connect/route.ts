// Stripe Connect Onboarding API
// POST /api/partner/connect - Initiate Stripe Connect account creation

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe/client'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const connectSchema = z.object({
  partnerId: z.string().uuid('Invalid partner ID'),
})

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const stripe = getStripeClient()
    // Validate input
    const body = await request.json()
    const { partnerId } = connectSchema.parse(body)

    const supabase = createAdminClient()

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, email, company_name, stripe_account_id, user_id')
      .eq('id', partnerId)
      .maybeSingle()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Verify the authenticated user owns this partner record
    // Also check linked_partner_id as defense-in-depth against partner ID enumeration
    if (partner.user_id !== user.id || (user.linked_partner_id && user.linked_partner_id !== partnerId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    let accountId = partner.stripe_account_id

    // Create Stripe Connect Express account if does not exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: partner.email,
        business_type: 'company',
        company: {
          name: partner.company_name || undefined,
        },
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          partner_id: partner.id,
        },
      })

      accountId = account.id

      // Save account ID to database
      await supabase
        .from('partners')
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id)

    }

    // Create Account Link for onboarding
    const baseUrl = request.nextUrl.origin
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/partner/register?refresh=true`,
      return_url: `${baseUrl}/partner/connect/success?partner_id=${partner.id}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    })
  } catch (error: unknown) {
    safeError('[Stripe Connect] Error:', error)
    return handleApiError(error)
  }
}