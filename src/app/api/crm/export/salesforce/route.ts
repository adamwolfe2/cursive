/**
 * CRM Salesforce Export API
 * POST /api/crm/export/salesforce - Sync CRM leads to Salesforce
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const MAX_SYNC_LEADS = 500

const salesforceExportSchema = z.object({
  leadIds: z
    .array(z.string().uuid())
    .min(1, 'At least one lead ID is required')
    .max(MAX_SYNC_LEADS, `Cannot sync more than ${MAX_SYNC_LEADS} leads at once`),
})

/**
 * Attempt to dynamically import the Salesforce service.
 * Returns null if the service has not been created yet.
 */
async function getSalesforceService(workspaceId: string) {
  try {
    const { createSalesforceService } = await import(
      '@/lib/services/salesforce.service'
    )
    return await createSalesforceService(workspaceId)
  } catch {
    // Service module does not exist yet
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input
    const body = await request.json()
    const validated = salesforceExportSchema.parse(body)

    // 3. Check Salesforce connection exists
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('crm_connections')
      .select('id, access_token, refresh_token, token_expires_at, instance_url, status')
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'salesforce')
      .maybeSingle()

    // Cast: crm_connections table may not be in generated DB types
    const conn = connection as { id: string; access_token: string; refresh_token: string; token_expires_at: string | null; instance_url: string; status: string } | null

    if (!conn) {
      return badRequest(
        'Salesforce is not connected. Please connect your Salesforce account first.'
      )
    }

    if (conn.status === 'disconnected' || conn.status === 'error') {
      return badRequest(
        'Salesforce connection is inactive. Please reconnect your Salesforce account.'
      )
    }

    // 4. Initialize Salesforce service
    const salesforceService = await getSalesforceService(user.workspace_id)
    if (!salesforceService) {
      return NextResponse.json(
        {
          error:
            'Unable to initialize Salesforce service. Your access token may have expired — please disconnect and reconnect your Salesforce account.',
          code: 'SERVICE_INIT_FAILED',
        },
        { status: 503 }
      )
    }

    // 5. Fetch leads with workspace isolation
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', validated.leadIds)
      .eq('workspace_id', user.workspace_id)

    if (leadsError) {
      safeError('[Salesforce Export] Failed to fetch leads:', leadsError.message)
      throw new Error('Failed to fetch leads for sync')
    }

    if (!leads || leads.length === 0) {
      return badRequest('No leads found matching the provided IDs')
    }

    // Cast leads for the service
    const typedLeads = leads as Array<Record<string, any>>

    // 6. Sync leads to Salesforce
    const results: {
      synced: number
      failed: number
      errors: string[]
    } = {
      synced: 0,
      failed: 0,
      errors: [],
    }

    // Process in parallel batches of 5 (Salesforce rate limits apply)
    const BATCH_SIZE = 5
    for (let i = 0; i < typedLeads.length; i += BATCH_SIZE) {
      const batch = typedLeads.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map((lead) => salesforceService.syncLead(lead as any, user.workspace_id))
      )

      for (let j = 0; j < batchResults.length; j++) {
        const outcome = batchResults[j]
        const lead = batch[j]
        if (outcome.status === 'fulfilled' && outcome.value.success) {
          results.synced++
        } else {
          results.failed++
          const errorMsg = outcome.status === 'fulfilled'
            ? outcome.value.error || 'Unknown sync error'
            : 'Sync failed'
          results.errors.push(`Lead ${lead.email || lead.id}: ${errorMsg}`)
          if (outcome.status === 'rejected') {
            safeError('[Salesforce Export] Sync error for lead: ' + lead.id, outcome.reason)
          }
        }
      }
    }

    // 7. Return results
    return NextResponse.json({
      success: true,
      data: {
        synced: results.synced,
        failed: results.failed,
        errors: results.errors,
        total: typedLeads.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
