/**
 * Billing Cancel API Route
 * Cursive Platform
 *
 * Cancels the user's subscription at end of billing period.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cancelSubscription, resumeSubscription } from '@/lib/stripe/client'
import { z } from 'zod'

// Request validation schema
const cancelSchema = z.object({
  action: z.enum(['cancel', 'resume']).default('cancel'),
  reason: z.string().optional(),
})

/**
 * Get authenticated user from session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { user: null, supabase }
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, workspace_id, email')
    .eq('auth_user_id', session.user.id)
    .single()

  return { user, supabase }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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
      .single()

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

      // Update workspace
      await supabase
        .from('workspaces')
        .update({
          subscription_cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspace.id)

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

      // Update workspace
      await supabase
        .from('workspaces')
        .update({
          subscription_cancel_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspace.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription resumed successfully',
      })
    }
  } catch (error: any) {
    console.error('[Billing Cancel] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
