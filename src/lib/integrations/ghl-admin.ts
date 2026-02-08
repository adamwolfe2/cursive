/**
 * GoHighLevel Admin Client
 *
 * Direct API access to Cursive's own GHL account using Private Integration Token.
 * This is SEPARATE from the OAuth-based client in gohighlevel.service.ts
 * which handles individual customer workspace connections.
 *
 * Uses:
 * - Onboard new customers as contacts in Cursive's GHL
 * - Create opportunities in the Agency OS pipeline
 * - Create sub-accounts for done-for-you clients
 * - Deliver leads to client sub-accounts
 * - Manage calendars and appointments
 */

import { fetchWithTimeout } from '@/lib/utils/retry'

// ============================================================================
// CONFIGURATION
// ============================================================================

const GHL_API_URL = 'https://services.leadconnectorhq.com'
const GHL_TIMEOUT = 30000

// Cursive's GHL Location
const CURSIVE_LOCATION_ID = process.env.GHL_CURSIVE_LOCATION_ID || 'AH5QJaleTM0rivjX8Y3f'
const CURSIVE_LOCATION_TOKEN = process.env.GHL_CURSIVE_LOCATION_TOKEN || ''

// Cursive's GHL Agency (for sub-account creation)
const CURSIVE_AGENCY_TOKEN = process.env.GHL_CURSIVE_AGENCY_TOKEN || ''
const CURSIVE_COMPANY_ID = process.env.GHL_CURSIVE_COMPANY_ID || '6F2SPVmOKsBJqgzGoKsr'

// Pipeline IDs (from Cursive's GHL account)
export const GHL_PIPELINES = {
  AI_AUDIT: 'FtTWd45LvOSQFwC0KJkb',
  AGENCY_OS_SALES: 'DDSchN74J4hfiFs5em4H',
} as const

// Pipeline Stage IDs
export const GHL_STAGES = {
  // AI Audit Pipeline
  AUDIT_SUBMITTED: 'eb220092-5c31-4bc4-ac99-b9aa43b6c32e',
  AWAITING_BOOKING: 'a2da8bf1-b882-49be-9fae-6d49192fe9a9',
  BOOKED: '71f0c2f7-7dfa-440a-b289-1a2288601050',
  COMPLETED_AUDIT: '9c0d81bc-cc50-4395-988d-11ff066fd541',

  // Agency OS Sales Pipeline
  NEW_LEAD: '27d01b68-94e3-4c61-82a5-8fecc31367d3',
  CALL_BOOKED: '4a315dc9-4513-4400-809a-85be59158851',
  NO_SHOW_RESCHEDULE: '6150a9e0-2e9c-4f70-97bf-9edf159562cc',
  QUALIFIED_PROPOSAL: '9646e617-6c46-465b-a036-328ce9ed6d98',
  WON: 'dea9c4f2-2e6f-453b-a0de-9af7d19cf827',
  LOST: '25177070-8f85-43b9-982d-9ff911ef5529',
} as const

// Custom Field IDs (from Cursive's GHL account)
export const GHL_CUSTOM_FIELDS = {
  COMPANY_SIZE: 'RA9nMHgMtJXU4psI6k2i',
  INDUSTRY: 'f8leCRd1QzhnKrlp9bNg',
  AI_MATURITY: 'G6s5ctHOHEReMzYsg00k',
  BUDGET_RANGE: '6ClZZoYLT0E1hyksPbhj',
  DECISION_MAKER_ROLE: 'LMKXxPCj8mnZSOcA7oyY',
  AI_USAGE: '9SNjg1gavcexZ9IAGJld',
  TEAM_SIZE: 'Mb4aEV9RYlPURA0oJTnP',
  OPEN_TO_PARTNERS: 'QpUKT9VJGa8uDMu4azJZ',
  BIGGEST_BOTTLENECK: '0YovZhv8Y07ZF2334KZp',
  AI_BUDGET: 'YEcHdhHs1msK2dtnhnee',
  USING_AI: 'NoZ71Ye6JeR1a8o92nfq',
  AUDIT_REASON: 'DDItTkocPlE7J08SWpmZ',
  IDEAL_OUTCOME: 'Ds0UFWtFPHtRsmSxrPvN',
  MONTHLY_REVENUE: 'nvupeyaBNnn2TizecaOv',
} as const

// Calendar IDs
export const GHL_CALENDARS = {
  SCORECARD_INTERVIEW: 'BZRDQYjGCzVG9WVIUoAR',
} as const

// ============================================================================
// TYPES
// ============================================================================

export interface GhlAdminContact {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  companyName?: string
  source?: string
  tags?: string[]
  customFields?: Array<{ id: string; value: string | string[] }>
}

export interface GhlAdminOpportunity {
  name: string
  pipelineId: string
  stageId: string
  status: 'open' | 'won' | 'lost' | 'abandoned'
  monetaryValue?: number
  contactId: string
}

export interface GhlSubAccountConfig {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  snapshotId?: string
}

// ============================================================================
// API CLIENT
// ============================================================================

async function ghlAdminFetch(
  endpoint: string,
  options: RequestInit & { timeout?: number; useAgencyToken?: boolean } = {}
): Promise<any> {
  const token = options.useAgencyToken ? CURSIVE_AGENCY_TOKEN : CURSIVE_LOCATION_TOKEN

  if (!token) {
    throw new Error(
      options.useAgencyToken
        ? 'GHL_CURSIVE_AGENCY_TOKEN not configured'
        : 'GHL_CURSIVE_LOCATION_TOKEN not configured'
    )
  }

  const { timeout = GHL_TIMEOUT, useAgencyToken: _, ...fetchOptions } = options

  const response = await fetchWithTimeout(`${GHL_API_URL}${endpoint}`, {
    ...fetchOptions,
    timeout,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const msg = (error as Record<string, unknown>).message as string
    throw new Error(msg || `GHL Admin API error: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// CONTACTS - Cursive's Own GHL Account
// ============================================================================

/**
 * Create a contact in Cursive's GHL account
 * Used for: new customers, audit submissions, leads
 */
export async function createCursiveContact(
  contact: GhlAdminContact
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const result = await ghlAdminFetch('/contacts/', {
      method: 'POST',
      body: JSON.stringify({
        locationId: CURSIVE_LOCATION_ID,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        companyName: contact.companyName,
        source: contact.source || 'Cursive Platform',
        tags: contact.tags || [],
        customFields: contact.customFields || [],
      }),
    })

    return { success: true, contactId: result.contact?.id }
  } catch (error: any) {
    // Handle duplicate contact (400 error)
    if (error.message?.includes('Duplicate')) {
      // Try to find existing contact
      const existing = await findCursiveContactByEmail(contact.email || '')
      if (existing) {
        return { success: true, contactId: existing }
      }
    }
    return { success: false, error: error.message }
  }
}

/**
 * Find contact by email in Cursive's GHL
 */
export async function findCursiveContactByEmail(
  email: string
): Promise<string | null> {
  if (!email) return null

  try {
    const result = await ghlAdminFetch(
      `/contacts/?locationId=${CURSIVE_LOCATION_ID}&query=${encodeURIComponent(email)}&limit=1`
    )

    if (result.contacts && result.contacts.length > 0) {
      return result.contacts[0].id
    }
    return null
  } catch {
    return null
  }
}

/**
 * Update a contact in Cursive's GHL
 */
export async function updateCursiveContact(
  contactId: string,
  updates: Partial<GhlAdminContact>
): Promise<{ success: boolean; error?: string }> {
  try {
    await ghlAdminFetch(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...(updates.firstName && { firstName: updates.firstName }),
        ...(updates.lastName && { lastName: updates.lastName }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.companyName && { companyName: updates.companyName }),
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.customFields && { customFields: updates.customFields }),
      }),
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Add tags to a contact in Cursive's GHL
 */
export async function addCursiveContactTags(
  contactId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ghlAdminFetch(`/contacts/${contactId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// OPPORTUNITIES - Cursive's Sales Pipeline
// ============================================================================

/**
 * Create an opportunity in Cursive's GHL pipeline
 */
export async function createCursiveOpportunity(
  opportunity: GhlAdminOpportunity
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  try {
    const result = await ghlAdminFetch('/opportunities/', {
      method: 'POST',
      body: JSON.stringify({
        locationId: CURSIVE_LOCATION_ID,
        pipelineId: opportunity.pipelineId,
        pipelineStageId: opportunity.stageId,
        contactId: opportunity.contactId,
        name: opportunity.name,
        status: opportunity.status,
        monetaryValue: opportunity.monetaryValue,
      }),
    })

    return { success: true, opportunityId: result.opportunity?.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update opportunity stage in Cursive's GHL
 */
export async function updateCursiveOpportunityStage(
  opportunityId: string,
  stageId: string,
  status?: 'open' | 'won' | 'lost' | 'abandoned'
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, any> = { pipelineStageId: stageId }
    if (status) updateData.status = status

    await ghlAdminFetch(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// SUB-ACCOUNT CREATION - Done-For-You Clients
// ============================================================================

/**
 * Create a GHL sub-account for a done-for-you client
 * Uses agency token to create location under Cursive's agency
 */
export async function createClientSubAccount(
  config: GhlSubAccountConfig
): Promise<{ success: boolean; locationId?: string; error?: string }> {
  try {
    const result = await ghlAdminFetch('/locations/', {
      method: 'POST',
      useAgencyToken: true,
      body: JSON.stringify({
        companyId: CURSIVE_COMPANY_ID,
        name: config.name,
        email: config.email,
        phone: config.phone || '',
        address: config.address || '',
        city: config.city || '',
        state: config.state || '',
        postalCode: config.postalCode || '',
        country: config.country || 'US',
        timezone: 'America/Los_Angeles',
        settings: {
          allowDuplicateContact: false,
          allowDuplicateOpportunity: false,
        },
      }),
    })

    const locationId = result.location?.id || result.id

    // Apply snapshot if specified
    if (config.snapshotId && locationId) {
      await applySnapshotToLocation(locationId, config.snapshotId)
    }

    return { success: true, locationId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Apply a snapshot (template) to a GHL location
 */
async function applySnapshotToLocation(
  locationId: string,
  snapshotId: string
): Promise<void> {
  try {
    await ghlAdminFetch(`/snapshots/share/link`, {
      method: 'POST',
      useAgencyToken: true,
      body: JSON.stringify({
        snapshot_id: snapshotId,
        location_id: locationId,
        companyId: CURSIVE_COMPANY_ID,
        type: 'permanent',
      }),
    })
  } catch (error) {
    console.error('[GHL Admin] Failed to apply snapshot:', error)
  }
}

// ============================================================================
// LEAD DELIVERY - Push Leads to Client's GHL Sub-Account
// ============================================================================

/**
 * Deliver a batch of leads to a client's GHL sub-account
 * Used for done-for-you clients where we push leads directly
 */
export async function deliverLeadsToSubAccount(
  clientLocationId: string,
  leads: Array<{
    firstName: string
    lastName: string
    email: string
    phone?: string
    companyName?: string
    industry?: string
    state?: string
    source?: string
    tags?: string[]
  }>
): Promise<{ delivered: number; failed: number; results: Array<{ email: string; success: boolean; contactId?: string }> }> {
  const results: Array<{ email: string; success: boolean; contactId?: string }> = []
  let delivered = 0
  let failed = 0

  for (const lead of leads) {
    try {
      const result = await ghlAdminFetch('/contacts/', {
        method: 'POST',
        body: JSON.stringify({
          locationId: clientLocationId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || '',
          companyName: lead.companyName || '',
          source: lead.source || 'Cursive Leads',
          tags: [...(lead.tags || []), 'cursive-lead', `industry-${lead.industry?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`],
          customFields: [
            ...(lead.industry ? [{ id: GHL_CUSTOM_FIELDS.INDUSTRY, value: lead.industry }] : []),
          ],
        }),
      })

      delivered++
      results.push({ email: lead.email, success: true, contactId: result.contact?.id })
    } catch (error: any) {
      // Handle duplicate - still count as delivered
      if (error.message?.includes('Duplicate')) {
        delivered++
        results.push({ email: lead.email, success: true })
      } else {
        failed++
        results.push({ email: lead.email, success: false })
      }
    }

    // Rate limiting: 200ms between requests (GHL allows ~500 req/5min)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return { delivered, failed, results }
}

// ============================================================================
// CALENDARS - Read Available Slots
// ============================================================================

/**
 * Get free slots for a Cursive calendar
 */
export async function getCursiveCalendarSlots(
  calendarId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ start: string; end: string }>> {
  try {
    const result = await ghlAdminFetch(
      `/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}`
    )
    return result.slots || []
  } catch {
    return []
  }
}

// ============================================================================
// UTILITY: Map Cursive Lead to GHL Contact
// ============================================================================

/**
 * Map a lead from Cursive's database schema to GHL contact format
 */
export function mapCursiveLeadToGhlContact(lead: {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  company_name?: string | null
  company_industry?: string | null
  company_size?: string | null
  state?: string | null
  seniority_level?: string | null
  intent_score_calculated?: number | null
}): GhlAdminContact {
  const customFields: Array<{ id: string; value: string | string[] }> = []

  if (lead.company_industry) {
    customFields.push({ id: GHL_CUSTOM_FIELDS.INDUSTRY, value: lead.company_industry })
  }
  if (lead.company_size) {
    customFields.push({ id: GHL_CUSTOM_FIELDS.COMPANY_SIZE, value: [lead.company_size] })
  }
  if (lead.seniority_level && lead.seniority_level !== 'unknown') {
    const roleMap: Record<string, string> = {
      c_suite: 'C-Level',
      vp: 'Director',
      director: 'Director',
      manager: 'Manager',
      ic: 'Other',
    }
    customFields.push({
      id: GHL_CUSTOM_FIELDS.DECISION_MAKER_ROLE,
      value: [roleMap[lead.seniority_level] || 'Other'],
    })
  }

  return {
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    phone: lead.phone || undefined,
    companyName: lead.company_name || undefined,
    source: 'Cursive Leads',
    tags: [
      'cursive-lead',
      ...(lead.company_industry ? [`industry-${lead.company_industry.toLowerCase().replace(/\s+/g, '-')}`] : []),
      ...(lead.state ? [`state-${lead.state.toLowerCase()}`] : []),
      ...(lead.intent_score_calculated && lead.intent_score_calculated >= 70 ? ['high-intent'] : []),
    ],
    customFields,
  }
}
