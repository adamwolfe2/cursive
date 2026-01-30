'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to respect user's motion preferences for accessibility.
 * Returns true if user prefers reduced motion.
 *
 * Use this to disable or simplify animations for users who have
 * enabled "Reduce Motion" in their OS settings.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion()
 *
 *   return (
 *     <motion.div
 *       animate={prefersReducedMotion ? {} : { scale: 1.2 }}
 *     >
 *       Content
 *     </motion.div>
 *   )
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

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
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener)
      return () => mediaQuery.removeListener(listener)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Get animation props that respect reduced motion preference.
 * Returns empty object if user prefers reduced motion.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const animation = useAnimationProps({
 *     initial: { opacity: 0 },
 *     animate: { opacity: 1 }
 *   })
 *
 *   return <motion.div {...animation}>Content</motion.div>
 * }
 * ```
 */
export function useAnimationProps<T extends Record<string, any>>(
  props: T
): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion()
  return prefersReducedMotion ? {} : props
}

/**
 * Alias for useReducedMotion that returns inverted boolean.
 * Returns true if animations are safe to use (reduced motion is OFF).
 *
 * @example
 * ```tsx
 * function Component() {
 *   const shouldAnimate = useSafeAnimation()
 *
 *   return (
 *     <motion.div
 *       animate={shouldAnimate ? { scale: 1.2 } : {}}
 *     >
 *       Content
 *     </motion.div>
 *   )
 * }
 * ```
 */
export function useSafeAnimation(): boolean {
  const prefersReducedMotion = useReducedMotion()
  return !prefersReducedMotion
}
