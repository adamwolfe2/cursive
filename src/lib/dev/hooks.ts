/**
 * Development React Hooks
 * OpenInfo Platform
 *
 * React hooks for debugging and development.
 */

'use client'

import * as React from 'react'
import { logger } from './logger'

// ============================================
// RENDER TRACKING
// ============================================

/**
 * Track component render count
 * @example
 * const renderCount = useRenderCount('MyComponent')
 */
export function useRenderCount(componentName?: string): number {
  const renderCount = React.useRef(0)
  renderCount.current++

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && componentName) {
      logger.debug(`Render #${renderCount.current}: ${componentName}`)
    }
  })

  return renderCount.current
}

/**
 * Track why a component re-rendered
 * @example
 * useWhyDidYouRender('MyComponent', { prop1, prop2, state1 })
 */
export function useWhyDidYouRender(
  componentName: string,
  props: Record<string, unknown>
): void {
  const prevProps = React.useRef<Record<string, unknown>>({})

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const changes: Record<string, { from: unknown; to: unknown }> = {}

    for (const [key, value] of Object.entries(props)) {
      if (prevProps.current[key] !== value) {
        changes[key] = {
          from: prevProps.current[key],
          to: value,
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      console.log(`[WHY UPDATE] ${componentName}:`, changes)
    }

    prevProps.current = { ...props }
  })
}

/**
 * Log component lifecycle events
 * @example
 * useLifecycleLogger('MyComponent')
 */
export function useLifecycleLogger(componentName: string): void {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    logger.debug(`[MOUNT] ${componentName}`)

    return () => {
      logger.debug(`[UNMOUNT] ${componentName}`)
    }
  }, [componentName])
}

// ============================================
// VALUE TRACKING
// ============================================

/**
 * Track value changes over time
 * @example
 * const history = useValueHistory(count, 5)
 */
export function useValueHistory<T>(value: T, maxLength: number = 10): T[] {
  const historyRef = React.useRef<T[]>([])

  React.useEffect(() => {
    historyRef.current = [...historyRef.current, value].slice(-maxLength)
  }, [value, maxLength])

  return historyRef.current
}

/**
 * Log value changes in development
 * @example
 * useValueLogger('count', count)
 */
export function useValueLogger<T>(name: string, value: T): void {
  const prevValue = React.useRef<T>(value)

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    if (prevValue.current !== value) {
      console.log(`[VALUE CHANGE] ${name}:`, {
        from: prevValue.current,
        to: value,
      })
      prevValue.current = value
    }
  }, [name, value])
}

/**
 * Get the previous value of a variable
 * @example
 * const prevCount = usePreviousValue(count)
 */
export function usePreviousValue<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined)

  React.useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

// ============================================
// PERFORMANCE TRACKING
// ============================================

/**
 * Track render performance
 * @example
 * const { duration } = useRenderPerformance('MyComponent')
 */
export function useRenderPerformance(componentName: string): { duration: number } {
  const startTime = React.useRef(performance.now())
  const [duration, setDuration] = React.useState(0)

  React.useLayoutEffect(() => {
    const renderDuration = performance.now() - startTime.current

    if (process.env.NODE_ENV === 'development') {
      if (renderDuration > 16) {
        // More than one frame (60fps)
        console.warn(`[SLOW RENDER] ${componentName}: ${renderDuration.toFixed(2)}ms`)
      } else {
        logger.debug(`[RENDER TIME] ${componentName}: ${renderDuration.toFixed(2)}ms`)
      }
    }

    setDuration(renderDuration)
    startTime.current = performance.now()
  })

  return { duration }
}

/**
 * Track callback execution time
 * @example
 * const handleClick = useTimedCallback('handleClick', () => {...})
 */
export function useTimedCallback<T extends (...args: unknown[]) => unknown>(
  name: string,
  callback: T
): T {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback

  return React.useCallback(
    ((...args: Parameters<T>) => {
      const start = performance.now()
      const result = callbackRef.current(...args)

      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          if (process.env.NODE_ENV === 'development') {
            logger.debug(`[CALLBACK] ${name}: ${duration.toFixed(2)}ms (async)`)
          }
        })
      }

      const duration = performance.now() - start
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[CALLBACK] ${name}: ${duration.toFixed(2)}ms`)
      }

      return result
    }) as T,
    [name]
  )
}

// ============================================
// STATE DEBUGGING
// ============================================

/**
 * useState with logging
 * @example
 * const [count, setCount] = useStateWithLog('count', 0)
 */
export function useStateWithLog<T>(
  name: string,
  initialState: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState(initialState)

  const setStateWithLog = React.useCallback(
    (newState: React.SetStateAction<T>) => {
      setState((prev) => {
        const next =
          typeof newState === 'function'
            ? (newState as (prevState: T) => T)(prev)
            : newState

        if (process.env.NODE_ENV === 'development') {
          console.log(`[STATE] ${name}:`, { from: prev, to: next })
        }

        return next
      })
    },
    [name]
  )

  return [state, setStateWithLog]
}

/**
 * useReducer with action logging
 * @example
 * const [state, dispatch] = useReducerWithLog(reducer, initialState, 'MyReducer')
 */
export function useReducerWithLog<S, A>(
  reducer: React.Reducer<S, A>,
  initialState: S,
  name: string = 'Reducer'
): [S, React.Dispatch<A>] {
  const loggingReducer = React.useCallback(
    (state: S, action: A): S => {
      const nextState = reducer(state, action)

      if (process.env.NODE_ENV === 'development') {
        console.group(`[REDUCER] ${name}`)
        console.log('Action:', action)
        console.log('Previous state:', state)
        console.log('Next state:', nextState)
        console.groupEnd()
      }

      return nextState
    },
    [reducer, name]
  )

  return React.useReducer(loggingReducer, initialState)
}

// ============================================
// EFFECT DEBUGGING
// ============================================

/**
 * useEffect with logging
 * @example
 * useEffectWithLog(
 *   () => { console.log('effect ran') },
 *   [dep1, dep2],
 *   'MyEffect'
 * )
 */
export function useEffectWithLog(
  effect: React.EffectCallback,
  deps: React.DependencyList,
  name: string
): void {
  const prevDeps = React.useRef<React.DependencyList>([])

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Find which dependencies changed
      const changedDeps = deps
        .map((dep, i) => (prevDeps.current[i] !== dep ? i : -1))
        .filter((i) => i !== -1)

      console.log(`[EFFECT] ${name} triggered`, {
        changedDeps: changedDeps.map((i) => `deps[${i}]`),
      })

      prevDeps.current = [...deps]
    }

    const cleanup = effect()

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[EFFECT CLEANUP] ${name}`)
      }
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ============================================
// NETWORK DEBUGGING
// ============================================

/**
 * Track async operation status
 * @example
 * const { loading, error, data, execute } = useAsyncDebug(fetchUsers, 'fetchUsers')
 */
export function useAsyncDebug<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  name: string
): {
  loading: boolean
  error: Error | null
  data: T | null
  execute: (...args: Args) => Promise<T>
} {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [data, setData] = React.useState<T | null>(null)

  const execute = React.useCallback(
    async (...args: Args): Promise<T> => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ASYNC START] ${name}`, { args })
      }

      setLoading(true)
      setError(null)
      const start = performance.now()

      try {
        const result = await asyncFn(...args)
        const duration = performance.now() - start

        if (process.env.NODE_ENV === 'development') {
          console.log(`[ASYNC SUCCESS] ${name}`, {
            result,
            durationMs: duration.toFixed(2),
          })
        }

        setData(result)
        return result
      } catch (err) {
        const duration = performance.now() - start

        if (process.env.NODE_ENV === 'development') {
          console.error(`[ASYNC ERROR] ${name}`, {
            error: err,
            durationMs: duration.toFixed(2),
          })
        }

        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [asyncFn, name]
  )

  return { loading, error, data, execute }
}

// ============================================
// DEBUGGING UTILITIES
// ============================================

/**
 * Force a component update (debugging only)
 */
export function useForceUpdate(): () => void {
  const [, setCount] = React.useState(0)
  return React.useCallback(() => setCount((c) => c + 1), [])
}

/**
 * Check if component is mounted
 */
export function useIsMounted(): () => boolean {
  const isMounted = React.useRef(false)

  React.useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return React.useCallback(() => isMounted.current, [])
}
