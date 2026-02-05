/**
 * Exit Intent Hook
 * Detects when user is about to leave the page
 */

import { useEffect, useState } from 'react'

interface ExitIntentOptions {
  enabled?: boolean
  threshold?: number // pixels from top before triggering
  delay?: number // minimum time on page before showing (ms)
  onExitIntent?: () => void
}

export function useExitIntent({
  enabled = true,
  threshold = 20,
  delay = 5000,
  onExitIntent,
}: ExitIntentOptions = {}) {
  const [hasTriggered, setHasTriggered] = useState(false)
  const [canTrigger, setCanTrigger] = useState(false)

  useEffect(() => {
    if (!enabled) return

    // Wait minimum time before allowing trigger
    const timer = setTimeout(() => {
      setCanTrigger(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [enabled, delay])

  useEffect(() => {
    if (!enabled || !canTrigger || hasTriggered) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if cursor moves toward top of viewport
      // This catches attempts to close tab/window or navigate to address bar
      if (e.clientY <= threshold && !hasTriggered) {
        setHasTriggered(true)
        onExitIntent?.()
      }
    }

    // Desktop: mouse leaving viewport
    document.addEventListener('mouseleave', handleMouseLeave)

    // Mobile fallback: scroll up rapidly (poor man's exit intent)
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = lastScrollY - currentScrollY

      // If user scrolls up quickly by more than 100px
      if (scrollDelta > 100 && !hasTriggered) {
        setHasTriggered(true)
        onExitIntent?.()
      }

      lastScrollY = currentScrollY
    }

    // Only use scroll detection on mobile
    if ('ontouchstart' in window) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [enabled, canTrigger, hasTriggered, threshold, onExitIntent])

  return { hasTriggered, reset: () => setHasTriggered(false) }
}
