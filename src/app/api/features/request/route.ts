/**
 * Premium Feature Request API
 * Users submit requests for premium features (pixels, more leads, campaigns, etc.)
 * Sends Slack notifications to admins for approval
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
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
    const userData = await getCurrentUser()
    if (!userData) return unauthorized()

    const supabase = await createClient()

    // Get workspace data
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, slug')
      .eq('id', userData.workspace_id)
      .maybeSingle()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const parseResult = requestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }
    const validated = parseResult.data

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
    return handleApiError(error)
  }
}

/**
 * GET /api/features/request
 * List user's feature requests
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Get feature requests for this workspace
    const { data: requests, error: fetchError } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({
      requests: requests || [],
      total: requests?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
