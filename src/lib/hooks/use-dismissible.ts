'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for banners that can be dismissed with a cooldown period.
 * Stores dismissal timestamp in localStorage and reappears after cooldownHours.
 * Starts hidden (dismissed=true) to prevent flash of content before hydration.
 */
export function useDismissible(key: string, cooldownHours = 24) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(key)
    if (stored) {
      const dismissedAt = parseInt(stored, 10)
      const hoursElapsed = (Date.now() - dismissedAt) / (1000 * 60 * 60)
      setDismissed(hoursElapsed < cooldownHours)
    } else {
      setDismissed(false)
    }
  }, [key, cooldownHours])

  const dismiss = useCallback(() => {
    localStorage.setItem(key, Date.now().toString())
    setDismissed(true)
  }, [key])

  return { dismissed, dismiss } as const
}
