/**
 * Scroll Depth Hook
 * Tracks scroll depth percentage and triggers at specified thresholds
 */

import { useEffect, useState, useCallback } from 'react'

interface ScrollDepthOptions {
  enabled?: boolean
  threshold?: number // percentage (0-100)
  onThresholdReached?: () => void
}

export function useScrollDepth({
  enabled = true,
  threshold = 50,
  onThresholdReached,
}: ScrollDepthOptions = {}) {
  const [scrollDepth, setScrollDepth] = useState(0)
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false)

  const calculateScrollDepth = useCallback(() => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY

    // Calculate percentage scrolled
    const totalScrollable = documentHeight - windowHeight
    const currentScroll = scrollTop
    const percentage = (currentScroll / totalScrollable) * 100

    return Math.min(Math.round(percentage), 100)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      const depth = calculateScrollDepth()
      setScrollDepth(depth)

      // Trigger callback when threshold is reached
      if (depth >= threshold && !hasReachedThreshold) {
        setHasReachedThreshold(true)
        onThresholdReached?.()
      }
    }

    // Initial calculation
    handleScroll()

    // Listen for scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [enabled, threshold, hasReachedThreshold, calculateScrollDepth, onThresholdReached])

  return {
    scrollDepth,
    hasReachedThreshold,
    reset: () => setHasReachedThreshold(false),
  }
}
