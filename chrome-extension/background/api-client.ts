// Cursive API Client for Chrome Extension
// All API calls go through this module

import { API_BASE, STORAGE_KEY_API } from '../shared/constants'
import type { EnrichedContact, EmailVerification, CompanyData, CreditBalance } from '../shared/types'

async function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY_API, (result) => {
      resolve(result[STORAGE_KEY_API] || null)
    })
  })
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const apiKey = await getApiKey()
  if (!apiKey) {
    return { success: false, error: 'No API key configured. Open extension settings to add your Cursive API key.' }
  }

  try {
    const options: RequestInit = {
      method,
      headers: {
        'x-cursive-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options)

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key. Check your settings.' }
    }
    if (response.status === 402) {
      return { success: false, error: 'Insufficient credits. Purchase more at leads.meetcursive.com.' }
    }
    if (response.status === 403) {
      return { success: false, error: 'API key missing required permissions.' }
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limit reached. Please wait a moment.' }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }))
      return { success: false, error: err.error || `HTTP ${response.status}` }
    }

    const result = await response.json()
    return { success: true, data: result.data as T }
  } catch (error) {
    return { success: false, error: 'Network error. Check your connection.' }
  }
}

// --- Public API ---

export async function lookupPerson(params: {
  first_name: string
  last_name: string
  company?: string
  domain?: string
}): Promise<{ success: true; data: EnrichedContact } | { success: false; error: string }> {
  return apiCall<EnrichedContact>('/lookup', 'POST', params)
}

export async function lookupCompany(domain: string): Promise<{ success: true; data: CompanyData } | { success: false; error: string }> {
  return apiCall<CompanyData>('/company', 'POST', { domain })
}

export async function verifyEmail(email: string): Promise<{ success: true; data: EmailVerification } | { success: false; error: string }> {
  return apiCall<EmailVerification>('/verify-email', 'POST', { email })
}

export async function saveLead(data: Partial<EnrichedContact>): Promise<{ success: true; data: { id: string; duplicate: boolean } } | { success: false; error: string }> {
  return apiCall<{ id: string; duplicate: boolean }>('/save-lead', 'POST', data as Record<string, unknown>)
}

export async function getCredits(): Promise<{ success: true; data: CreditBalance } | { success: false; error: string }> {
  return apiCall<CreditBalance>('/credits', 'GET')
}
