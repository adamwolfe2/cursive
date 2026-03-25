// Cursive Chrome Extension — Popup Logic

import { STORAGE_KEY_API } from '../shared/constants'
import type { EnrichedContact, ExtensionMessage } from '../shared/types'

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const authScreen = document.getElementById('auth-screen')!
const mainScreen = document.getElementById('main-screen')!
const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement
const connectBtn = document.getElementById('connect-btn')!
const authError = document.getElementById('auth-error')!
const creditCount = document.getElementById('credit-count')!
const searchName = document.getElementById('search-name') as HTMLInputElement
const searchCompany = document.getElementById('search-company') as HTMLInputElement
const searchBtn = document.getElementById('search-btn')!
const searchText = document.getElementById('search-text')!
const searchLoading = document.getElementById('search-loading')!
const results = document.getElementById('results')!
const resultName = document.getElementById('result-name')!
const resultTitle = document.getElementById('result-title')!
const resultEmail = document.getElementById('result-email')!
const resultPhone = document.getElementById('result-phone')!
const resultCompany = document.getElementById('result-company')!
const resultEmailRow = document.getElementById('result-email-row')!
const resultPhoneRow = document.getElementById('result-phone-row')!
const copyEmailBtn = document.getElementById('copy-email')!
const copyPhoneBtn = document.getElementById('copy-phone')!
const saveBtn = document.getElementById('save-btn')!
const disconnectBtn = document.getElementById('disconnect-btn')!
const searchError = document.getElementById('search-error')!

let currentResult: EnrichedContact | null = null

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  const key = await getStoredKey()
  if (key) {
    showMain()
    loadCredits()
  } else {
    showAuth()
  }
}

function showAuth() {
  authScreen.classList.remove('hidden')
  mainScreen.classList.add('hidden')
}

function showMain() {
  authScreen.classList.add('hidden')
  mainScreen.classList.remove('hidden')
}

function getStoredKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY_API, (result) => {
      resolve(result[STORAGE_KEY_API] || null)
    })
  })
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------

connectBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim()
  if (!key) {
    authError.textContent = 'Please enter your API key'
    authError.classList.remove('hidden')
    return
  }

  connectBtn.setAttribute('disabled', 'true')
  connectBtn.textContent = 'Connecting...'
  authError.classList.add('hidden')

  // Store and validate
  chrome.storage.sync.set({ [STORAGE_KEY_API]: key }, async () => {
    const response = await sendMessage({ type: 'GET_CREDITS' })
    if (response.success) {
      showMain()
      creditCount.textContent = String((response.data as { remaining: number }).remaining)
    } else {
      chrome.storage.sync.remove(STORAGE_KEY_API)
      authError.textContent = response.error
      authError.classList.remove('hidden')
    }
    connectBtn.removeAttribute('disabled')
    connectBtn.textContent = 'Connect'
  })
})

disconnectBtn.addEventListener('click', (e) => {
  e.preventDefault()
  chrome.storage.sync.remove(STORAGE_KEY_API)
  apiKeyInput.value = ''
  showAuth()
})

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

async function loadCredits() {
  const response = await sendMessage({ type: 'GET_CREDITS' })
  if (response.success) {
    creditCount.textContent = String((response.data as { remaining: number }).remaining)
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

searchBtn.addEventListener('click', async () => {
  const name = searchName.value.trim()
  if (!name) return

  const parts = name.split(/\s+/)
  if (parts.length < 2) {
    searchError.textContent = 'Enter first and last name'
    searchError.classList.remove('hidden')
    return
  }

  searchError.classList.add('hidden')
  results.classList.add('hidden')
  searchText.classList.add('hidden')
  searchLoading.classList.remove('hidden')
  searchBtn.setAttribute('disabled', 'true')

  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')
  const company = searchCompany.value.trim()

  const message: ExtensionMessage = {
    type: 'LOOKUP',
    data: {
      first_name: firstName,
      last_name: lastName,
      company: company || undefined,
    },
  }

  const response = await sendMessage(message)

  searchText.classList.remove('hidden')
  searchLoading.classList.add('hidden')
  searchBtn.removeAttribute('disabled')

  if (response.success) {
    currentResult = response.data as EnrichedContact
    displayResult(currentResult)
    loadCredits() // Refresh credit count
  } else {
    searchError.textContent = response.error
    searchError.classList.remove('hidden')
  }
})

function displayResult(contact: EnrichedContact) {
  resultName.textContent = `${contact.first_name} ${contact.last_name}`
  resultTitle.textContent = [contact.job_title, contact.company_name].filter(Boolean).join(' at ')

  if (contact.email) {
    resultEmail.textContent = contact.email
    resultEmailRow.classList.remove('hidden')
  } else {
    resultEmailRow.classList.add('hidden')
  }

  if (contact.phone) {
    resultPhone.textContent = contact.phone
    resultPhoneRow.classList.remove('hidden')
  } else {
    resultPhoneRow.classList.add('hidden')
  }

  if (contact.company_name) {
    resultCompany.textContent = [contact.company_name, contact.company_industry].filter(Boolean).join(' — ')
    resultCompany.parentElement!.classList.remove('hidden')
  }

  results.classList.remove('hidden')
}

// ---------------------------------------------------------------------------
// Copy buttons
// ---------------------------------------------------------------------------

copyEmailBtn.addEventListener('click', () => {
  if (currentResult?.email) {
    navigator.clipboard.writeText(currentResult.email)
    copyEmailBtn.textContent = 'Copied'
    setTimeout(() => { copyEmailBtn.textContent = 'Copy' }, 1500)
  }
})

copyPhoneBtn.addEventListener('click', () => {
  if (currentResult?.phone) {
    navigator.clipboard.writeText(currentResult.phone)
    copyPhoneBtn.textContent = 'Copied'
    setTimeout(() => { copyPhoneBtn.textContent = 'Copy' }, 1500)
  }
})

// ---------------------------------------------------------------------------
// Save lead
// ---------------------------------------------------------------------------

saveBtn.addEventListener('click', async () => {
  if (!currentResult) return
  saveBtn.textContent = 'Saving...'
  saveBtn.setAttribute('disabled', 'true')

  const response = await sendMessage({
    type: 'SAVE_LEAD',
    data: currentResult,
  })

  if (response.success) {
    const data = response.data as { duplicate: boolean }
    saveBtn.textContent = data.duplicate ? 'Already saved' : 'Saved'
    saveBtn.style.borderColor = '#10b981'
    saveBtn.style.color = '#10b981'
  } else {
    saveBtn.textContent = 'Failed'
    saveBtn.style.borderColor = '#ef4444'
    saveBtn.style.color = '#ef4444'
  }

  setTimeout(() => {
    saveBtn.textContent = 'Save to Cursive'
    saveBtn.removeAttribute('disabled')
    saveBtn.style.borderColor = '#2563eb'
    saveBtn.style.color = '#2563eb'
  }, 2000)
})

// ---------------------------------------------------------------------------
// Messaging helper
// ---------------------------------------------------------------------------

function sendMessage(message: ExtensionMessage): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message || 'Extension error' })
      } else {
        resolve(response || { success: false, error: 'No response' })
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

init()
