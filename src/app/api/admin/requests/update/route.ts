import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSlackAlert } from '@/lib/notifications/slack'
import { z } from 'zod'

const updateSchema = z.object({
  request_id: z.string().uuid(),
  status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
  admin_notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!userRecord || (userRecord.role !== 'admin' && userRecord.role !== 'owner')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Get the feature request details for Slack notification
    const { data: featureRequest } = await supabase
      .from('feature_requests')
      .select(`
        *,
        workspace:workspaces!workspace_id(name),
        user:users!user_id(email, full_name)
      `)
      .eq('id', validated.request_id)
      .single()

    if (!featureRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Update the feature request
    const { error: updateError } = await supabase
      .from('feature_requests')
      .update({
        status: validated.status,
        admin_notes: validated.admin_notes,
        reviewed_by: userRecord.id,
      })
      .eq('id', validated.request_id)

    if (updateError) {
      console.error('Failed to update feature request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      )
    }

    // Send Slack notification about the status change
    const statusEmoji = {
      pending: '⏳',
      in_review: '👀',
      approved: '✅',
      rejected: '❌',
      completed: '🎉',
    }

    const slackMessage = `
*Feature Request Status Update*

*Status:* ${statusEmoji[validated.status]} ${validated.status.replace(/_/g, ' ').toUpperCase()}

*Request:* ${featureRequest.request_title}
*Type:* ${featureRequest.feature_type.replace(/_/g, ' ')}
*Workspace:* ${featureRequest.workspace?.name}
*User:* ${featureRequest.user?.full_name || featureRequest.user?.email}

*Reviewed by:* ${userRecord.email}
${validated.admin_notes ? `*Admin Notes:* ${validated.admin_notes}` : ''}
    `.trim()

    await sendSlackAlert(slackMessage, 'info')

    return NextResponse.json({
      success: true,
      message: 'Request updated successfully',
    })
  } catch (error) {
    console.error('Error updating feature request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
