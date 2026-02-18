/**
 * Salesforce Disconnect Route
 * Cursive Platform
 *
 * Disconnects the Salesforce CRM integration by clearing credentials
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
      .eq('provider', 'salesforce')
      .single()

    if (!existingConnection) {
      return NextResponse.json(
        { error: 'No Salesforce connection found' },
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
      safeError('[Salesforce OAuth] Failed to disconnect:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect Salesforce' },
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
        provider: 'salesforce',
      },
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'Salesforce disconnected successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
