
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

const onboardingSchema = z.object({
  subscription_id: z.string().uuid(),
  onboarding_data: z.object({
    // Business basics (required for pixel + campaign setup)
    website_url: z.string().url('Please enter a valid website URL'),
    company_name: z.string().min(1),
    industries: z.array(z.string()),
    company_size: z.string(),
    revenue_range: z.string(),
    // Targeting (needed for campaign configuration)
    target_titles: z.string(),
    target_seniority: z.array(z.string()),
    geographic_focus: z.array(z.string()),
    // Outreach context
    value_proposition: z.string().optional(),
    pain_points: z.string().optional(),
    use_case: z.string(),
    ideal_lead_profile: z.string(),
    exclusions: z.string().optional(),
    // Technical
    tech_stack: z.string().optional(),
    current_crm: z.string().optional(),
    monthly_lead_goal: z.number().optional(),
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id, full_name')
      .eq('auth_user_id', user.id)
      .maybeSingle()

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
      .maybeSingle()

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
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.subscription_id)

    if (updateError) {
      throw new Error(`Failed to save onboarding: ${updateError.message}`)
    }

    // Trigger post-onboarding automation (admin alert + next steps)
    try {
      const { inngest } = await import('@/inngest/client')
      await inngest.send({
        name: 'dfy/onboarding-completed',
        data: {
          workspace_id: userData.workspace_id,
          subscription_id: validated.subscription_id,
          user_email: user.email || '',
          user_name: userData.full_name || user.email?.split('@')[0] || '',
          company_name: validated.onboarding_data.company_name,
          website_url: validated.onboarding_data.website_url,
          industries: validated.onboarding_data.industries,
          onboarding_data: validated.onboarding_data,
        },
      })
    } catch (inngestError) {
      safeError('[Service Onboarding] Failed to trigger post-onboarding:', inngestError)
      // Don't block - onboarding data is saved
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

    safeError('[Service Onboarding] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding' },
      { status: 500 }
    )
  }
}
