import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { unauthorized, handleApiError } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'

const LOGOS: Record<string, string> = {
  hubspot: '/free-hubspot-logo-icon-svg-download-png-2944939.webp',
  salesforce: '/Salesforce.com_logo.svg.png',
}

const NAMES: Record<string, string> = {
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
}

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    if (!user.workspaceId) {
      return NextResponse.json({ data: [] })
    }

    // Fetch CRM connections for hubspot and salesforce
    const supabase = await createClient()
    const { data: connections } = await supabase
      .from('crm_connections')
      .select('provider, status, last_sync_at, created_at, token_expires_at')
      .eq('workspace_id', user.workspaceId)
      .in('provider', ['hubspot', 'salesforce'])

    const now = Date.now()

    const result = ['hubspot', 'salesforce'].map((provider) => {
      const conn = connections?.find((c) => c.provider === provider)

      if (!conn) {
        return {
          integration: provider,
          display_name: NAMES[provider],
          logo_src: LOGOS[provider],
          is_connected: false,
          last_synced_at: null,
          records_synced_today: 0,
          error_count_24h: 0,
          last_error: null,
          sync_status: 'disconnected' as const,
        }
      }

      const isTokenExpired =
        conn.token_expires_at && new Date(conn.token_expires_at) < new Date()
      const isActive =
        conn.status === 'active' || conn.status === 'connected'
      const isConnected = isActive && !isTokenExpired

      const lastSync = conn.last_sync_at
        ? new Date(conn.last_sync_at).getTime()
        : null
      const hoursSinceSync =
        lastSync ? (now - lastSync) / 3_600_000 : Infinity

      let sync_status: 'healthy' | 'degraded' | 'failing' | 'idle' | 'disconnected'
      if (!isConnected) {
        sync_status = isTokenExpired ? 'failing' : 'disconnected'
      } else if (hoursSinceSync < 2) {
        sync_status = 'healthy'
      } else if (hoursSinceSync < 24) {
        sync_status = 'degraded'
      } else {
        sync_status = 'idle'
      }

      return {
        integration: provider,
        display_name: NAMES[provider],
        logo_src: LOGOS[provider],
        is_connected: isConnected,
        last_synced_at: conn.last_sync_at ?? null,
        records_synced_today: 0,
        error_count_24h: isTokenExpired ? 1 : 0,
        last_error: isTokenExpired
          ? 'Access token expired — please reconnect.'
          : null,
        sync_status,
      }
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
