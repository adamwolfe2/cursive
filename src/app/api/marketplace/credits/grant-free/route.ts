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

    // Grant credits - add to workspace balance
    const { error: updateError } = await supabase.rpc('add_credits_to_workspace', {
      p_workspace_id: userData.workspace_id,
      p_credits: FREE_TRIAL_CREDITS.credits,
    })

    if (updateError) {
      // If RPC doesn't exist, try direct update
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('credits_balance')
        .eq('id', userData.workspace_id)
        .single()

      const currentBalance = (workspace as any)?.credits_balance || 0

      await supabase
        .from('workspaces')
        .update({ credits_balance: currentBalance + FREE_TRIAL_CREDITS.credits })
        .eq('id', userData.workspace_id)
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
