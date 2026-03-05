'use client'

/**
 * AffiliateRefCapture
 *
 * Mounts on marketing/landing page layouts.
 * On mount, reads ?ref= from the URL and writes it into localStorage
 * and sessionStorage for durable, cross-tab attribution.
 * First-touch only: never overwrites an already-stored ref code.
 *
 * Also syncs the cursive_ref cookie → localStorage as a fallback
 * so that downstream helpers always prefer the most-available source.
 */

import { useEffect } from 'react'

const STORAGE_KEY = 'cursive_ref'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

interface StoredRef {
  code: string
  ts: number // epoch ms
}

/**
 * Read the stored ref code from localStorage → sessionStorage → cookie.
 * Validates the 30-day TTL on localStorage entries.
 * Safe to call on the server (returns null when window is unavailable).
 */
export function getStoredRefCode(): string | null {
  if (typeof window === 'undefined') return null

  // 1. localStorage (durable, 30-day TTL)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: StoredRef = JSON.parse(raw)
      if (parsed.code && Date.now() - parsed.ts < TTL_MS) {
        return parsed.code
      }
      // Expired — remove
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignore parse/access errors
  }

  // 2. sessionStorage (tab-scoped fallback)
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: StoredRef = JSON.parse(raw)
      if (parsed.code) return parsed.code
    }
  } catch {
    // Ignore
  }

  // 3. Cookie (server-set, no TTL validation needed here)
  const match = document.cookie.match(/(?:^|;\s*)cursive_ref=([^;]+)/)
  if (match) return decodeURIComponent(match[1])

  return null
}

function writeRef(code: string): void {
  const entry: StoredRef = { code, ts: Date.now() }
  const value = JSON.stringify(entry)
  try { localStorage.setItem(STORAGE_KEY, value) } catch { /* private browsing */ }
  try { sessionStorage.setItem(STORAGE_KEY, value) } catch { /* private browsing */ }
}

export function AffiliateRefCapture() {
  useEffect(() => {
    // 1. Read ?ref= from URL
    const params = new URLSearchParams(window.location.search)
    const urlRef = params.get('ref')?.trim().toUpperCase() || null

    // 2. First-touch: only write if nothing is already stored
    const existing = getStoredRefCode()

    if (urlRef && !existing) {
      writeRef(urlRef)
      return
    }

    // 3. If no URL ref, sync cookie → localStorage if localStorage is empty
    if (!existing) {
      const match = document.cookie.match(/(?:^|;\s*)cursive_ref=([^;]+)/)
      if (match) {
        writeRef(decodeURIComponent(match[1]))
      }
    }
  }, [])

  return null
}
