/**
 * Slack Disconnect Route
 * Cursive Platform
 *
 * Disconnects the Slack integration by clearing the webhook URL
 * from the user record and updating the integration status.
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = createAdminClient()

    // Clear slack_webhook_url on the users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ slack_webhook_url: null })
      .eq('id', user.id)

    if (userUpdateError) {
      safeError('[Slack OAuth] Failed to clear user webhook URL:', userUpdateError)
      return NextResponse.json(
        { error: 'Failed to disconnect Slack' },
        { status: 500 }
      )
    }

    // Update integrations table status to 'inactive'
    const { error: integrationUpdateError } = await supabase
      .from('integrations')
      .update({
        status: 'inactive' as const,
        config: {},
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', user.workspace_id)
      .eq('type', 'slack')
      .eq('status', 'active')

    if (integrationUpdateError) {
      safeError('[Slack OAuth] Failed to update integration status:', integrationUpdateError)
      // Non-fatal: user webhook URL was already cleared
    }

    // Log the disconnection event
    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: {
        provider: 'slack',
      },
      severity: 'info',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
