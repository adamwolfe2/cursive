/**
 * GoHighLevel Disconnect Route
 * Cursive Platform
 *
 * Disconnects the GHL OAuth integration by clearing credentials in the
 * crm_connections table. Mirrors the HubSpot disconnect contract so the
 * UI can call POST /api/integrations/ghl/disconnect.
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
      .eq('provider', 'gohighlevel')
      .maybeSingle()

    if (!existingConnection) {
      return NextResponse.json(
        { error: 'No GoHighLevel connection found' },
        { status: 404 }
      )
    }

    // Mark as disconnected and wipe tokens (defense-in-depth: also filter by workspace)
    const { error: updateError } = await supabase
      .from('crm_connections')
      .update({
        status: 'disconnected',
        access_token: '',
        refresh_token: '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingConnection.id)
      .eq('workspace_id', user.workspace_id)

    if (updateError) {
      safeError('[GHL OAuth] Failed to disconnect:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect GoHighLevel' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: {
        provider: 'gohighlevel',
      },
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'GoHighLevel disconnected successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
