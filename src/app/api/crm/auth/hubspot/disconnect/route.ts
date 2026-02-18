/**
 * HubSpot Disconnect Route
 * Cursive Platform
 *
 * Disconnects the HubSpot CRM integration by clearing credentials
 * from the crm_connections table.
 */


import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST() {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const supabase = createAdminClient()

    // Check if connection exists
    const { data: existingConnection } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'hubspot')
      .single()

    if (!existingConnection) {
      return NextResponse.json(
        { error: 'No HubSpot connection found' },
        { status: 404 }
      )
    }

    // Update connection to disconnected, clear tokens
    const { error: updateError } = await supabase
      .from('crm_connections')
      .update({
        status: 'disconnected',
        access_token: '',
        refresh_token: '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingConnection.id)

    if (updateError) {
      safeError('[HubSpot OAuth] Failed to disconnect:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect HubSpot' },
        { status: 500 }
      )
    }

    // Log the disconnection event
    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: {
        provider: 'hubspot',
      },
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'HubSpot disconnected successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
