import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { FREE_TRIAL_CREDITS } from '@/lib/constants/credit-packages'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Atomically record the grant first — if a unique constraint exists on
    // workspace_id, the second concurrent request will fail here instead of
    // double-granting credits. We use upsert with ignoreDuplicates to detect.
    const supabase = await createClient()
    const { data: grantResult, error: grantError } = await supabase
      .from('free_credit_grants')
      .upsert(
        {
          workspace_id: user.workspace_id,
          user_id: user.id,
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
        .eq('workspace_id', user.workspace_id)
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
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.rpc('add_workspace_credits', {
      p_workspace_id: user.workspace_id,
      p_amount: FREE_TRIAL_CREDITS.credits,
      p_source: 'free_trial',
    })

    if (updateError) {
      safeError('[Grant Free Credits] RPC add_workspace_credits failed, using fallback:', updateError)

      // Atomic upsert with SQL increment — avoids read-then-write race condition
      const credits = FREE_TRIAL_CREDITS.credits
      const { error: upsertErr } = await adminClient.rpc('exec_sql', {
        query: `
          INSERT INTO workspace_credits (workspace_id, balance, total_purchased, total_used, total_earned)
          VALUES ($1, $2, 0, 0, $2)
          ON CONFLICT (workspace_id) DO UPDATE SET
            balance = workspace_credits.balance + $2,
            total_earned = workspace_credits.total_earned + $2
        `.trim(),
        params: [user.workspace_id, credits],
      })

      // If the custom RPC isn't available, fall back to safe upsert
      if (upsertErr) {
        const { error: fallbackErr } = await adminClient
          .from('workspace_credits')
          .upsert(
            {
              workspace_id: user.workspace_id,
              balance: credits,
              total_purchased: 0,
              total_used: 0,
              total_earned: credits,
            },
            { onConflict: 'workspace_id' }
          )

        if (fallbackErr) {
          throw fallbackErr
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
    return handleApiError(error)
  }
}
