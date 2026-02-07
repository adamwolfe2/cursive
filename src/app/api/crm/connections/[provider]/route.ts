/**
 * CRM Connection Status by Provider API
 * GET /api/crm/connections/[provider] - Returns connection status for a specific provider
 *
 * Supported providers: salesforce, google_sheets, hubspot
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'

const SUPPORTED_PROVIDERS = ['salesforce', 'google_sheets', 'hubspot'] as const
type Provider = typeof SUPPORTED_PROVIDERS[number]

interface ConnectionStatusResponse {
  connected: boolean
  status: string
  instance_url?: string
  connected_at?: string
  last_sync_at?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate provider param
    const { provider } = await params
    if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
      return badRequest(`Unsupported provider: ${provider}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`)
    }

    // 3. Query crm_connections table with workspace isolation
    const supabase = await createClient()

    const { data: connection, error } = await supabase
      .from('crm_connections')
      .select('id, provider, status, instance_url, last_sync_at, created_at, token_expires_at')
      .eq('workspace_id', user.workspace_id)
      .eq('provider', provider)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error, just means not connected)
      console.error(`[CRM Connection] Failed to fetch ${provider} connection:`, error.message)
      throw new Error(`Failed to fetch ${provider} connection status`)
    }

    // 4. Build response
    if (!connection) {
      // No connection found - return disconnected status
      const response: ConnectionStatusResponse = {
        connected: false,
        status: 'disconnected',
      }

      return NextResponse.json({
        success: true,
        data: response,
      })
    }

    // Check if token is expired
    const isTokenExpired =
      connection.token_expires_at && new Date(connection.token_expires_at) < new Date()
    const isActive = connection.status === 'active' || connection.status === 'connected'

    const response: ConnectionStatusResponse = {
      connected: isActive && !isTokenExpired,
      status: isTokenExpired ? 'token_expired' : connection.status,
      instance_url: connection.instance_url || undefined,
      connected_at: connection.created_at || undefined,
      last_sync_at: connection.last_sync_at || undefined,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
