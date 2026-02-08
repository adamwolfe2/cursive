import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FREE_TRIAL_CREDITS } from '@/lib/constants/credit-packages'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Check if already granted (idempotent)
    const { data: existingGrant } = await supabase
      .from('free_credit_grants')
      .select('id')
      .eq('workspace_id', userData.workspace_id)
      .single()

    if (existingGrant) {
      return NextResponse.json({
        message: 'Free credits already granted',
        credits: 0,
        alreadyGranted: true
      })
    }

    // Grant credits - add to workspace balance via RPC
    const { error: updateError } = await supabase.rpc('add_workspace_credits', {
      p_workspace_id: userData.workspace_id,
      p_amount: FREE_TRIAL_CREDITS.credits,
      p_source: 'free_trial',
    })

    if (updateError) {
      // If RPC doesn't exist, try direct insert/update on workspace_credits table
      const { data: existing } = await supabase
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', userData.workspace_id)
        .single()

      if (existing) {
        await supabase
          .from('workspace_credits')
          .update({ balance: existing.balance + FREE_TRIAL_CREDITS.credits })
          .eq('workspace_id', userData.workspace_id)
      } else {
        await supabase
          .from('workspace_credits')
          .insert({
            workspace_id: userData.workspace_id,
            balance: FREE_TRIAL_CREDITS.credits,
            total_purchased: 0,
            total_used: 0,
            total_earned: 0,
          })
      }
    }

    // Record the grant
    await supabase
      .from('free_credit_grants')
      .insert({
        workspace_id: userData.workspace_id,
        user_id: userData.id,
        credits_granted: FREE_TRIAL_CREDITS.credits,
      })

    return NextResponse.json({
      message: 'Free credits granted successfully',
      credits: FREE_TRIAL_CREDITS.credits,
      alreadyGranted: false,
    })
  } catch (error) {
    console.error('Failed to grant free credits:', error)
    return NextResponse.json(
      { error: 'Failed to grant free credits' },
      { status: 500 }
    )
  }
}
