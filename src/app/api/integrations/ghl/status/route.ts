import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import {
  handleApiError,
  unauthorized,
  success,
} from '@/lib/utils/api-error-handler'

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    const [connectionResult, installResult] = await Promise.all([
      supabase
        .from('crm_connections')
        .select(
          'id, provider, status, last_sync_at, last_sync_status, metadata, token_expires_at, created_at'
        )
        .eq('workspace_id', user.workspace_id)
        .eq('provider', 'gohighlevel')
        .maybeSingle(),
      supabase
        .from('ghl_app_installs')
        .select(
          'id, location_id, company_id, status, installed_at, scopes, updated_at'
        )
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    if (!connectionResult.data) {
      return success({
        connected: false,
        provider: 'gohighlevel',
      })
    }

    const connection = connectionResult.data
    const install = installResult.data
    const metadata = (connection.metadata ?? {}) as Record<string, unknown>

    return success({
      connected: connection.status === 'active',
      provider: 'gohighlevel',
      connection_id: connection.id,
      status: connection.status,
      location_id: metadata.location_id ?? install?.location_id ?? null,
      company_id: metadata.company_id ?? install?.company_id ?? null,
      scopes: metadata.scopes ?? install?.scopes ?? [],
      last_sync_at: connection.last_sync_at,
      last_sync_status: connection.last_sync_status,
      token_expires_at: connection.token_expires_at,
      connected_at: metadata.connected_at ?? connection.created_at,
      installed_at: install?.installed_at ?? null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
