// Google Sheets Service
// Integration for exporting leads to Google Sheets

import { createClient } from '@/lib/supabase/server'
import type { LeadTableRow } from '@/types/crm.types'
import type {
  SyncResult,
  GoogleSheetsSpreadsheet,
  GoogleSheetsAppendResponse,
  GoogleDriveFileList,
} from '@/types/integration.types'
import { GOOGLE_SHEETS_DEFAULT_HEADERS } from '@/types/integration.types'

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files'

export class GoogleSheetsService {
  private workspaceId: string
  private accessToken: string = ''
  private connectionId: string = ''

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Initialize service with credentials from the crm_connections table
   */
  static async initialize(workspaceId: string): Promise<GoogleSheetsService | null> {
    const service = new GoogleSheetsService(workspaceId)
    const initialized = await service.loadConnection()
    return initialized ? service : null
  }

  /**
   * Load connection details from the database
   */
  private async loadConnection(): Promise<boolean> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('crm_connections')
      .select('id, access_token, refresh_token, token_expires_at')
      .eq('workspace_id', this.workspaceId)
      .eq('provider', 'google_sheets')
      .maybeSingle()

    // Cast: crm_connections table may not be in generated DB types
    const connection = data as {
      id: string
      access_token: string
      refresh_token: string | null
      token_expires_at: string | null
    } | null

    if (!connection) {
      return false
    }

    this.connectionId = connection.id

    // Check if token is expired and refresh if needed
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      if (!connection.refresh_token) {
        return false
      }
      const refreshed = await this.refreshAccessToken(connection.refresh_token)
      if (!refreshed) return false
    } else {
      this.accessToken = connection.access_token
    }

    return true
  }

  /**
   * Refresh the OAuth access token using the refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<boolean> {
    try {
      const tokenToUse = refreshToken || await this.getRefreshTokenFromDb()
      if (!tokenToUse) {
        return false
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: tokenToUse,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return false
      }

      const tokens = await response.json()
      this.accessToken = tokens.access_token

      // Update token in database
      const supabase = await createClient()
      await (supabase.from('crm_connections') as any)
        .update({
          access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', this.workspaceId)
        .eq('provider', 'google_sheets')

      return true
    } catch {
      return false
    }
  }

  /**
   * Retrieve refresh token from the database
   */
  private async getRefreshTokenFromDb(): Promise<string | null> {
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('crm_connections')
      .select('refresh_token')
      .eq('workspace_id', this.workspaceId)
      .eq('provider', 'google_sheets')
      .maybeSingle()

    const conn = connection as { refresh_token: string | null } | null
    return conn?.refresh_token || null
  }

  /**
   * Make an authenticated request to the Google API
   */
  private async apiRequest<T = unknown>(
    url: string,
    method: string = 'GET',
    body?: object
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Google Sheets service not initialized. Call initialize() first.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle 401 by attempting token refresh and retry
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken()
      if (!refreshed) {
        throw new Error('Google authentication failed. Please reconnect your Google account.')
      }

      const retryController = new AbortController()
      const retryTimeoutId = setTimeout(() => retryController.abort(), 30000)

      const retryResponse = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: retryController.signal,
      })

      clearTimeout(retryTimeoutId)

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}))
        throw new Error(error.error?.message || `Google API error: ${retryResponse.status}`)
      }

      return retryResponse.json() as Promise<T>
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `Google API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Convert a LeadTableRow to a row of cell values matching the default header order
   */
  private leadToRow(lead: LeadTableRow): string[] {
    const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || ''
    return [
      fullName,
      lead.email || '',
      lead.phone || '',
      lead.company_name || '',
      lead.title || '',
      lead.city || '',
      lead.state || '',
      lead.linkedin_url || '',
      lead.intent_score_calculated !== undefined && lead.intent_score_calculated !== null
        ? String(lead.intent_score_calculated)
        : '',
      lead.status || '',
      lead.created_at
        ? new Date(lead.created_at).toLocaleDateString('en-US')
        : '',
    ]
  }

  /**
   * Create a new spreadsheet with default headers
   */
  async createSpreadsheet(title: string): Promise<{ spreadsheetId: string; url: string }> {
    const spreadsheet = await this.apiRequest<GoogleSheetsSpreadsheet>(
      SHEETS_API_BASE,
      'POST',
      {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Leads',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }
    )

    // Add headers to the first row
    await this.apiRequest(
      `${SHEETS_API_BASE}/${spreadsheet.spreadsheetId}/values/Leads!A1:K1?valueInputOption=RAW`,
      'PUT',
      {
        range: 'Leads!A1:K1',
        majorDimension: 'ROWS',
        values: [GOOGLE_SHEETS_DEFAULT_HEADERS],
      }
    )

    // Apply bold formatting to header row
    await this.apiRequest(
      `${SHEETS_API_BASE}/${spreadsheet.spreadsheetId}:batchUpdate`,
      'POST',
      {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          },
        ],
      }
    )

    return {
      spreadsheetId: spreadsheet.spreadsheetId,
      url: spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}`,
    }
  }

  /**
   * Append leads as rows to an existing spreadsheet
   */
  async appendLeads(
    spreadsheetId: string,
    leads: LeadTableRow[]
  ): Promise<{ rowsAdded: number }> {
    if (leads.length === 0) {
      return { rowsAdded: 0 }
    }

    const rows = leads.map((lead) => this.leadToRow(lead))

    const result = await this.apiRequest<GoogleSheetsAppendResponse>(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/Leads!A:K:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      'POST',
      {
        majorDimension: 'ROWS',
        values: rows,
      }
    )

    return {
      rowsAdded: result.updates?.updatedRows || leads.length,
    }
  }

  /**
   * List spreadsheets accessible to the connected Google account
   * Filters to only Google Sheets files
   */
  async listSpreadsheets(): Promise<{ id: string; name: string }[]> {
    const result = await this.apiRequest<GoogleDriveFileList>(
      `${DRIVE_API_BASE}?q=${encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet'")}&orderBy=modifiedTime%20desc&pageSize=50&fields=files(id,name)`
    )

    return (result.files || []).map((file) => ({
      id: file.id,
      name: file.name,
    }))
  }

  /**
   * Sync leads to a Google Spreadsheet
   * Creates a new spreadsheet if no spreadsheetId is provided
   * Logs the sync operation to crm_sync_log
   */
  async syncLeads(
    leads: LeadTableRow[],
    workspaceId: string,
    spreadsheetId?: string
  ): Promise<SyncResult> {
    const supabase = await createClient()

    try {
      let targetSpreadsheetId = spreadsheetId
      let action: 'created' | 'updated' = 'updated'

      // Create a new spreadsheet if none provided
      if (!targetSpreadsheetId) {
        const timestamp = new Date().toISOString().split('T')[0]
        const { spreadsheetId: newId } = await this.createSpreadsheet(
          `Cursive Lead Export - ${timestamp}`
        )
        targetSpreadsheetId = newId
        action = 'created'
      }

      // Append leads to the spreadsheet
      const { rowsAdded } = await this.appendLeads(targetSpreadsheetId, leads)

      // Log successful sync for each lead
      const syncLogEntries = leads.map((lead) => ({
        connection_id: this.connectionId || workspaceId,
        lead_id: lead.id,
        sync_type: action === 'created' ? 'create' : 'update',
        sync_direction: 'to_crm' as const,
        crm_record_id: targetSpreadsheetId,
        crm_record_type: 'spreadsheet_row',
        success: true,
        changes: {
          spreadsheet_id: targetSpreadsheetId,
          rows_added: rowsAdded,
        },
      }))

      // Insert sync logs in batch
      if (syncLogEntries.length > 0) {
        await supabase.from('crm_sync_log').insert(syncLogEntries as any)
      }

      return {
        success: true,
        externalId: targetSpreadsheetId,
        provider: 'google_sheets',
        action,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Log failed sync
      const failedLogEntries = leads.map((lead) => ({
        connection_id: this.connectionId || workspaceId,
        lead_id: lead.id,
        sync_type: 'create',
        sync_direction: 'to_crm' as const,
        crm_record_type: 'spreadsheet_row',
        success: false,
        error_message: errorMessage,
      }))

      if (failedLogEntries.length > 0) {
        await supabase.from('crm_sync_log').insert(failedLogEntries as any)
      }

      return {
        success: false,
        provider: 'google_sheets',
        action: 'failed',
        error: errorMessage,
      }
    }
  }
}

/**
 * Factory function to create and initialize a GoogleSheetsService
 * Returns null if Google Sheets is not configured for the workspace
 */
export async function createGoogleSheetsService(workspaceId: string): Promise<GoogleSheetsService | null> {
  return GoogleSheetsService.initialize(workspaceId)
}
