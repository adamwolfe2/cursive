/**
 * Zapier Webhook Revoke Route
 * POST /api/integrations/zapier/revoke
 *
 * Revokes/deletes the user's Zapier webhook URL,
 * clearing it from the users table and deactivating
 * the integration record.
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const supabase = createAdminClient()

    // 2. Clear zapier_webhook_url on the users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ zapier_webhook_url: null })
      .eq('id', user.id)

    if (userUpdateError) {
      safeError('[Zapier] Failed to clear user webhook URL:', userUpdateError)
      throw new Error('Failed to revoke webhook URL')
    }

    // 3. Update integrations table: set status to inactive
    const { error: integrationError } = await supabase
      .from('integrations')
      .update({
        status: 'inactive',
        config: {},
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', user.workspace_id)
      .eq('type', 'zapier')

    if (integrationError) {
      safeError('[Zapier] Failed to update integration status:', integrationError)
    }

    // 4. Log to audit_logs
    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: {
        provider: 'zapier',
      },
      severity: 'info',
    })

    // 5. Return success
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
