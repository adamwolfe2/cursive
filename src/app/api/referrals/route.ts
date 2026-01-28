// Referrals API
// Get referral stats and manage referral codes

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getWorkspaceReferralStats,
  assignWorkspaceReferralCode,
} from '@/lib/services/referral.service'

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

    const stats = await getWorkspaceReferralStats(userData.workspace_id)

    // Generate referral code if not exists
    if (!stats.referralCode) {
      stats.referralCode = await assignWorkspaceReferralCode(userData.workspace_id)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to get referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to get referral stats' },
      { status: 500 }
    )
  }
}
