/**
 * GoHighLevel (GHL) Integration Service
 * Cursive Platform
 *
 * Syncs contacts, triggers workflows, and manages opportunities in GHL
 */

import { createClient } from '@/lib/supabase/server'
import { fetchWithTimeout } from '@/lib/utils/retry'

// Configuration
const GHL_TIMEOUT = 30000 // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface GhlContact {
  id?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  companyName?: string
  source?: string
  tags?: string[]
  customFields?: Record<string, any>
}

export interface GhlOpportunity {
  id?: string
  name: string
  pipelineId: string
  stageId: string
  status: 'open' | 'won' | 'lost' | 'abandoned'
  monetaryValue?: number
  contactId: string
}

export interface GhlConnection {
  id: string
  workspaceId: string
  locationId: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
}

// ============================================================================
// API CLIENT
// ============================================================================

const GHL_API_URL = 'https://services.leadconnectorhq.com'

async function ghlFetch(
  connection: GhlConnection,
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<any> {
  // Check if token needs refresh
  if (new Date(connection.tokenExpiresAt) <= new Date()) {
    const refreshed = await refreshGhlToken(connection)
    if (!refreshed) {
      throw new Error('Failed to refresh GHL token')
    }
    connection.accessToken = refreshed.accessToken
  }

  const timeout = options.timeout ?? GHL_TIMEOUT

  const response = await fetchWithTimeout(`${GHL_API_URL}${endpoint}`, {
    ...options,
    timeout,
    headers: {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as any).message || `GHL API error: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Refresh GHL OAuth token
 */
async function refreshGhlToken(
  connection: GhlConnection
): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
    console.error('[GHL] Missing GHL_CLIENT_ID or GHL_CLIENT_SECRET')
    return null
  }

  try {
    const response = await fetchWithTimeout(`${GHL_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
      }),
      timeout: 15000, // Token refresh should be quick
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Update tokens in database
    const supabase = await createClient()
    await supabase
      .from('ghl_connections')
      .update({
        access_token_encrypted: data.access_token,
        refresh_token_encrypted: data.refresh_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('id', connection.id)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  } catch {
    return null
  }
}

/**
 * Get GHL connection for workspace
 */
export async function getGhlConnection(workspaceId: string): Promise<GhlConnection | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ghl_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .single()

  if (!data) return null

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    locationId: data.location_id,
    accessToken: data.access_token_encrypted,
    refreshToken: data.refresh_token_encrypted,
    tokenExpiresAt: new Date(data.token_expires_at),
  }
}

// ============================================================================
// CONTACTS
// ============================================================================

/**
 * Create or update a contact in GHL
 */
export async function syncContactToGhl(
  workspaceId: string,
  contact: GhlContact
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  const connection = await getGhlConnection(workspaceId)

  if (!connection) {
    return { success: false, error: 'GHL not connected' }
  }

  try {
    // Check if contact exists by email
    if (contact.email) {
      const existing = await findGhlContactByEmail(connection, contact.email)
      if (existing) {
        // Update existing contact
        const updated = await ghlFetch(
          connection,
          `/contacts/${existing.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(mapContactToGhl(contact)),
          }
        )
        return { success: true, contactId: updated.contact.id }
      }
    }

    // Create new contact
    const created = await ghlFetch(
      connection,
      '/contacts/',
      {
        method: 'POST',
        body: JSON.stringify({
          ...mapContactToGhl(contact),
          locationId: connection.locationId,
        }),
      }
    )

    return { success: true, contactId: created.contact.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Find contact by email in GHL
 */
async function findGhlContactByEmail(
  connection: GhlConnection,
  email: string
): Promise<{ id: string } | null> {
  try {
    const result = await ghlFetch(
      connection,
      `/contacts/search?locationId=${connection.locationId}&query=${encodeURIComponent(email)}`
    )

    if (result.contacts && result.contacts.length > 0) {
      return { id: result.contacts[0].id }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Map our contact format to GHL format
 */
function mapContactToGhl(contact: GhlContact): Record<string, any> {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    companyName: contact.companyName,
    source: contact.source || 'Cursive',
    tags: contact.tags,
    customField: contact.customFields,
  }
}

// ============================================================================
// OPPORTUNITIES
// ============================================================================

/**
 * Create opportunity in GHL
 */
export async function createGhlOpportunity(
  workspaceId: string,
  opportunity: GhlOpportunity
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  const connection = await getGhlConnection(workspaceId)

  if (!connection) {
    return { success: false, error: 'GHL not connected' }
  }

  try {
    const created = await ghlFetch(
      connection,
      '/opportunities/',
      {
        method: 'POST',
        body: JSON.stringify({
          locationId: connection.locationId,
          pipelineId: opportunity.pipelineId,
          pipelineStageId: opportunity.stageId,
          contactId: opportunity.contactId,
          name: opportunity.name,
          status: opportunity.status,
          monetaryValue: opportunity.monetaryValue,
        }),
      }
    )

    return { success: true, opportunityId: created.opportunity.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update opportunity status in GHL
 */
export async function updateGhlOpportunityStatus(
  workspaceId: string,
  opportunityId: string,
  status: 'open' | 'won' | 'lost' | 'abandoned',
  stageId?: string
): Promise<{ success: boolean; error?: string }> {
  const connection = await getGhlConnection(workspaceId)

  if (!connection) {
    return { success: false, error: 'GHL not connected' }
  }

  try {
    const updateData: Record<string, any> = { status }
    if (stageId) {
      updateData.pipelineStageId = stageId
    }

    await ghlFetch(
      connection,
      `/opportunities/${opportunityId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }
    )

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// PIPELINES
// ============================================================================

/**
 * Get pipelines from GHL
 */
export async function getGhlPipelines(
  workspaceId: string
): Promise<Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }>> {
  const connection = await getGhlConnection(workspaceId)

  if (!connection) {
    return []
  }

  try {
    const result = await ghlFetch(
      connection,
      `/opportunities/pipelines?locationId=${connection.locationId}`
    )

    return result.pipelines.map((p: any) => ({
      id: p.id,
      name: p.name,
      stages: p.stages.map((s: any) => ({
        id: s.id,
        name: s.name,
      })),
    }))
  } catch {
    return []
  }
}

// ============================================================================
// WORKFLOWS
// ============================================================================

/**
 * Trigger a GHL workflow for a contact
 */
export async function triggerGhlWorkflow(
  workspaceId: string,
  workflowId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  const connection = await getGhlConnection(workspaceId)

  if (!connection) {
    return { success: false, error: 'GHL not connected' }
  }

  try {
    await ghlFetch(
      connection,
      `/contacts/${contactId}/workflow/${workflowId}`,
      { method: 'POST' }
    )

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// BULK SYNC
// ============================================================================

/**
 * Sync multiple leads to GHL
 */
export async function bulkSyncToGhl(
  workspaceId: string,
  leads: Array<{
    id: string
    companyData: any
    contactData: any
  }>,
  options: {
    createOpportunities?: boolean
    pipelineId?: string
    stageId?: string
    tags?: string[]
  } = {}
): Promise<{ synced: number; failed: number; results: Array<{ leadId: string; success: boolean; ghlContactId?: string }> }> {
  const results: Array<{ leadId: string; success: boolean; ghlContactId?: string }> = []
  let synced = 0
  let failed = 0

  for (const lead of leads) {
    const contact = lead.contactData?.contacts?.[0]

    if (!contact) {
      results.push({ leadId: lead.id, success: false })
      failed++
      continue
    }

    const ghlContact: GhlContact = {
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      email: contact.email,
      phone: contact.phone,
      companyName: lead.companyData?.name,
      source: 'Cursive',
      tags: options.tags,
      customFields: {
        cursive_lead_id: lead.id,
        company_industry: lead.companyData?.industry,
        lead_score: lead.companyData?.intent_score,
      },
    }

    const syncResult = await syncContactToGhl(workspaceId, ghlContact)

    if (syncResult.success && syncResult.contactId) {
      synced++
      results.push({ leadId: lead.id, success: true, ghlContactId: syncResult.contactId })

      // Create opportunity if requested
      if (options.createOpportunities && options.pipelineId && options.stageId) {
        await createGhlOpportunity(workspaceId, {
          name: `${lead.companyData?.name || 'Lead'} - Cursive`,
          pipelineId: options.pipelineId,
          stageId: options.stageId,
          status: 'open',
          contactId: syncResult.contactId,
          monetaryValue: lead.companyData?.estimated_value,
        })
      }

      // Update lead with GHL contact ID
      const supabase = await createClient()
      await supabase
        .from('leads')
        .update({
          contact_data: {
            ...lead.contactData,
            ghl_contact_id: syncResult.contactId,
          },
        })
        .eq('id', lead.id)
        .eq('workspace_id', workspaceId) // Workspace isolation
    } else {
      failed++
      results.push({ leadId: lead.id, success: false })
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return { synced, failed, results }
}
