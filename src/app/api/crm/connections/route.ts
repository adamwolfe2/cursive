/**
 * CRM Connections API
 * GET /api/crm/connections - List active CRM connections for the workspace
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

interface ConnectionResponse {
  provider: string
  connected: boolean
  status: string
  lastSyncAt: string | null
  connectedAt: string | null
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Query connections with workspace isolation
    const supabase = await createClient()

    const { data: connections, error } = await supabase
      .from('crm_connections')
      .select('id, provider, status, last_sync_at, created_at, token_expires_at')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[CRM Connections] Failed to fetch connections:', error.message)
      throw new Error('Failed to fetch CRM connections')
    }

    // 3. Map to response format
    const supportedProviders = ['hubspot', 'salesforce', 'google_sheets']

    const connectionMap = new Map<string, ConnectionResponse>()

    // Initialize all supported providers as disconnected
    for (const provider of supportedProviders) {
      connectionMap.set(provider, {
        provider,
        connected: false,
        status: 'disconnected',
        lastSyncAt: null,
        connectedAt: null,
      })
    }

    // Override with actual connection data
    if (connections) {
      for (const conn of connections as Array<{
        id: string
        provider: string
        status: string
        last_sync_at: string | null
        created_at: string | null
        token_expires_at: string | null
      }>) {
        const isTokenExpired =
          conn.token_expires_at && new Date(conn.token_expires_at) < new Date()
        const isActive = conn.status === 'active' || conn.status === 'connected'

        connectionMap.set(conn.provider, {
          provider: conn.provider,
          connected: isActive && !isTokenExpired,
          status: isTokenExpired ? 'token_expired' : conn.status,
          lastSyncAt: conn.last_sync_at || null,
          connectedAt: conn.created_at || null,
        })
      }
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: {
        connections: Array.from(connectionMap.values()),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
