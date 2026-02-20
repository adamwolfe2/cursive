
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FREE_TRIAL_CREDITS } from '@/lib/constants/credit-packages'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      safeError('[Grant Free Credits] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (userError) {
      safeError('[Grant Free Credits] Failed to fetch user data:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Atomically record the grant first — if a unique constraint exists on
    // workspace_id, the second concurrent request will fail here instead of
    // double-granting credits. We use upsert with ignoreDuplicates to detect.
    const { data: grantResult, error: grantError } = await supabase
      .from('free_credit_grants')
      .upsert(
        {
          workspace_id: userData.workspace_id,
          user_id: userData.id,
          credits_granted: FREE_TRIAL_CREDITS.credits,
        },
        { onConflict: 'workspace_id', ignoreDuplicates: true }
      )
      .select('id')

    // If upsert returned no rows, the grant already existed (duplicate ignored)
    if (!grantResult?.length) {
      return NextResponse.json({
        message: 'Free credits already granted',
        credits: 0,
        alreadyGranted: true,
      })
    }

    // If there was an actual error (not a conflict), check with a select
    if (grantError) {
      const { data: existingGrant } = await supabase
        .from('free_credit_grants')
        .select('id')
        .eq('workspace_id', userData.workspace_id)
        .maybeSingle()

      if (existingGrant) {
        return NextResponse.json({
          message: 'Free credits already granted',
          credits: 0,
          alreadyGranted: true,
        })
      }
      throw grantError
    }

    // Grant recorded successfully — now add credits using admin client
    // (credit writes need admin privileges to bypass RLS)
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.rpc('add_workspace_credits', {
      p_workspace_id: userData.workspace_id,
      p_amount: FREE_TRIAL_CREDITS.credits,
      p_source: 'free_trial',
    })

    if (updateError) {
      safeError('[Grant Free Credits] RPC add_workspace_credits failed, using fallback:', updateError)

      // Fallback: Insert or increment credits (NOT upsert which overwrites balance)
      const { data: existing } = await adminClient
        .from('workspace_credits')
        .select('balance, total_earned')
        .eq('workspace_id', userData.workspace_id)
        .maybeSingle()

      if (existing) {
        // Increment existing balance (safe: free_credit_grants prevents duplicates)
        const { error: updateErr } = await adminClient
          .from('workspace_credits')
          .update({
            balance: existing.balance + FREE_TRIAL_CREDITS.credits,
            total_earned: (existing.total_earned || 0) + FREE_TRIAL_CREDITS.credits,
          })
          .eq('workspace_id', userData.workspace_id)

        if (updateErr) {
          throw updateErr
        }
      } else {
        // No credit record yet — create one
        const { error: insertErr } = await adminClient
          .from('workspace_credits')
          .insert({
            workspace_id: userData.workspace_id,
            balance: FREE_TRIAL_CREDITS.credits,
            total_purchased: 0,
            total_used: 0,
            total_earned: FREE_TRIAL_CREDITS.credits,
          })

        if (insertErr) {
          throw insertErr
        }
      }
    }

    return NextResponse.json({
      message: 'Free credits granted successfully',
      credits: FREE_TRIAL_CREDITS.credits,
      alreadyGranted: false,
    })
  } catch (error) {
    safeError('Failed to grant free credits:', error)
    return NextResponse.json(
      { error: 'Failed to grant free credits' },
      { status: 500 }
    )
  }
}
