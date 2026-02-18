/**
 * CRM Google Sheets Export API
 * POST /api/crm/export/google-sheets - Export CRM leads to Google Sheets
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const MAX_EXPORT_ROWS = 10_000

const googleSheetsExportSchema = z.object({
  leadIds: z
    .array(z.string().uuid())
    .min(1, 'At least one lead ID is required')
    .max(MAX_EXPORT_ROWS, `Cannot export more than ${MAX_EXPORT_ROWS} leads at once`),
  spreadsheetId: z.string().optional(),
})

const SHEET_COLUMNS = [
  'Email',
  'First Name',
  'Last Name',
  'Phone',
  'Company Name',
  'Company Industry',
  'Title',
  'City',
  'State',
  'Company Size',
  'Source',
  'Status',
  'Tags',
  'Intent Score',
  'LinkedIn URL',
  'Created At',
  'Last Contacted At',
  'Notes',
] as const

const LEAD_FIELD_MAP: Record<string, string> = {
  Email: 'email',
  'First Name': 'first_name',
  'Last Name': 'last_name',
  Phone: 'phone',
  'Company Name': 'company_name',
  'Company Industry': 'company_industry',
  Title: 'title',
  City: 'city',
  State: 'state',
  'Company Size': 'company_size',
  Source: 'source',
  Status: 'status',
  Tags: 'tags',
  'Intent Score': 'intent_score_calculated',
  'LinkedIn URL': 'linkedin_url',
  'Created At': 'created_at',
  'Last Contacted At': 'last_contacted_at',
  Notes: 'notes',
}

/**
 * Attempt to dynamically import the Google Sheets service.
 * Returns null if the service has not been created yet.
 */
async function getGoogleSheetsService(workspaceId: string) {
  try {
    const { createGoogleSheetsService } = await import(
      '@/lib/services/google-sheets.service'
    )
    return await createGoogleSheetsService(workspaceId)
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
    const validated = googleSheetsExportSchema.parse(body)

    // 3. Check Google Sheets connection exists
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('crm_connections')
      .select('id, access_token, refresh_token, token_expires_at, status')
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'google_sheets')
      .single()

    // Cast: crm_connections table may not be in generated DB types
    const conn = connection as { id: string; access_token: string; refresh_token: string; token_expires_at: string | null; status: string } | null

    if (!conn) {
      return badRequest(
        'Google Sheets is not connected. Please connect your Google account first.'
      )
    }

    if (conn.status === 'disconnected' || conn.status === 'error') {
      return badRequest(
        'Google Sheets connection is inactive. Please reconnect your Google account.'
      )
    }

    // 4. Initialize Google Sheets service
    const sheetsService = await getGoogleSheetsService(user.workspace_id)
    if (!sheetsService) {
      return NextResponse.json(
        {
          error:
            'Google Sheets integration is not yet available. The service is being developed and will be available soon.',
          code: 'SERVICE_NOT_AVAILABLE',
        },
        { status: 501 }
      )
    }

    // 5. Fetch leads with workspace isolation
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', validated.leadIds)
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (leadsError) {
      safeError('[Google Sheets Export] Failed to fetch leads:', leadsError.message)
      throw new Error('Failed to fetch leads for export')
    }

    if (!leads || leads.length === 0) {
      return badRequest('No leads found matching the provided IDs')
    }

    // Cast leads for the service
    const typedLeads = leads as Array<Record<string, any>>

    // 6. Export to Google Sheets using the service
    let spreadsheetId = validated.spreadsheetId || ''
    let spreadsheetUrl = ''
    let rowsAdded = 0

    if (validated.spreadsheetId) {
      // Append to existing spreadsheet
      const appendResult = await sheetsService.appendLeads(validated.spreadsheetId, typedLeads as any)
      spreadsheetId = validated.spreadsheetId
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${validated.spreadsheetId}`
      rowsAdded = appendResult.rowsAdded
    } else {
      // Create new spreadsheet and append leads
      const timestamp = new Date().toISOString().split('T')[0]
      const createResult = await sheetsService.createSpreadsheet(`CRM Leads Export - ${timestamp}`)
      spreadsheetId = createResult.spreadsheetId
      spreadsheetUrl = createResult.url

      // Append leads to the new spreadsheet
      const appendResult = await sheetsService.appendLeads(spreadsheetId, typedLeads as any)
      rowsAdded = appendResult.rowsAdded
    }

    // 7. Log the export
    await supabase.from('crm_sync_log').insert({
      connection_id: conn.id,
      lead_id: null,
      sync_type: 'batch_export',
      sync_direction: 'to_crm',
      crm_record_type: 'spreadsheet',
      crm_record_id: spreadsheetId,
      success: true,
      changes: {
        spreadsheetId,
        rowsAdded,
        isNew: !validated.spreadsheetId,
      },
    } as any)

    // 8. Return results
    return NextResponse.json({
      success: true,
      data: {
        spreadsheetUrl,
        spreadsheetId,
        rowsAdded,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
