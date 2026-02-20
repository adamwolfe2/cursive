
/**
 * Premium Feature Request API
 * Allows users to request access to premium features
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

// Validation schema
const requestSchema = z.object({
  feature_type: z.enum(['pixel', 'whitelabel', 'extra_data', 'outbound', 'custom']),
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  use_case: z.string().max(2000).optional(),
  expected_volume: z.string().max(200).optional(),
  budget_range: z.string().max(100).optional(),
  contact_preference: z.enum(['email', 'call', 'slack']).default('email'),
})

type RequestInput = z.infer<typeof requestSchema>

/**
 * POST /api/premium/request
 * Create a new premium feature request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return unauthorized()
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, workspace_id, email, full_name')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (!userProfile) {
      return badRequest('User profile not found')
    }

    // Get workspace info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .eq('id', userProfile.workspace_id)
      .maybeSingle()

    if (!workspace) {
      return badRequest('Workspace not found')
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData: RequestInput

    try {
      validatedData = requestSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationError.errors,
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Create the feature request
    const { data: featureRequest, error: insertError } = await supabase
      .from('premium_feature_requests')
      .insert({
        workspace_id: userProfile.workspace_id,
        user_id: userProfile.id,
        feature_type: validatedData.feature_type,
        title: validatedData.title,
        description: validatedData.description,
        use_case: validatedData.use_case,
        expected_volume: validatedData.expected_volume,
        budget_range: validatedData.budget_range,
        contact_preference: validatedData.contact_preference,
        status: 'pending',
        priority: 'medium',
      })
      .select()
      .maybeSingle()

    if (insertError) {
      safeError('[Premium Request] Failed to create request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create feature request' },
        { status: 500 }
      )
    }

    // Send Slack notification
    const featureNames: Record<string, string> = {
      pixel: '🎯 AudienceLab Pixel',
      whitelabel: '🎨 White-Label Branding',
      extra_data: '📊 Premium Audience Data',
      outbound: '📧 Automated Outbound',
      custom: '⚡ Custom Feature',
    }

    const slackMessage = `*🎯 Premium Feature Request*

*User:* ${userProfile.full_name || userProfile.email}
*Email:* ${userProfile.email}
*Workspace:* ${workspace.name} (${workspace.slug})

*Feature:* ${featureNames[validatedData.feature_type] || validatedData.feature_type}
*Title:* ${validatedData.title}

${validatedData.use_case ? `*Use Case:*\n${validatedData.use_case}\n` : ''}
${validatedData.expected_volume ? `*Expected Volume:* ${validatedData.expected_volume}\n` : ''}
${validatedData.budget_range ? `*Budget:* ${validatedData.budget_range}\n` : ''}
*Contact Preference:* ${validatedData.contact_preference}

*Action:* Review at https://leads.meetcursive.com/admin/premium-requests/${featureRequest.id}`

    // Send Slack alert (don't block on failure)
    sendSlackAlert({
      type: 'premium_request',
      severity: 'info',
      message: slackMessage,
      metadata: {
        request_id: featureRequest.id,
        feature_type: validatedData.feature_type,
        workspace_id: workspace.id,
        user_id: userProfile.id,
      },
    }).catch((err) => {
      safeError('[Premium Request] Failed to send Slack notification:', err)
    })

    return NextResponse.json(
      {
        success: true,
        data: featureRequest,
        message: 'Your request has been submitted! We\'ll be in touch soon.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    return handleApiError(error)
  }
}

/**
 * GET /api/premium/request
 * Get all premium feature requests for the current workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return unauthorized()
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (!userProfile) {
      return badRequest('User profile not found')
    }

    // Get all requests for this workspace
    const { data: requests, error } = await supabase
      .from('premium_feature_requests')
      .select(`
        *,
        user:users!user_id(id, email, full_name),
        reviewer:users!reviewed_by(id, email, full_name)
      `)
      .eq('workspace_id', userProfile.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Premium Request] Failed to fetch requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feature requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requests,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
