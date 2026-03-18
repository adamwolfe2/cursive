/**
 * Email Bison API Service
 *
 * Handles email campaign account provisioning.
 * All endpoints below are intentional placeholders — the Email Bison API
 * documentation is not yet available. The request/response shapes are
 * best-guess scaffolding and will be updated once the API is documented.
 */

const EMAILBISON_API_URL = process.env.EMAILBISON_API_URL || 'https://send.meetcursive.com'
const EMAILBISON_API_KEY = process.env.EMAILBISON_API_KEY

export interface EmailBisonAccount {
  id: string
  email: string
  name: string
  status: string
  created_at: string
}

/**
 * Create an Email Bison sub-account for a user
 *
 * @param userData - User information for account creation
 * @returns Created account data
 *
 * NOTE: This is a placeholder implementation.
 * Update with actual Email Bison API endpoints once documentation is available.
 */
export async function createEmailBisonAccount(userData: {
  businessName: string
  fullName: string
  email: string
}): Promise<EmailBisonAccount> {
  if (!EMAILBISON_API_KEY) {
    throw new Error('EMAILBISON_API_KEY not configured')
  }

  try {
    // Placeholder endpoint — update when Email Bison API docs are available
    const response = await fetch(`${EMAILBISON_API_URL}/api/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAILBISON_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.businessName,
        email: userData.email,
        owner_name: userData.fullName,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Email Bison API error: ${response.status} - ${error}`)
    }

    const account = await response.json()

    return {
      id: account.id,
      email: account.email,
      name: account.name,
      status: account.status,
      created_at: account.created_at,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get Email Bison account details
 *
 * @param accountId - Email Bison account ID
 * @returns Account details
 */
export async function getEmailBisonAccount(accountId: string): Promise<EmailBisonAccount | null> {
  if (!EMAILBISON_API_KEY) {
    throw new Error('EMAILBISON_API_KEY not configured')
  }

  try {
    // Placeholder endpoint — update when Email Bison API docs are available
    const response = await fetch(`${EMAILBISON_API_URL}/api/accounts/${accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EMAILBISON_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.text()
      throw new Error(`Email Bison API error: ${response.status} - ${error}`)
    }

    const account = await response.json()
    return account
  } catch {
    return null
  }
}

/**
 * Delete an Email Bison account
 *
 * @param accountId - Email Bison account ID to delete
 */
export async function deleteEmailBisonAccount(accountId: string): Promise<void> {
  if (!EMAILBISON_API_KEY) {
    throw new Error('EMAILBISON_API_KEY not configured')
  }

  // Placeholder endpoint — update when Email Bison API docs are available
  const response = await fetch(`${EMAILBISON_API_URL}/api/accounts/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${EMAILBISON_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Email Bison API error: ${response.status} - ${error}`)
  }
}

// FUTURE: Once Email Bison API docs are available, update endpoints, request/response
// formats, error codes, and add campaign creation, contact list sync, and template methods.
