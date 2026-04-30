import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import {
  handleApiError,
  unauthorized,
  success,
} from '@/lib/utils/api-error-handler'

export async function DELETE(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const now = new Date().toISOString()

    const [connectionResult, _installResult] = await Promise.all([
      supabase
        .from('crm_connections')
        .update({
          status: 'inactive',
          access_token: '',
          refresh_token: null,
          updated_at: now,
        })
        .eq('workspace_id', user.workspace_id)
        .eq('provider', 'gohighlevel')
        .select('id')
        .maybeSingle(),
      supabase
        .from('ghl_app_installs')
        .update({
          status: 'inactive',
          uninstalled_at: now,
          access_token: null,
          refresh_token: null,
          updated_at: now,
        })
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'active'),
    ])

    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: {
        provider: 'gohighlevel',
        connection_id: connectionResult.data?.id ?? null,
      },
      severity: 'info',
    })

    return success({ disconnected: true })
  } catch (error) {
    return handleApiError(error)
  }
}
