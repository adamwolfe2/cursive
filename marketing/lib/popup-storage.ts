/**
 * Popup Storage Utilities
 * Handles localStorage/sessionStorage for popup state persistence
 */

import { PopupState } from './popup-types'

const STORAGE_PREFIX = 'cursive_popup_'
const SESSION_KEY = 'cursive_session_start'

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Get popup state from localStorage
 */
export function getPopupState(popupId: string): PopupState | null {
  if (!isBrowser()) return null

  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${popupId}`)
    if (!stored) return null
    return JSON.parse(stored) as PopupState
  } catch (error) {
    console.error('Error reading popup state:', error)
    return null
  }
}

/**
 * Save popup state to localStorage
 */
export function savePopupState(popupId: string, state: PopupState): void {
  if (!isBrowser()) return

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${popupId}`, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving popup state:', error)
  }
}

/**
 * Check if popup should be shown based on frequency rules
 */
export function shouldShowPopup(
  popupId: string,
  cooldownDays: number = 7,
  maxShowsPerSession: number = 1
): boolean {
  if (!isBrowser()) return false

  const state = getPopupState(popupId)
  if (!state) return true // Never shown before

  const now = Date.now()
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000

  // Check if dismissed within cooldown period
  if (state.lastDismissedAt && now - state.lastDismissedAt < cooldownMs) {
    return false
  }

  // Check session shows
  if (isCurrentSession() && state.showCount >= maxShowsPerSession) {
    return false
  }

  return true
}

/**
 * Mark popup as shown
 */
export function markPopupShown(popupId: string): void {
  if (!isBrowser()) return

  const state = getPopupState(popupId) || {
    isOpen: false,
    hasBeenShown: false,
    lastShownAt: null,
    lastDismissedAt: null,
    showCount: 0,
  }

  const updatedState: PopupState = {
    ...state,
    isOpen: true,
    hasBeenShown: true,
    lastShownAt: Date.now(),
    showCount: isCurrentSession() ? state.showCount + 1 : 1,
  }

  savePopupState(popupId, updatedState)
  resetSessionIfNeeded()
}

/**
 * Mark popup as dismissed
 */
export function markPopupDismissed(popupId: string): void {
  if (!isBrowser()) return

  const state = getPopupState(popupId)
  if (!state) return

  const updatedState: PopupState = {
    ...state,
    isOpen: false,
    lastDismissedAt: Date.now(),
  }

  savePopupState(popupId, updatedState)
}

/**
 * Check if we're in the same session
 */
function isCurrentSession(): boolean {
  if (!isBrowser()) return false

  const sessionStart = sessionStorage.getItem(SESSION_KEY)
  return !!sessionStart
}

/**
 * Reset session tracking if needed (new session)
 */
function resetSessionIfNeeded(): void {
  if (!isBrowser()) return

  const sessionStart = sessionStorage.getItem(SESSION_KEY)
  if (!sessionStart) {
    sessionStorage.setItem(SESSION_KEY, Date.now().toString())
  }
}

/**
 * Clear all popup data (for testing)
 */
export function clearPopupData(popupId?: string): void {
  if (!isBrowser()) return

  if (popupId) {
    localStorage.removeItem(`${STORAGE_PREFIX}${popupId}`)
  } else {
    // Clear all popup data
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}
