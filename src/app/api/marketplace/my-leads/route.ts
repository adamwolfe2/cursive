// My Purchased Leads API
// Returns all leads purchased by the user's workspace in a flat list

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return unauthorized()
    }

    // RATE LIMITING: Check default rate limit (100 per minute per user)
    const rateLimitResult = await withRateLimit(request, 'default', `user:${user.id}`)
    if (rateLimitResult) {
      return rateLimitResult
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const supabase = await createClient()

    // Pagination
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || '100'), 500)
    const offset = Math.max(Number(url.searchParams.get('offset') || '0'), 0)

    // Get completed purchases for this workspace (paginated)
    const { data: purchases } = await supabase
      .from('marketplace_purchases')
      .select('id, total_price, completed_at')
      .eq('buyer_workspace_id', user.workspace_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ leads: [] })
    }

    const purchaseIds = purchases.map((p) => p.id)

    // Get all purchase items with lead details
    const { data: purchaseItems } = await supabase
      .from('marketplace_purchase_items')
      .select(
        `
        purchase_id,
        price_at_purchase,
        intent_score_at_purchase,
        lead:leads (
          id,
          first_name,
          last_name,
          email,
          phone,
          job_title,
          company_name,
          company_domain,
          company_industry,
          company_size,
          city,
          state,
          country,
          linkedin_url,
          intent_score_calculated,
          verification_status
        )
      `
      )
      .in('purchase_id', purchaseIds)

    if (!purchaseItems) {
      return NextResponse.json({ leads: [] })
    }

    const leads = purchaseItems
      .filter((item) => item.lead)
      .map((item: any) => {
        const purchase = purchases.find((p) => p.id === item.purchase_id)!
        return {
          ...item.lead,
          purchase_id: item.purchase_id,
          purchased_at: purchase.completed_at,
          price_paid: item.price_at_purchase,
          purchase_total: purchase.total_price,
        }
      })

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
    })
  } catch (error) {
    safeError('Failed to fetch purchased leads:', error)
    return handleApiError(error)
  }
}
