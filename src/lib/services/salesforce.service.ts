// Salesforce Service
// CRM integration for bi-directional lead sync with Salesforce REST API

import { createClient } from '@/lib/supabase/server'
import type { LeadTableRow } from '@/types/crm.types'
import type {
  SyncResult,
  BulkSyncResult,
  SalesforceLeadFields,
  SalesforceContactFields,
  SalesforceApiResponse,
  SalesforceQueryResponse,
} from '@/types/integration.types'
import {
  SALESFORCE_STATUS_MAP,
  DEFAULT_SALESFORCE_LEAD_MAPPINGS,
} from '@/types/integration.types'

const SALESFORCE_API_VERSION = 'v59.0'

export class SalesforceService {
  private workspaceId: string
  private instanceUrl: string = ''
  private accessToken: string = ''
  private connectionId: string = ''
  private fieldMappings: Record<string, string> = {}

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Initialize service with credentials from the crm_connections table
   */
  static async initialize(workspaceId: string): Promise<SalesforceService | null> {
    const service = new SalesforceService(workspaceId)
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
      .select('id, access_token, refresh_token, token_expires_at, instance_url, field_mappings')
      .eq('workspace_id', this.workspaceId)
      .eq('provider', 'salesforce')
      .maybeSingle()

    // Cast: crm_connections table may not be in generated DB types
    const connection = data as {
      id: string
      access_token: string
      refresh_token: string | null
      token_expires_at: string | null
      instance_url: string | null
      field_mappings: Record<string, string> | null
    } | null

    if (!connection) {
      return false
    }

    if (!connection.instance_url) {
      return false
    }

    this.connectionId = connection.id
    this.instanceUrl = connection.instance_url
    this.fieldMappings = connection.field_mappings || {}

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

      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.SALESFORCE_CLIENT_ID || '',
          client_secret: process.env.SALESFORCE_CLIENT_SECRET || '',
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

      // Salesforce may return a new instance URL on refresh
      if (tokens.instance_url) {
        this.instanceUrl = tokens.instance_url
      }

      // Update tokens in database
      const supabase = await createClient()
      await (supabase.from('crm_connections') as any)
        .update({
          access_token: tokens.access_token,
          instance_url: this.instanceUrl,
          token_expires_at: new Date(Date.now() + 7200 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', this.workspaceId)
        .eq('provider', 'salesforce')

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
      .eq('provider', 'salesforce')
      .maybeSingle()

    const conn = connection as { refresh_token: string | null } | null
    return conn?.refresh_token || null
  }

  /**
   * Make an authenticated request to the Salesforce REST API
   */
  private async apiRequest<T = unknown>(
    endpoint: string,
    method: string = 'GET',
    body?: object
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Salesforce service not initialized. Call initialize() first.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const url = `${this.instanceUrl}/services/data/${SALESFORCE_API_VERSION}${endpoint}`

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
        throw new Error('Salesforce authentication failed. Please reconnect your Salesforce account.')
      }

      // Retry the request with the new token
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
        throw new Error(
          Array.isArray(error) && error[0]?.message
            ? error[0].message
            : `Salesforce API error: ${retryResponse.status}`
        )
      }

      // Handle 204 No Content
      if (retryResponse.status === 204) {
        return {} as T
      }

      return retryResponse.json() as Promise<T>
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        Array.isArray(error) && error[0]?.message
          ? error[0].message
          : `Salesforce API error: ${response.status}`
      )
    }

    // Handle 204 No Content (e.g., successful PATCH with no body)
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }

  /**
   * Map a LeadTableRow to Salesforce Lead fields using configured or default mappings
   */
  private mapLeadToSalesforceFields(lead: LeadTableRow): SalesforceLeadFields {
    const mappings = Object.keys(this.fieldMappings).length > 0
      ? this.fieldMappings
      : DEFAULT_SALESFORCE_LEAD_MAPPINGS

    const fields: SalesforceLeadFields = {}

    for (const [cursiveField, salesforceField] of Object.entries(mappings)) {
      if (cursiveField === 'status') {
        const statusValue = lead.status || 'new'
        fields[salesforceField] = SALESFORCE_STATUS_MAP[statusValue] || 'Open - Not Contacted'
      } else if (cursiveField === 'intent_score_calculated') {
        if (lead.intent_score_calculated !== undefined && lead.intent_score_calculated !== null) {
          fields[salesforceField] = lead.intent_score_calculated
        }
      } else {
        const value = lead[cursiveField as keyof LeadTableRow]
        if (value !== undefined && value !== null) {
          fields[salesforceField] = String(value)
        }
      }
    }

    // Ensure Company is always set (required field for Salesforce Lead)
    if (!fields.Company) {
      fields.Company = lead.company_name || 'Unknown'
    }

    return fields
  }

  /**
   * Map a LeadTableRow to Salesforce Contact fields
   */
  private mapLeadToContactFields(lead: LeadTableRow): SalesforceContactFields {
    const fields: SalesforceContactFields = {}

    if (lead.first_name) fields.FirstName = lead.first_name
    if (lead.last_name) fields.LastName = lead.last_name
    if (lead.email) fields.Email = lead.email
    if (lead.phone) fields.Phone = lead.phone
    if (lead.title) fields.Title = lead.title
    if (lead.city) fields.MailingCity = lead.city
    if (lead.state) fields.MailingState = lead.state
    if (lead.linkedin_url) fields.LinkedIn_Profile__c = lead.linkedin_url

    // LastName is required for Salesforce Contact
    if (!fields.LastName) {
      fields.LastName = lead.email || 'Unknown'
    }

    return fields
  }

  /**
   * Create or update a Lead in Salesforce
   * Uses upsert by Email external ID when available
   */
  async upsertLead(lead: LeadTableRow): Promise<{ id: string; created: boolean }> {
    const fields = this.mapLeadToSalesforceFields(lead)

    // Try to find existing lead by email first
    if (lead.email) {
      try {
        const query = `SELECT Id FROM Lead WHERE Email = '${this.escapeSOQL(lead.email)}' LIMIT 1`
        const searchResult = await this.apiRequest<SalesforceQueryResponse>(
          `/query?q=${encodeURIComponent(query)}`
        )

        if (searchResult.records && searchResult.records.length > 0) {
          const existingId = searchResult.records[0].Id
          await this.apiRequest(
            `/sobjects/Lead/${existingId}`,
            'PATCH',
            fields
          )
          return { id: existingId, created: false }
        }
      } catch {
        // If search fails, proceed to create
      }
    }

    // Create new lead
    const result = await this.apiRequest<SalesforceApiResponse>(
      '/sobjects/Lead/',
      'POST',
      fields
    )

    return { id: result.id, created: true }
  }

  /**
   * Create or update a Contact in Salesforce
   */
  async upsertContact(lead: LeadTableRow): Promise<{ id: string; created: boolean }> {
    const fields = this.mapLeadToContactFields(lead)

    // Try to find existing contact by email
    if (lead.email) {
      try {
        const query = `SELECT Id FROM Contact WHERE Email = '${this.escapeSOQL(lead.email)}' LIMIT 1`
        const searchResult = await this.apiRequest<SalesforceQueryResponse>(
          `/query?q=${encodeURIComponent(query)}`
        )

        if (searchResult.records && searchResult.records.length > 0) {
          const existingId = searchResult.records[0].Id
          await this.apiRequest(
            `/sobjects/Contact/${existingId}`,
            'PATCH',
            fields
          )
          return { id: existingId, created: false }
        }
      } catch {
        // If search fails, proceed to create
      }
    }

    // Create new contact
    const result = await this.apiRequest<SalesforceApiResponse>(
      '/sobjects/Contact/',
      'POST',
      fields
    )

    return { id: result.id, created: true }
  }

  /**
   * Create an Account in Salesforce
   */
  async createAccount(companyName: string, domain?: string): Promise<string> {
    // Check for existing account by name first
    try {
      const query = `SELECT Id FROM Account WHERE Name = '${this.escapeSOQL(companyName)}' LIMIT 1`
      const searchResult = await this.apiRequest<SalesforceQueryResponse>(
        `/query?q=${encodeURIComponent(query)}`
      )

      if (searchResult.records && searchResult.records.length > 0) {
        return searchResult.records[0].Id
      }
    } catch {
      // If search fails, proceed to create
    }

    const fields: Record<string, string> = { Name: companyName }
    if (domain) {
      fields.Website = domain
    }

    const result = await this.apiRequest<SalesforceApiResponse>(
      '/sobjects/Account/',
      'POST',
      fields
    )

    return result.id
  }

  /**
   * Sync a single lead to Salesforce and log the operation
   */
  async syncLead(lead: LeadTableRow, workspaceId: string): Promise<SyncResult> {
    const supabase = await createClient()

    try {
      const { id: externalId, created } = await this.upsertLead(lead)

      // Log successful sync
      await supabase.from('crm_sync_log').insert({
        connection_id: this.connectionId || workspaceId,
        lead_id: lead.id,
        sync_type: created ? 'create' : 'update',
        sync_direction: 'to_crm',
        crm_record_id: externalId,
        crm_record_type: 'lead',
        success: true,
        changes: this.mapLeadToSalesforceFields(lead),
      } as any)

      return {
        success: true,
        externalId,
        provider: 'salesforce',
        action: created ? 'created' : 'updated',
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Log failed sync
      await supabase.from('crm_sync_log').insert({
        connection_id: this.connectionId || workspaceId,
        lead_id: lead.id,
        sync_type: 'create',
        sync_direction: 'to_crm',
        crm_record_type: 'lead',
        success: false,
        error_message: errorMessage,
      } as any)

      return {
        success: false,
        provider: 'salesforce',
        action: 'failed',
        error: errorMessage,
      }
    }
  }

  /**
   * Sync multiple leads to Salesforce in sequence
   * Logs each operation individually for traceability
   */
  async bulkSyncLeads(leads: LeadTableRow[], workspaceId: string): Promise<BulkSyncResult> {
    const results: SyncResult[] = []
    let synced = 0
    let failed = 0

    for (const lead of leads) {
      const result = await this.syncLead(lead, workspaceId)
      results.push(result)

      if (result.success) {
        synced++
      } else {
        failed++
      }
    }

    return {
      total: leads.length,
      synced,
      failed,
      results,
    }
  }

  /**
   * Escape special characters in SOQL queries to prevent injection
   */
  private escapeSOQL(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  }

  /**
   * Low-level Tooling API request (different URL path than standard REST).
   * Used for metadata operations like creating custom fields.
   */
  private async toolingApiRequest<T = unknown>(
    endpoint: string,
    method: string = 'GET',
    body?: object
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Salesforce service not initialized.')
    }
    const url = `${this.instanceUrl}/services/data/${SALESFORCE_API_VERSION}/tooling${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Tooling API ${response.status}: ${text.slice(0, 500)}`)
      }
      return (await response.json()) as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Provision Cursive custom fields on the Salesforce Contact and Lead objects.
   *
   * Uses the Tooling API to create CustomField metadata. Idempotent — catches
   * "DUPLICATE_DEVELOPER_NAME" errors and treats them as "already exists".
   *
   * Fields created on BOTH Contact and Lead:
   *   - Cursive_Intent_Category__c  (Text 255)
   *   - Cursive_Intent_Score__c     (Number 3,0)
   *   - Cursive_Sha256_Email__c     (Text 255)
   *   - Cursive_Last_Intent_Refresh__c (DateTime)
   *   - Cursive_Behavioral_Signals__c (LongTextArea 3200)
   *   - Cursive_Workspace_Id__c     (Text 36)
   *
   * Note: after provisioning, the user may need to manually add these fields
   * to page layouts and grant Field Level Security (FLS) via Setup. The
   * Tooling API creates the fields but doesn't auto-update layouts.
   */
  async provisionIntentFields(): Promise<{
    created: string[]
    existed: string[]
    failed: Array<{ field: string; error: string }>
  }> {
    interface FieldDef {
      devName: string
      label: string
      type: string
      length?: number
      precision?: number
      scale?: number
      description: string
    }

    const fields: FieldDef[] = [
      {
        devName: 'Cursive_Intent_Category',
        label: 'Cursive Intent Category',
        type: 'Text',
        length: 255,
        description: 'Behavioral intent category from Cursive AudienceLab pixel',
      },
      {
        devName: 'Cursive_Intent_Score',
        label: 'Cursive Intent Score',
        type: 'Number',
        precision: 3,
        scale: 0,
        description: 'Numeric 0-100 intent freshness score from Cursive',
      },
      {
        devName: 'Cursive_Sha256_Email',
        label: 'Cursive SHA-256 Identity Hash',
        type: 'Text',
        length: 255,
        description: 'SHA-256 hashed email from AudienceLab identity graph',
      },
      {
        devName: 'Cursive_Last_Intent_Refresh',
        label: 'Cursive Last Intent Refresh',
        type: 'DateTime',
        description: 'Timestamp of the most recent intent signal refresh',
      },
      {
        devName: 'Cursive_Behavioral_Signals',
        label: 'Cursive Behavioral Signals',
        type: 'LongTextArea',
        length: 3200,
        description: 'Semicolon-delimited list of recent behavioral signals',
      },
      {
        devName: 'Cursive_Workspace_Id',
        label: 'Cursive Workspace ID',
        type: 'Text',
        length: 36,
        description: 'Source Cursive workspace for audit trail',
      },
    ]

    const result = {
      created: [] as string[],
      existed: [] as string[],
      failed: [] as Array<{ field: string; error: string }>,
    }

    const TARGET_OBJECTS = ['Contact', 'Lead'] as const

    for (const obj of TARGET_OBJECTS) {
      for (const field of fields) {
        const fullName = `${obj}.${field.devName}__c`
        const metadata: Record<string, unknown> = {
          label: field.label,
          type: field.type,
          description: field.description,
        }
        if (field.length !== undefined) metadata.length = field.length
        if (field.precision !== undefined) metadata.precision = field.precision
        if (field.scale !== undefined) metadata.scale = field.scale
        // LongTextArea requires visibleLines
        if (field.type === 'LongTextArea') {
          metadata.visibleLines = 4
        }

        try {
          await this.toolingApiRequest('/sobjects/CustomField/', 'POST', {
            FullName: fullName,
            Metadata: metadata,
          })
          result.created.push(fullName)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (
            msg.includes('DUPLICATE_DEVELOPER_NAME') ||
            msg.includes('duplicate value found') ||
            msg.includes('already exists')
          ) {
            result.existed.push(fullName)
          } else {
            result.failed.push({ field: fullName, error: msg.slice(0, 400) })
          }
        }
      }
    }

    return result
  }
}

/**
 * Factory function to create and initialize a SalesforceService
 * Returns null if Salesforce is not configured for the workspace
 */
export async function createSalesforceService(workspaceId: string): Promise<SalesforceService | null> {
  return SalesforceService.initialize(workspaceId)
}
