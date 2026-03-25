// Cursive Chrome Extension — Background Service Worker
// Handles all API communication, caching, context menus, and messaging

import { lookupPerson, lookupCompany, verifyEmail, saveLead, getCredits } from './api-client'
import { CACHE_PREFIX, CACHE_TTL_MS } from '../shared/constants'
import type { ExtensionMessage, ExtensionResponse } from '../shared/types'

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function getCached<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    const cacheKey = `${CACHE_PREFIX}${key}`
    chrome.storage.local.get(cacheKey, (result) => {
      const cached = result[cacheKey]
      if (!cached) return resolve(null)
      if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        chrome.storage.local.remove(cacheKey)
        return resolve(null)
      }
      resolve(cached.data as T)
    })
  })
}

async function setCache(key: string, data: unknown): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [cacheKey]: { data, timestamp: Date.now() },
    }, resolve)
  })
}

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'cursive-find-email',
    title: 'Find email with Cursive',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'cursive-find-email' || !info.selectionText) return

  const selectedText = info.selectionText.trim()
  const parts = selectedText.split(/\s+/)

  if (parts.length < 2) {
    // Not enough for a name
    return
  }

  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  // Try to get domain from the current page
  let domain: string | undefined
  if (tab?.url) {
    try {
      const url = new URL(tab.url)
      if (!url.hostname.includes('google') && !url.hostname.includes('linkedin')) {
        domain = url.hostname.replace(/^www\./, '')
      }
    } catch {
      // Invalid URL
    }
  }

  const result = await lookupPerson({ first_name: firstName, last_name: lastName, domain })

  // Send result to the content script
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'LOOKUP_RESULT',
      data: result,
    })
  }
})

// ---------------------------------------------------------------------------
// Message handler (content scripts <-> background)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse: (response: ExtensionResponse) => void) => {
    handleMessage(message).then(sendResponse)
    return true // Keep the message channel open for async response
  }
)

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'LOOKUP': {
      const cacheKey = `lookup_${message.data.first_name}_${message.data.last_name}_${message.data.company || ''}`
      const cached = await getCached(cacheKey)
      if (cached) return { success: true, data: cached }

      const result = await lookupPerson(message.data)
      if (result.success) {
        await setCache(cacheKey, result.data)
      }
      return result
    }

    case 'LOOKUP_BY_EMAIL': {
      const cacheKey = `email_${message.data.email}`
      const cached = await getCached(cacheKey)
      if (cached) return { success: true, data: cached }

      // Extract name from email for lookup
      const localPart = message.data.email.split('@')[0]
      const domain = message.data.email.split('@')[1]
      const nameParts = localPart.replace(/[._-]/g, ' ').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const result = await lookupPerson({ first_name: firstName, last_name: lastName, domain })
      if (result.success) {
        await setCache(cacheKey, result.data)
      }
      return result
    }

    case 'COMPANY': {
      const cacheKey = `company_${message.data.domain}`
      const cached = await getCached(cacheKey)
      if (cached) return { success: true, data: cached }

      const result = await lookupCompany(message.data.domain)
      if (result.success) {
        await setCache(cacheKey, result.data)
      }
      return result
    }

    case 'VERIFY_EMAIL': {
      const cacheKey = `verify_${message.data.email}`
      const cached = await getCached(cacheKey)
      if (cached) return { success: true, data: cached }

      const result = await verifyEmail(message.data.email)
      if (result.success) {
        await setCache(cacheKey, result.data)
      }
      return result
    }

    case 'SAVE_LEAD': {
      return saveLead(message.data)
    }

    case 'GET_CREDITS': {
      return getCredits()
    }

    case 'GET_CACHED': {
      const cached = await getCached(message.data.key)
      if (cached) return { success: true, data: cached }
      return { success: false, error: 'Not cached' }
    }

    default:
      return { success: false, error: 'Unknown message type' }
  }
}
