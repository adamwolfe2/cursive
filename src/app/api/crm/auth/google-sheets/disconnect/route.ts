/**
 * Google Sheets OAuth Disconnect Route
 * Cursive Platform
 *
 * Disconnects the Google Sheets integration by clearing credentials
 * from the crm_connections table.
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const supabase = createAdminClient()

    // Update connection: set status to disconnected and clear tokens
    const { error: updateError } = await supabase
      .from('crm_connections')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
      })
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'google_sheets')

    if (updateError) {
      safeError('[Google Sheets OAuth] Failed to disconnect:', updateError)
      throw new Error('Failed to disconnect Google Sheets')
    }

    // Log the disconnection event
    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: {
        provider: 'google_sheets',
      },
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'Google Sheets disconnected successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
