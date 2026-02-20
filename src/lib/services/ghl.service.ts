/**
 * GoHighLevel API Service
 *
 * Handles sub-account creation and lead syncing to GHL CRM
 */

import { safeLog, safeError, safeWarn } from '@/lib/utils/log-sanitizer'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_LOCATION_TOKEN = process.env.GHL_CURSIVE_LOCATION_TOKEN
const GHL_AGENCY_TOKEN = process.env.GHL_CURSIVE_AGENCY_TOKEN
const GHL_LOCATION_ID = process.env.GHL_CURSIVE_LOCATION_ID
const GHL_SNAPSHOT_ID = process.env.GHL_SNAPSHOT_ID

if (!GHL_LOCATION_TOKEN || !GHL_AGENCY_TOKEN) {
  safeWarn('[GHL] API tokens not configured')
}

export interface GHLSubAccount {
  id: string
  name: string
  email: string
  phone: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  timezone?: string
}

export interface GHLContact {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  companyName?: string
  website?: string
  tags?: string[]
  source?: string
  customFields?: Record<string, string>
}

/**
 * Create a GHL sub-account for a user
 *
 * @param userData - User information for sub-account creation
 * @returns Created sub-account data
 */
export async function createGHLSubAccount(userData: {
  businessName: string
  fullName: string
  email: string
  phone?: string
  website?: string
}): Promise<GHLSubAccount> {
  if (!GHL_AGENCY_TOKEN) {
    throw new Error('GHL_AGENCY_TOKEN not configured')
  }

  try {
    safeLog('[GHL] Creating sub-account for:', userData.email)

    const response = await fetch(`${GHL_API_BASE}/locations/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_AGENCY_TOKEN}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        name: userData.businessName,
        email: userData.email,
        phone: userData.phone || '',
        website: userData.website || '',
        companyId: GHL_LOCATION_ID,
        // Apply Cursive snapshot if available
        ...(GHL_SNAPSHOT_ID && { snapshotId: GHL_SNAPSHOT_ID }),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      safeError('[GHL] Sub-account creation failed:', {
        status: response.status,
        error,
      })
      throw new Error(`GHL API error: ${response.status} - ${error}`)
    }

    const subAccount = await response.json()
    safeLog('[GHL] Sub-account created:', {
      id: subAccount.id,
      name: subAccount.name,
    })

    return {
      id: subAccount.id,
      name: subAccount.name,
      email: subAccount.email,
      phone: subAccount.phone,
      website: subAccount.website,
      address: subAccount.address,
      city: subAccount.city,
      state: subAccount.state,
      country: subAccount.country,
      postalCode: subAccount.postalCode,
      timezone: subAccount.timezone,
    }
  } catch (error) {
    safeError('[GHL] Failed to create sub-account:', error)
    throw error
  }
}

/**
 * Get access token for a specific location (sub-account)
 *
 * @param locationId - GHL location ID
 * @returns Access token for the location
 */
export async function getLocationAccessToken(locationId: string): Promise<string> {
  // For now, use the main location token
  // In production, you'd use OAuth flow to get location-specific tokens
  if (!GHL_LOCATION_TOKEN) {
    throw new Error('GHL_LOCATION_TOKEN not configured')
  }
  return GHL_LOCATION_TOKEN
}

/**
 * Create or update a contact in GHL
 *
 * @param locationId - GHL location ID (sub-account)
 * @param contactData - Contact information
 * @returns Created/updated contact data
 */
export async function upsertGHLContact(
  locationId: string,
  contactData: GHLContact
): Promise<any> {
  try {
    const accessToken = await getLocationAccessToken(locationId)

    safeLog('[GHL] Upserting contact:', {
      locationId,
      email: contactData.email,
    })

    const response = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        locationId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        companyName: contactData.companyName,
        website: contactData.website,
        tags: contactData.tags || [],
        source: contactData.source || 'Cursive - Audience Labs',
        customField: contactData.customFields || {},
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      safeError('[GHL] Contact upsert failed:', {
        status: response.status,
        error,
      })
      throw new Error(`GHL API error: ${response.status} - ${error}`)
    }

    const contact = await response.json()
    safeLog('[GHL] Contact upserted:', { id: contact.contact?.id })

    return contact
  } catch (error) {
    safeError('[GHL] Failed to upsert contact:', error)
    throw error
  }
}

/**
 * Sync a batch of leads to GHL
 *
 * @param locationId - GHL location ID (sub-account)
 * @param leads - Array of leads to sync
 * @param tags - Tags to apply to all leads
 * @returns Count of successfully synced leads
 */
export async function syncLeadsToGHL(
  locationId: string,
  leads: Array<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    companyName?: string
    title?: string
  }>,
  tags: string[] = ['cursive-lead']
): Promise<number> {
  safeLog('[GHL] Syncing leads to location:', {
    locationId,
    count: leads.length,
  })

  let successCount = 0

  for (const lead of leads) {
    try {
      await upsertGHLContact(locationId, {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        tags,
        customFields: {
          title: lead.title || '',
        },
      })
      successCount++
    } catch (error) {
      safeError('[GHL] Failed to sync lead:', {
        email: lead.email,
        error,
      })
      // Continue with other leads even if one fails
    }
  }

  safeLog('[GHL] Sync complete:', {
    total: leads.length,
    success: successCount,
    failed: leads.length - successCount,
  })

  return successCount
}

/**
 * Delete a GHL sub-account
 *
 * @param locationId - GHL location ID to delete
 */
export async function deleteGHLSubAccount(locationId: string): Promise<void> {
  if (!GHL_AGENCY_TOKEN) {
    throw new Error('GHL_AGENCY_TOKEN not configured')
  }

  try {
    safeLog('[GHL] Deleting sub-account:', locationId)

    const response = await fetch(`${GHL_API_BASE}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GHL_AGENCY_TOKEN}`,
        'Version': '2021-07-28',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      safeError('[GHL] Sub-account deletion failed:', {
        status: response.status,
        error,
      })
      throw new Error(`GHL API error: ${response.status} - ${error}`)
    }

    safeLog('[GHL] Sub-account deleted successfully')
  } catch (error) {
    safeError('[GHL] Failed to delete sub-account:', error)
    throw error
  }
}
