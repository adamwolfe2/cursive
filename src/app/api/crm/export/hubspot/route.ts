/**
 * CRM HubSpot Export API
 * POST /api/crm/export/hubspot - Sync CRM leads to HubSpot
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { createHubSpotService } from '@/lib/services/hubspot.service'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const MAX_SYNC_LEADS = 500

const hubspotExportSchema = z.object({
  leadIds: z
    .array(z.string().uuid())
    .min(1, 'At least one lead ID is required')
    .max(MAX_SYNC_LEADS, `Cannot sync more than ${MAX_SYNC_LEADS} leads at once`),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input
    const body = await request.json()
    const validated = hubspotExportSchema.parse(body)

    // 3. Check HubSpot connection exists and is valid
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('crm_connections')
      .select('id, access_token, refresh_token, token_expires_at, status')
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'hubspot')
      .single()

    // Cast: crm_connections table may not be in generated DB types
    const conn = connection as { id: string; access_token: string; refresh_token: string; token_expires_at: string | null; status: string } | null

    if (!conn) {
      return badRequest('HubSpot is not connected. Please connect your HubSpot account first.')
    }

    if (conn.status === 'disconnected' || conn.status === 'error') {
      return badRequest('HubSpot connection is inactive. Please reconnect your HubSpot account.')
    }

    // 4. Initialize HubSpot service (handles token refresh internally)
    const hubspotService = await createHubSpotService(user.workspace_id)
    if (!hubspotService) {
      return badRequest(
        'Failed to initialize HubSpot connection. Your access token may have expired. Please reconnect.'
      )
    }

    // 5. Fetch leads with workspace isolation
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', validated.leadIds)
      .eq('workspace_id', user.workspace_id)

    if (leadsError) {
      safeError('[HubSpot Export] Failed to fetch leads:', leadsError.message)
      throw new Error('Failed to fetch leads for sync')
    }

    if (!leads || leads.length === 0) {
      return badRequest('No leads found matching the provided IDs')
    }

    // Cast: leads table may resolve to never without generated types
    const typedLeads = leads as Array<Record<string, any>>

    // 6. Sync leads to HubSpot one by one
    const results: {
      synced: number
      failed: number
      errors: string[]
      details: Array<{
        leadId: string
        success: boolean
        contactId?: string
        error?: string
      }>
    } = {
      synced: 0,
      failed: 0,
      errors: [],
      details: [],
    }

    for (const lead of typedLeads) {
      const result = await hubspotService.syncLead(lead)

      if (result.success) {
        results.synced++
        results.details.push({
          leadId: lead.id,
          success: true,
          contactId: result.contactId,
        })
      } else {
        results.failed++
        const errorMsg = result.error || 'Unknown sync error'
        results.errors.push(`Lead ${lead.email || lead.id}: ${errorMsg}`)
        results.details.push({
          leadId: lead.id,
          success: false,
          error: errorMsg,
        })
      }
    }

    // 7. Log the batch sync result
    await supabase.from('crm_sync_log').insert({
      connection_id: conn.id,
      lead_id: null,
      sync_type: 'batch_export',
      sync_direction: 'to_crm',
      crm_record_type: 'contact',
      success: results.failed === 0,
      changes: {
        total: typedLeads.length,
        synced: results.synced,
        failed: results.failed,
      },
      error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
    } as any)

    // 8. Return results
    return NextResponse.json({
      success: true,
      data: {
        synced: results.synced,
        failed: results.failed,
        errors: results.errors,
        total: leads.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
