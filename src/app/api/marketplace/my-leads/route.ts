// My Purchased Leads API
// Returns all leads purchased by the user's workspace in a flat list

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/middleware/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RATE LIMITING: Check default rate limit (100 per minute per user)
    const rateLimitResult = await withRateLimit(request, 'default', `user:${user.id}`)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get all completed purchases for this workspace
    const { data: purchases } = await supabase
      .from('marketplace_purchases')
      .select('id, total_price, completed_at')
      .eq('buyer_workspace_id', userData.workspace_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

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

    // Flatten the data structure and add purchase metadata
    const leads = purchaseItems
      .filter((item) => item.lead) // Filter out any items without lead data
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
    console.error('Failed to fetch purchased leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchased leads' },
      { status: 500 }
    )
  }
}
