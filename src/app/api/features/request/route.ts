/**
 * Premium Feature Request API
 * Users submit requests for premium features (pixels, more leads, campaigns, etc.)
 * Sends Slack notifications to admins for approval
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'


const requestSchema = z.object({
  feature_type: z.enum([
    'pixel',
    'more_leads',
    'email_campaign',
    'custom_integration',
    'lead_routing',
    'white_label',
    'api_access',
    'priority_support',
    'custom_feature',
  ]),
  request_title: z.string().min(5).max(200),
  request_description: z.string().max(2000).optional(),
  request_data: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, workspace_id, full_name, email, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (userError || !userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    // Get workspace data
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, slug')
      .eq('id', userData.workspace_id)
      .maybeSingle()

    const body = await request.json()
    const validated = requestSchema.parse(body)

    const adminSupabase = createAdminClient()

    // Create feature request
    const { data: featureRequest, error: insertError } = await adminSupabase
      .from('feature_requests')
      .insert({
        workspace_id: userData.workspace_id,
        user_id: userData.id,
        feature_type: validated.feature_type,
        request_title: validated.request_title,
        request_description: validated.request_description,
        request_data: validated.request_data || {},
        priority: validated.priority,
        status: 'pending',
      })
      .select()
      .maybeSingle()

    if (insertError) {
      throw insertError
    }

    // Send Slack notification to admins
    const featureTypeLabels: Record<string, string> = {
      pixel: '🎯 Pixel Installation',
      more_leads: '📈 More Leads Request',
      email_campaign: '📧 Email Campaign',
      custom_integration: '🔌 Custom Integration',
      lead_routing: '🔀 Lead Routing Setup',
      white_label: '🏷️ White Label Branding',
      api_access: '🔑 API Access',
      priority_support: '⚡ Priority Support',
      custom_feature: '✨ Custom Feature',
    }

    const featureLabel = featureTypeLabels[validated.feature_type] || validated.feature_type

    // Build Slack message
    const slackMessage = `
🎁 *NEW PREMIUM FEATURE REQUEST*

*Feature:* ${featureLabel}
*Title:* ${validated.request_title}
*Priority:* ${validated.priority.toUpperCase()}

*User Details:*
• Name: ${userData.full_name || 'N/A'}
• Email: ${userData.email}
• Role: ${userData.role}

*Workspace:*
• Name: ${workspace?.name || 'Unknown'}
• Slug: ${workspace?.slug || 'N/A'}
• ID: \`${userData.workspace_id}\`

*Description:*
${validated.request_description || 'No additional details provided'}

*Request Data:*
\`\`\`json
${JSON.stringify(validated.request_data || {}, null, 2)}
\`\`\`

*Request ID:* \`${featureRequest.id}\`
*Created:* ${new Date().toLocaleString()}

---
📋 View in admin panel to approve/reject this request
    `.trim()

    try {
      await sendSlackAlert({
        type: 'webhook_failure', // Using existing type for critical alerts
        severity: validated.priority === 'urgent' ? 'error' : 'warning',
        message: slackMessage,
        metadata: {
          request_id: featureRequest.id,
          feature_type: validated.feature_type,
          workspace_id: userData.workspace_id,
          user_id: userData.id,
          priority: validated.priority,
        },
      })
    } catch (slackError) {
      safeError('[Feature Request] Slack notification failed:', slackError)
      // Don't fail the request if Slack fails
    }

    return NextResponse.json({
      success: true,
      request_id: featureRequest.id,
      message: 'Your request has been submitted! Our team will review it shortly.',
      status: 'pending',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Feature Request] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/features/request
 * List user's feature requests
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    // Get feature requests for this workspace
    const { data: requests, error: fetchError } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('workspace_id', userData.workspace_id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({
      requests: requests || [],
      total: requests?.length || 0,
    })
  } catch (error) {
    safeError('[Feature Request] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
