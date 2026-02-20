/**
 * Billing Cancel API Route
 * Cursive Platform
 *
 * Cancels the user's subscription at end of billing period.
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelSubscription, resumeSubscription } from '@/lib/stripe/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

// Request validation schema
const cancelSchema = z.object({
  action: z.enum(['cancel', 'resume']).default('cancel'),
  reason: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Validate request body
    const body = await req.json()
    const validation = cancelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { action, reason } = validation.data

    // Get workspace with subscription info
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, stripe_subscription_id, stripe_customer_id, plan')
      .eq('id', user.workspace_id)
      .maybeSingle()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    if (!workspace.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Perform the action
    let subscription
    if (action === 'cancel') {
      subscription = await cancelSubscription(workspace.stripe_subscription_id)

      // Log cancellation reason if provided
      if (reason) {
        await supabase.from('subscription_events').insert({
          workspace_id: workspace.id,
          event_type: 'cancellation_requested',
          metadata: {
            reason,
            requested_at: new Date().toISOString(),
            user_id: user.id,
          },
        })
      }

      // Update workspace + sync cancel state to users table
      await Promise.all([
        supabase
          .from('workspaces')
          .update({
            subscription_cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspace.id),
        supabase
          .from('users')
          .update({ cancel_at_period_end: true })
          .eq('workspace_id', workspace.id),
      ])

      return NextResponse.json({
        success: true,
        message: 'Subscription will be cancelled at end of billing period',
        cancel_at: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null,
      })
    } else {
      // Resume subscription
      subscription = await resumeSubscription(workspace.stripe_subscription_id)

      // Update workspace + sync cancel state to users table
      await Promise.all([
        supabase
          .from('workspaces')
          .update({
            subscription_cancel_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspace.id),
        supabase
          .from('users')
          .update({ cancel_at_period_end: false })
          .eq('workspace_id', workspace.id),
      ])

      return NextResponse.json({
        success: true,
        message: 'Subscription resumed successfully',
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
