/**
 * Performance-Optimized React Hooks
 * OpenInfo Platform
 *
 * A collection of reusable hooks for performance, state management, and UX.
 */

'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

// Re-export existing hooks
export { useDebounce } from './use-debounce'

// ============================================
// PERFORMANCE HOOKS
// ============================================

/**
 * Throttle a value - only updates at most once per interval
 */
export function useThrottle<T>(value: T, interval = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdated = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdated.current

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now
      setThrottledValue(value)
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottledValue(value)
      }, interval - timeSinceLastUpdate)

      return () => clearTimeout(timeoutId)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * Get the previous value of a state/prop
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

/**
 * Check if component is mounted (avoid setting state on unmounted components)
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return useCallback(() => isMountedRef.current, [])
}

/**
 * Stable callback that always has the latest closure but stable reference
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  )
}

/**
 * Update state only if component is mounted
 */
export function useSafeState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void] {
  const isMounted = useIsMounted()
  const [state, setState] = useState(initialState)

  const setSafeState = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (isMounted()) {
        setState(value)
      }
    },
    [isMounted]
  )

  return [state, setSafeState]
}

// ============================================
// INTERSECTION OBSERVER HOOKS
// ============================================

interface IntersectionOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

/**
 * Observe element intersection for lazy loading and infinite scroll
 */
export function useIntersection(
  options: IntersectionOptions = {}
): [React.RefCallback<Element>, boolean] {
  const { root = null, rootMargin = '0px', threshold = 0, once = false } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<Element | null>(null)

  const ref = useCallback(
    (element: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      if (element) {
        elementRef.current = element
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            setIsIntersecting(entry.isIntersecting)
            if (entry.isIntersecting && once && observerRef.current) {
              observerRef.current.disconnect()
            }
          },
          { root, rootMargin, threshold }
        )
        observerRef.current.observe(element)
      }
    },
    [root, rootMargin, threshold, once]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return [ref, isIntersecting]
}

/**
 * Lazy load component when it enters viewport
 */
export function useLazyLoad(options: IntersectionOptions = {}): [React.RefCallback<Element>, boolean] {
  return useIntersection({ ...options, once: true })
}

// ============================================
// RESIZE OBSERVER HOOKS
// ============================================

interface Size {
  width: number
  height: number
}

/**
 * Observe element size changes
 */
export function useResizeObserver<T extends HTMLElement>(): [
  React.RefObject<T>,
  Size
] {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

// ============================================
// LOCAL STORAGE HOOKS
// ============================================

/**
 * Persist state to localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

// ============================================
// MEDIA QUERY HOOKS
// ============================================

/**
 * Match a media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Common breakpoint hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

// ============================================
// KEYBOARD HOOKS
// ============================================

type KeyboardHandler = (event: KeyboardEvent) => void

/**
 * Listen for keyboard shortcuts
 */
export function useKeyboard(
  key: string,
  handler: KeyboardHandler,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean; enabled?: boolean } = {}
): void {
  const { ctrl = false, shift = false, alt = false, meta = false, enabled = true } = options
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const listener = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta
      ) {
        handlerRef.current(event)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [key, ctrl, shift, alt, meta, enabled])
}

/**
 * Listen for Escape key
 */
export function useEscapeKey(handler: KeyboardHandler, enabled = true): void {
  useKeyboard('Escape', handler, { enabled })
}

// ============================================
// ASYNC HOOKS
// ============================================

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Handle async operations with loading and error states
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  immediate = false
): AsyncState<T> & { execute: (...args: Args) => Promise<T | null> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const isMounted = useIsMounted()

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const result = await asyncFn(...args)
        if (isMounted()) {
          setState({ data: result, loading: false, error: null })
        }
        return result
      } catch (error) {
        if (isMounted()) {
          setState({ data: null, loading: false, error: error as Error })
        }
        return null
      }
    },
    [asyncFn, isMounted]
  )

  return { ...state, execute }
}

// ============================================
// CLICK OUTSIDE HOOK
// ============================================

/**
 * Detect clicks outside of an element
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled = true
): React.RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current
      if (!element || element.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler, enabled])

  return ref
}

// ============================================
// COPY TO CLIPBOARD HOOK
// ============================================

interface CopyState {
  copied: boolean
  error: Error | null
}

/**
 * Copy text to clipboard
 */
export function useCopyToClipboard(): [CopyState, (text: string) => Promise<boolean>] {
  const [state, setState] = useState<CopyState>({ copied: false, error: null })

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      setState({ copied: true, error: null })
      setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000)
      return true
    } catch (error) {
      setState({ copied: false, error: error as Error })
      return false
    }
  }, [])

  return [state, copy]
}

// ============================================
// TOGGLE HOOK
// ============================================

/**
 * Simple boolean toggle state
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue((v) => !v), [])
  return [value, toggle, setValue]
}

// ============================================
// INTERVAL HOOK
// ============================================

/**
 * Run a callback at an interval
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// ============================================
// TIMEOUT HOOK
// ============================================

/**
 * Execute callback after a timeout
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setTimeout(() => savedCallback.current(), delay)
    return () => clearTimeout(id)
  }, [delay])
}

// ============================================
// DOCUMENT TITLE HOOK
// ============================================

/**
 * Update document title
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title
    return () => {
      document.title = previousTitle
    }
  }, [title])
}

// ============================================
// FOCUS RETURN HOOK
// ============================================

/**
 * Store and restore focus (for modals)
 */
export function useFocusReturn(): {
  storeFocus: () => void
  returnFocus: () => void
} {
  const focusedElement = useRef<HTMLElement | null>(null)

  const storeFocus = useCallback(() => {
    focusedElement.current = document.activeElement as HTMLElement
  }, [])

  const returnFocus = useCallback(() => {
    if (focusedElement.current && focusedElement.current.focus) {
      focusedElement.current.focus()
    }
  }, [])

  return { storeFocus, returnFocus }
}

// ============================================
// MEMOIZATION UTILITIES
// ============================================

/**
 * Deep compare memo - only re-render when deep equality fails
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>()

  if (!ref.current || !deepEqual(deps, ref.current.deps)) {
    ref.current = { deps, value: factory() }
  }

  return ref.current.value
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object' || a === null || b === null) return false

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }

  return true
}
