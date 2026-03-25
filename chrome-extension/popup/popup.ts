// Cursive Chrome Extension — Popup Logic
// 3 screens: Welcome → Connect → Main

import { STORAGE_KEY_API } from '../shared/constants'
import type { EnrichedContact, ExtensionMessage } from '../shared/types'

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const $ = (id: string) => document.getElementById(id)!

const welcomeScreen = $('welcome-screen')
const connectScreen = $('connect-screen')
const mainScreen = $('main-screen')
const apiKeyInput = $('api-key-input') as HTMLInputElement
const connectBtn = $('connect-btn')
const authError = $('auth-error')
const creditBadge = $('credit-badge')
const creditCount = $('credit-count')
const searchName = $('search-name') as HTMLInputElement
const searchCompany = $('search-company') as HTMLInputElement
const searchBtn = $('search-btn')
const searchText = $('search-text')
const searchLoading = $('search-loading')
const results = $('results')
const resultAvatar = $('result-avatar')
const resultName = $('result-name')
const resultTitle = $('result-title')
const resultEmail = $('result-email')
const resultPhone = $('result-phone')
const resultCompany = $('result-company')
const resultEmailRow = $('result-email-row')
const resultPhoneRow = $('result-phone-row')
const copyEmailBtn = $('copy-email')
const copyPhoneBtn = $('copy-phone')
const saveBtn = $('save-btn')
const disconnectBtn = $('disconnect-btn')
const searchError = $('search-error')
const noCredits = $('no-credits')
const showConnectBtn = $('show-connect-btn')
const backToWelcome = $('back-to-welcome')
const settingsLink = $('settings-link')

let currentResult: EnrichedContact | null = null

// ---------------------------------------------------------------------------
// Screen management
// ---------------------------------------------------------------------------

function showScreen(screen: 'welcome' | 'connect' | 'main') {
  welcomeScreen.classList.remove('active')
  connectScreen.classList.remove('active')
  mainScreen.classList.remove('active')

  switch (screen) {
    case 'welcome': welcomeScreen.classList.add('active'); break
    case 'connect': connectScreen.classList.add('active'); break
    case 'main': mainScreen.classList.add('active'); break
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  const key = await getStoredKey()
  if (key) {
    showScreen('main')
    loadCredits()
  } else {
    showScreen('welcome')
  }
}

function getStoredKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY_API, (result) => {
      resolve(result[STORAGE_KEY_API] || null)
    })
  })
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

showConnectBtn.addEventListener('click', () => showScreen('connect'))
backToWelcome.addEventListener('click', () => showScreen('welcome'))
settingsLink.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.runtime.openOptionsPage()
})

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------

connectBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim()
  if (!key) {
    showError(authError, 'Please enter your API key')
    return
  }

  connectBtn.setAttribute('disabled', 'true')
  connectBtn.textContent = 'Connecting...'
  hideError(authError)

  chrome.storage.sync.set({ [STORAGE_KEY_API]: key }, async () => {
    const response = await sendMessage({ type: 'GET_CREDITS' })
    if (response.success) {
      const data = response.data as { remaining: number }
      updateCreditDisplay(data.remaining)
      showScreen('main')
    } else {
      chrome.storage.sync.remove(STORAGE_KEY_API)
      showError(authError, response.error || 'Invalid API key. Please check and try again.')
    }
    connectBtn.removeAttribute('disabled')
    connectBtn.textContent = 'Connect Workspace'
  })
})

disconnectBtn.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.storage.sync.remove(STORAGE_KEY_API)
  apiKeyInput.value = ''
  currentResult = null
  results.classList.add('hidden')
  noCredits.classList.add('hidden')
  showScreen('welcome')
})

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

async function loadCredits() {
  const response = await sendMessage({ type: 'GET_CREDITS' })
  if (response.success) {
    const data = response.data as { remaining: number }
    updateCreditDisplay(data.remaining)
  } else if (response.error?.includes('Invalid API key')) {
    // Key no longer valid — disconnect
    chrome.storage.sync.remove(STORAGE_KEY_API)
    showScreen('welcome')
  }
}

function updateCreditDisplay(remaining: number) {
  creditCount.textContent = String(remaining)

  creditBadge.classList.remove('low', 'empty')
  if (remaining === 0) {
    creditBadge.classList.add('empty')
    noCredits.classList.remove('hidden')
  } else if (remaining <= 10) {
    creditBadge.classList.add('low')
    noCredits.classList.add('hidden')
  } else {
    noCredits.classList.add('hidden')
  }
}

// Credit badge click → buy credits
creditBadge.addEventListener('click', () => {
  window.open('https://leads.meetcursive.com/marketplace', '_blank')
})

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

searchBtn.addEventListener('click', doSearch)
searchName.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch() })
searchCompany.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch() })

async function doSearch() {
  const name = searchName.value.trim()
  if (!name) {
    showError(searchError, 'Enter a name to search')
    return
  }

  const parts = name.split(/\s+/)
  if (parts.length < 2) {
    showError(searchError, 'Enter first and last name (e.g. John Smith)')
    return
  }

  hideError(searchError)
  results.classList.add('hidden')
  noCredits.classList.add('hidden')
  searchText.classList.add('hidden')
  searchLoading.classList.remove('hidden')
  searchBtn.setAttribute('disabled', 'true')

  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')
  const company = searchCompany.value.trim()

  const response = await sendMessage({
    type: 'LOOKUP',
    data: {
      first_name: firstName,
      last_name: lastName,
      company: company || undefined,
    },
  })

  searchText.classList.remove('hidden')
  searchLoading.classList.add('hidden')
  searchBtn.removeAttribute('disabled')

  if (response.success) {
    currentResult = response.data as EnrichedContact
    displayResult(currentResult)
    loadCredits()
  } else {
    if (response.error?.includes('Insufficient credits')) {
      noCredits.classList.remove('hidden')
    } else {
      showError(searchError, response.error || 'Search failed. Try again.')
    }
  }
}

function displayResult(contact: EnrichedContact) {
  // Avatar initials
  const initials = ((contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')).toUpperCase()
  resultAvatar.textContent = initials || '??'

  resultName.textContent = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
  resultTitle.textContent = [contact.job_title, contact.company_name].filter(Boolean).join(' at ') || ''

  // Email
  if (contact.email) {
    resultEmail.textContent = contact.email
    resultEmailRow.style.display = 'flex'
  } else {
    resultEmailRow.style.display = 'none'
  }

  // Phone
  if (contact.phone) {
    resultPhone.textContent = contact.phone
    resultPhoneRow.style.display = 'flex'
  } else {
    resultPhoneRow.style.display = 'none'
  }

  // Company
  if (contact.company_name) {
    resultCompany.textContent = [contact.company_name, contact.company_industry].filter(Boolean).join(' — ')
    ($('result-company-row')).style.display = 'flex'
  } else {
    ($('result-company-row')).style.display = 'none'
  }

  // Show "not found" state
  if (!contact.email && !contact.phone && contact.source === 'not_found') {
    showError(searchError, 'No results found for this person. Try adding their company name.')
  }

  results.classList.remove('hidden')
}

// ---------------------------------------------------------------------------
// Copy buttons
// ---------------------------------------------------------------------------

function setupCopy(btn: HTMLElement, getValue: () => string | null) {
  btn.addEventListener('click', () => {
    const val = getValue()
    if (!val) return
    navigator.clipboard.writeText(val).then(() => {
      btn.classList.add('copied')
      setTimeout(() => btn.classList.remove('copied'), 1500)
    })
  })
}

setupCopy(copyEmailBtn, () => currentResult?.email || null)
setupCopy(copyPhoneBtn, () => currentResult?.phone || null)

// ---------------------------------------------------------------------------
// Save lead
// ---------------------------------------------------------------------------

saveBtn.addEventListener('click', async () => {
  if (!currentResult) return
  saveBtn.setAttribute('disabled', 'true')

  const origHTML = saveBtn.innerHTML
  saveBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinner"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Saving...'

  const response = await sendMessage({ type: 'SAVE_LEAD', data: currentResult })

  if (response.success) {
    const data = response.data as { duplicate: boolean }
    saveBtn.innerHTML = data.duplicate
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg> Already saved'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg> Saved'
    saveBtn.style.borderColor = '#10b981'
    saveBtn.style.color = '#10b981'
  } else {
    saveBtn.innerHTML = 'Failed — try again'
    saveBtn.style.borderColor = '#ef4444'
    saveBtn.style.color = '#ef4444'
  }

  setTimeout(() => {
    saveBtn.innerHTML = origHTML
    saveBtn.removeAttribute('disabled')
    saveBtn.style.borderColor = ''
    saveBtn.style.color = ''
  }, 2500)
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showError(el: HTMLElement, msg: string) {
  el.textContent = msg
  el.classList.remove('hidden')
}

function hideError(el: HTMLElement) {
  el.classList.add('hidden')
}

function sendMessage(message: ExtensionMessage): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message || 'Extension error' })
      } else {
        resolve(response || { success: false, error: 'No response from extension' })
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

init()
