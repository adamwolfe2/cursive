// Billing Portal API Route
// POST /api/billing/portal - Create Stripe Customer Portal session


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createPortalSession } from '@/lib/stripe/client'
import { handleApiError, unauthorized, badRequest, forbidden } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return badRequest('No workspace found')
    }

    // 2. SECURITY: Get stripe_customer_id from workspace table (source of truth)
    // This prevents users from manipulating their own stripe_customer_id field
    const supabase = await createClient()
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('stripe_customer_id')
      .eq('id', user.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return badRequest('Workspace not found')
    }

    // 3. Verify workspace has a Stripe customer ID
    if (!workspace.stripe_customer_id) {
      return badRequest('No active subscription found')
    }

    // 4. Create portal session with validated customer ID
    const baseUrl = request.nextUrl.origin
    const session = await createPortalSession({
      customerId: workspace.stripe_customer_id,
      returnUrl: `${baseUrl}/settings/billing`,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      url: session.url,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
