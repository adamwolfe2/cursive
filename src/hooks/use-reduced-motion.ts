'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect user's motion preference for accessibility
 * Returns true if user prefers reduced motion
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion()
 *
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
 * />
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return
    }

    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
    // Legacy browsers (Safari < 14)
    else {
      // @ts-ignore - legacy API
      mediaQuery.addListener(listener)
      // @ts-ignore - legacy API
      return () => mediaQuery.removeListener(listener)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Hook that provides safe animation props based on motion preference
 * Returns animation config that respects user's motion preference
 *
 * Usage:
 * ```tsx
 * const animation = useSafeAnimation({
 *   y: [0, -10, 0],
 *   transition: { duration: 0.5 }
 * })
 *
 * <motion.div animate={animation} />
 * ```
 */
export function useSafeAnimation(
  animationProps: Record<string, any>
): Record<string, any> {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    // Return minimal animation config
    return {
      transition: { duration: 0.01 }
    }
  }

  return animationProps
}

/**
 * Hook that conditionally returns animation variants
 * Returns null if user prefers reduced motion
 *
 * Usage:
 * ```tsx
 * const variants = useAnimationVariants({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 }
 * })
 *
 * <motion.div variants={variants} />
 * ```
 */
export function useAnimationVariants(
  variants: Record<string, any>
): Record<string, any> | null {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return null
  }

  return variants
}
