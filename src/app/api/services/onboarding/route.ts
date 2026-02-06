import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const onboardingSchema = z.object({
  subscription_id: z.string().uuid(),
  onboarding_data: z.object({
    industries: z.array(z.string()),
    company_size: z.string(),
    revenue_range: z.string(),
    target_titles: z.string(),
    target_seniority: z.array(z.string()),
    geographic_focus: z.array(z.string()),
    tech_stack: z.string().optional(),
    pain_points: z.string().optional(),
    use_case: z.string(),
    ideal_lead_profile: z.string(),
    exclusions: z.string().optional(),
    additional_notes: z.string().optional(),
  })
})

/**
 * POST /api/services/onboarding
 * Save onboarding responses and mark as completed
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!userData || !userData.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = onboardingSchema.parse(body)

    // Verify subscription belongs to user's workspace
    const { data: subscription } = await supabase
      .from('service_subscriptions')
      .select('id, workspace_id')
      .eq('id', validated.subscription_id)
      .single()

    if (!subscription || subscription.workspace_id !== userData.workspace_id) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Save onboarding data and mark as completed
    const { error: updateError } = await supabase
      .from('service_subscriptions')
      .update({
        onboarding_data: validated.onboarding_data,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.subscription_id)

    if (updateError) {
      throw new Error(`Failed to save onboarding: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('[API] Error saving onboarding:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save onboarding' },
      { status: 500 }
    )
  }
}
