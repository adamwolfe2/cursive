export {} // Module boundary
/**
 * Cursive AI — LinkedIn Profile Enrichment Content Script
 *
 * Injects into LinkedIn profile pages (/in/*) to extract contact data
 * and provide one-click lead enrichment via the Cursive platform.
 */

interface ProfileData {
  first_name: string
  last_name: string
  full_name: string
  headline: string
  company: string
  profile_url: string
}

interface EnrichmentResult {
  first_name: string
  last_name: string
  title: string
  company: string
  email: string
  email_status: 'valid' | 'catch-all' | 'invalid' | 'unknown'
  phone: string
  industry: string
  company_size: string
  revenue: string
}

interface CacheEntry {
  data: EnrichmentResult
  timestamp: number
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ---------------------------------------------------------------------------
// DOM Extraction
// ---------------------------------------------------------------------------

function extractFullName(): string {
  const selectors = [
    'h1.text-heading-xlarge',
    '.pv-top-card h1',
    '.pv-text-details__left-panel h1',
    'h1',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) {
      return el.textContent.trim()
    }
  }
  return ''
}

function extractHeadline(): string {
  const selectors = [
    '.text-body-medium.break-words',
    '.pv-top-card div.text-body-medium',
    '.pv-text-details__left-panel .text-body-medium',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) {
      return el.textContent.trim()
    }
  }
  return ''
}

function extractCompany(): string {
  const selectors = [
    'a[data-field="experience_company_logo"]',
    '.pv-entity__secondary-title',
    '.experience-group-header__company',
    '.pv-top-card--experience-list-item',
    'div[aria-label="Current company"] span',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) {
      return el.textContent.trim()
    }
  }

  // Fallback: parse headline for " at Company" pattern
  const headline = extractHeadline()
  const atMatch = headline.match(/\bat\s+(.+)$/i)
  if (atMatch) {
    return atMatch[1].trim()
  }

  return ''
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first_name: '', last_name: '' }
  if (parts.length === 1) return { first_name: parts[0], last_name: '' }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  }
}

function extractProfileData(): ProfileData {
  const fullName = extractFullName()
  const { first_name, last_name } = splitName(fullName)

  return {
    first_name,
    last_name,
    full_name: fullName,
    headline: extractHeadline(),
    company: extractCompany(),
    profile_url: window.location.href,
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

function getCacheKey(): string {
  const path = window.location.pathname.replace(/\/$/, '')
  return `cursive_linkedin_${path}`
}

async function getCachedResult(): Promise<EnrichmentResult | null> {
  return new Promise((resolve) => {
    const key = getCacheKey()
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as CacheEntry | undefined
      if (!entry) {
        resolve(null)
        return
      }
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        chrome.storage.local.remove(key)
        resolve(null)
        return
      }
      resolve(entry.data)
    })
  })
}

async function setCachedResult(data: EnrichmentResult): Promise<void> {
  return new Promise((resolve) => {
    const key = getCacheKey()
    const entry: CacheEntry = { data, timestamp: Date.now() }
    chrome.storage.local.set({ [key]: entry }, resolve)
  })
}

// ---------------------------------------------------------------------------
// UI — Floating Button
// ---------------------------------------------------------------------------

function injectEnrichButton(): void {
  if (document.querySelector('.cursive-enrich-btn')) return

  const btn = document.createElement('button')
  btn.className = 'cursive-enrich-btn'
  btn.textContent = 'Enrich with Cursive'
  btn.addEventListener('click', handleEnrichClick)
  document.body.appendChild(btn)
}

function removeEnrichButton(): void {
  const btn = document.querySelector('.cursive-enrich-btn')
  if (btn) btn.remove()
}

// ---------------------------------------------------------------------------
// UI — Sidebar Overlay
// ---------------------------------------------------------------------------

function createSidebar(data: EnrichmentResult): HTMLElement {
  removeSidebar()

  const sidebar = document.createElement('div')
  sidebar.className = 'cursive-sidebar'

  const statusColor = getStatusColor(data.email_status)
  const statusLabel = getStatusLabel(data.email_status)

  sidebar.innerHTML = `
    <div class="cursive-sidebar-header">
      <span class="cursive-sidebar-title">Cursive Enrichment</span>
      <button class="cursive-close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="cursive-sidebar-body">
      <div class="cursive-profile-section">
        <div class="cursive-profile-name">${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}</div>
        <div class="cursive-profile-title">${escapeHtml(data.title)}</div>
        <div class="cursive-profile-company">${escapeHtml(data.company)}</div>
      </div>

      <div class="cursive-divider"></div>

      <div class="cursive-section-label">Contact</div>
      ${createFieldRow('Email', data.email, statusColor, statusLabel)}
      ${createFieldRow('Phone', data.phone)}

      <div class="cursive-divider"></div>

      <div class="cursive-section-label">Company</div>
      ${createReadonlyRow('Industry', data.industry)}
      ${createReadonlyRow('Size', data.company_size)}
      ${createReadonlyRow('Revenue', data.revenue)}

      <button class="cursive-save-btn">Save to Cursive</button>
    </div>
  `

  const closeBtn = sidebar.querySelector('.cursive-close-btn') as HTMLElement
  closeBtn.addEventListener('click', removeSidebar)

  const saveBtn = sidebar.querySelector('.cursive-save-btn') as HTMLElement
  saveBtn.addEventListener('click', () => handleSave(data))

  // Copy button listeners
  sidebar.querySelectorAll('.cursive-copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const value = target.getAttribute('data-copy') || ''
      copyToClipboard(value, target)
    })
  })

  document.body.appendChild(sidebar)
  return sidebar
}

function removeSidebar(): void {
  const existing = document.querySelector('.cursive-sidebar')
  if (existing) existing.remove()
}

function createFieldRow(
  label: string,
  value: string,
  badgeColor?: string,
  badgeLabel?: string
): string {
  if (!value) {
    return `
      <div class="cursive-field">
        <div class="cursive-field-label">${escapeHtml(label)}</div>
        <div class="cursive-field-value cursive-field-empty">Not found</div>
      </div>
    `
  }

  const badge = badgeColor
    ? `<span class="cursive-badge" style="background:${badgeColor}" title="${escapeHtml(badgeLabel || '')}"></span>`
    : ''

  return `
    <div class="cursive-field">
      <div class="cursive-field-label">${escapeHtml(label)} ${badge}</div>
      <div class="cursive-field-value">
        <span>${escapeHtml(value)}</span>
        <button class="cursive-copy-btn" data-copy="${escapeHtml(value)}" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

function createReadonlyRow(label: string, value: string): string {
  return `
    <div class="cursive-field">
      <div class="cursive-field-label">${escapeHtml(label)}</div>
      <div class="cursive-field-value">${value ? escapeHtml(value) : '<span class="cursive-field-empty">Unknown</span>'}</div>
    </div>
  `
}

// ---------------------------------------------------------------------------
// UI — Loading State
// ---------------------------------------------------------------------------

function showLoading(): void {
  removeSidebar()

  const sidebar = document.createElement('div')
  sidebar.className = 'cursive-sidebar'
  sidebar.innerHTML = `
    <div class="cursive-sidebar-header">
      <span class="cursive-sidebar-title">Cursive Enrichment</span>
      <button class="cursive-close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="cursive-sidebar-body cursive-loading">
      <div class="cursive-spinner"></div>
      <div class="cursive-loading-text">Enriching profile...</div>
    </div>
  `

  const closeBtn = sidebar.querySelector('.cursive-close-btn') as HTMLElement
  closeBtn.addEventListener('click', removeSidebar)

  document.body.appendChild(sidebar)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    valid: '#22c55e',
    'catch-all': '#eab308',
    invalid: '#ef4444',
    unknown: '#9ca3af',
  }
  return map[status] || map.unknown
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    valid: 'Verified',
    'catch-all': 'Catch-all',
    invalid: 'Invalid',
    unknown: 'Unknown',
  }
  return map[status] || 'Unknown'
}

function copyToClipboard(text: string, trigger: HTMLElement): void {
  navigator.clipboard.writeText(text).then(() => {
    const original = trigger.innerHTML
    trigger.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `
    setTimeout(() => {
      trigger.innerHTML = original
    }, 1500)
  })
}

// ---------------------------------------------------------------------------
// Message Handlers
// ---------------------------------------------------------------------------

async function handleEnrichClick(): Promise<void> {
  const cached = await getCachedResult()
  if (cached) {
    createSidebar(cached)
    return
  }

  showLoading()

  const profile = extractProfileData()

  chrome.runtime.sendMessage(
    {
      type: 'LOOKUP',
      data: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        company: profile.company,
      },
    },
    async (response) => {
      if (chrome.runtime.lastError) {
        removeSidebar()
        showError('Connection to Cursive failed. Please try again.')
        return
      }

      if (response?.error) {
        removeSidebar()
        showError(response.error)
        return
      }

      if (response?.data) {
        const enriched = response.data as EnrichmentResult
        await setCachedResult(enriched)
        createSidebar(enriched)
      }
    }
  )
}

function handleSave(data: EnrichmentResult): void {
  const saveBtn = document.querySelector('.cursive-save-btn') as HTMLElement | null
  if (saveBtn) {
    saveBtn.textContent = 'Saving...'
    saveBtn.setAttribute('disabled', 'true')
  }

  const profile = extractProfileData()

  chrome.runtime.sendMessage(
    {
      type: 'SAVE_LEAD',
      data: {
        ...data,
        linkedin_url: profile.profile_url,
        headline: profile.headline,
      },
    },
    (response) => {
      if (chrome.runtime.lastError || response?.error) {
        if (saveBtn) {
          saveBtn.textContent = 'Save Failed — Retry'
          saveBtn.removeAttribute('disabled')
        }
        return
      }

      if (saveBtn) {
        saveBtn.textContent = 'Saved!'
        saveBtn.classList.add('cursive-save-btn--success')
      }
    }
  )
}

function showError(message: string): void {
  removeSidebar()

  const sidebar = document.createElement('div')
  sidebar.className = 'cursive-sidebar'
  sidebar.innerHTML = `
    <div class="cursive-sidebar-header">
      <span class="cursive-sidebar-title">Cursive Enrichment</span>
      <button class="cursive-close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="cursive-sidebar-body cursive-error">
      <div class="cursive-error-icon">!</div>
      <div class="cursive-error-text">${escapeHtml(message)}</div>
      <button class="cursive-retry-btn">Try Again</button>
    </div>
  `

  const closeBtn = sidebar.querySelector('.cursive-close-btn') as HTMLElement
  closeBtn.addEventListener('click', removeSidebar)

  const retryBtn = sidebar.querySelector('.cursive-retry-btn') as HTMLElement
  retryBtn.addEventListener('click', handleEnrichClick)

  document.body.appendChild(sidebar)
}

// ---------------------------------------------------------------------------
// SPA Navigation Detection
// ---------------------------------------------------------------------------

function isProfilePage(): boolean {
  return /^\/in\/[^/]+/.test(window.location.pathname)
}

function handlePageChange(): void {
  if (isProfilePage()) {
    // Small delay to let LinkedIn render the profile DOM
    setTimeout(injectEnrichButton, 800)
  } else {
    removeEnrichButton()
    removeSidebar()
  }
}

function observeNavigation(): void {
  let lastUrl = window.location.href

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      handlePageChange()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Also listen for popstate (back/forward)
  window.addEventListener('popstate', handlePageChange)
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function init(): void {
  handlePageChange()
  observeNavigation()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
