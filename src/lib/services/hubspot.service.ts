// HubSpot Service
// CRM integration for bi-directional lead sync

import { createClient } from '@/lib/supabase/server'

const HUBSPOT_API_BASE = 'https://api.hubapi.com'

export interface HubSpotContact {
  id?: string
  properties: {
    email?: string
    firstname?: string
    lastname?: string
    company?: string
    phone?: string
    jobtitle?: string
    lifecyclestage?: string
    hs_lead_status?: string
    [key: string]: string | undefined
  }
}

export interface HubSpotCompany {
  id?: string
  properties: {
    name?: string
    domain?: string
    industry?: string
    numberofemployees?: string
    phone?: string
    city?: string
    state?: string
    country?: string
    [key: string]: string | undefined
  }
}

export class HubSpotService {
  private workspaceId: string
  private accessToken: string | null = null

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Initialize with access token from database
   */
  async initialize(): Promise<boolean> {
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('crm_connections')
      .select('access_token, refresh_token, token_expires_at')
      .eq('workspace_id', this.workspaceId)
      .eq('provider', 'hubspot')
      .single()

    if (!connection) {
      return false
    }

    // Check if token is expired and refresh if needed
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      const refreshed = await this.refreshToken(connection.refresh_token)
      if (!refreshed) return false
    } else {
      this.accessToken = connection.access_token
    }

    return true
  }

  /**
   * Refresh OAuth token
   */
  private async refreshToken(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.HUBSPOT_CLIENT_ID || '',
          client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        console.error('[HubSpotService] Token refresh failed')
        return false
      }

      const tokens = await response.json()
      this.accessToken = tokens.access_token

      // Update tokens in database
      const supabase = await createClient()
      await supabase
        .from('crm_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('workspace_id', this.workspaceId)
        .eq('provider', 'hubspot')

      return true
    } catch (error) {
      console.error('[HubSpotService] Token refresh error:', error)
      return false
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(
    endpoint: string,
    method: string = 'GET',
    body?: object
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('HubSpot not initialized')
    }

    const response = await fetch(`${HUBSPOT_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HubSpot API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Create or update a contact
   */
  async upsertContact(contact: HubSpotContact): Promise<{ id: string; created: boolean }> {
    const supabase = await createClient()

    try {
      // Try to find existing contact by email
      if (contact.properties.email) {
        const searchResult = await this.apiRequest(
          '/crm/v3/objects/contacts/search',
          'POST',
          {
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: contact.properties.email,
              }],
            }],
          }
        )

        if (searchResult.results?.length > 0) {
          // Update existing contact
          const existingId = searchResult.results[0].id
          await this.apiRequest(
            `/crm/v3/objects/contacts/${existingId}`,
            'PATCH',
            { properties: contact.properties }
          )
          return { id: existingId, created: false }
        }
      }

      // Create new contact
      const result = await this.apiRequest(
        '/crm/v3/objects/contacts',
        'POST',
        { properties: contact.properties }
      )

      return { id: result.id, created: true }
    } catch (error: any) {
      console.error('[HubSpotService] Upsert contact error:', error)
      throw error
    }
  }

  /**
   * Create a company
   */
  async createCompany(company: HubSpotCompany): Promise<string> {
    const result = await this.apiRequest(
      '/crm/v3/objects/companies',
      'POST',
      { properties: company.properties }
    )
    return result.id
  }

  /**
   * Associate contact with company
   */
  async associateContactWithCompany(contactId: string, companyId: string): Promise<void> {
    await this.apiRequest(
      `/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`,
      'PUT'
    )
  }

  /**
   * Sync a lead to HubSpot
   */
  async syncLead(lead: Record<string, any>): Promise<{
    success: boolean
    contactId?: string
    companyId?: string
    error?: string
  }> {
    const supabase = await createClient()

    try {
      // Get field mappings
      const { data: connection } = await supabase
        .from('crm_connections')
        .select('field_mappings')
        .eq('workspace_id', this.workspaceId)
        .eq('provider', 'hubspot')
        .single()

      const mappings = (connection?.field_mappings as Record<string, string>) || {}

      // Map lead fields to HubSpot properties
      const contactProperties: Record<string, string> = {
        email: lead.email || '',
        firstname: lead.first_name || '',
        lastname: lead.last_name || '',
        company: lead.company_name || '',
        phone: lead.phone || '',
        jobtitle: lead.job_title || '',
      }

      // Apply custom mappings
      for (const [leadField, hubspotField] of Object.entries(mappings)) {
        if (lead[leadField] && hubspotField) {
          contactProperties[hubspotField] = String(lead[leadField])
        }
      }

      // Create/update contact
      const { id: contactId, created } = await this.upsertContact({
        properties: contactProperties,
      })

      // Log sync
      await supabase.from('crm_sync_log').insert({
        connection_id: connection?.id || this.workspaceId, // Fallback
        lead_id: lead.id,
        sync_type: created ? 'create' : 'update',
        sync_direction: 'to_crm',
        crm_record_id: contactId,
        crm_record_type: 'contact',
        success: true,
        changes: contactProperties,
      })

      return { success: true, contactId }
    } catch (error: any) {
      console.error('[HubSpotService] Sync lead error:', error)

      // Log failed sync
      const supabase = await createClient()
      await supabase.from('crm_sync_log').insert({
        connection_id: this.workspaceId,
        lead_id: lead.id,
        sync_type: 'create',
        sync_direction: 'to_crm',
        crm_record_type: 'contact',
        success: false,
        error_message: error.message,
      })

      return { success: false, error: error.message }
    }
  }

  /**
   * Get contacts from HubSpot (for import)
   */
  async getContacts(limit: number = 100, after?: string): Promise<{
    contacts: HubSpotContact[]
    paging?: { next?: { after: string } }
  }> {
    const params = new URLSearchParams({
      limit: String(limit),
      properties: 'email,firstname,lastname,company,phone,jobtitle,lifecyclestage',
    })
    if (after) params.set('after', after)

    return this.apiRequest(`/crm/v3/objects/contacts?${params}`)
  }
}

export async function createHubSpotService(workspaceId: string): Promise<HubSpotService | null> {
  const service = new HubSpotService(workspaceId)
  const initialized = await service.initialize()
  return initialized ? service : null
}
