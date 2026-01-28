// Marketplace Purchase History API
// Get purchase history for the current workspace

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const repo = new MarketplaceRepository()
    const { purchases, total } = await repo.getPurchaseHistory(userData.workspace_id, {
      limit: 100,
    })

    // Calculate totals
    const totalSpent = purchases.reduce((sum, p) => sum + (p.total_price || 0), 0)
    const totalLeads = purchases.reduce((sum, p) => sum + (p.total_leads || 0), 0)

    return NextResponse.json({
      purchases,
      total,
      totalSpent,
      totalLeads,
    })
  } catch (error) {
    console.error('Failed to get purchase history:', error)
    return NextResponse.json(
      { error: 'Failed to get purchase history' },
      { status: 500 }
    )
  }
}
