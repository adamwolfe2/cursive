'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { retry, RetryOptions } from '@/lib/utils/retry'

export interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retry?: boolean | RetryOptions
}

export interface UseAsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
  retryCount: number
}

export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    loading: false,
    retryCount: 0,
  })

  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: Args) => {
      if (!isMountedRef.current) return

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }))

      try {
        let result: T

        // Use retry if enabled
        if (options.retry) {
          const retryOptions =
            typeof options.retry === 'boolean' ? {} : options.retry

          result = await retry(
            () => asyncFunction(...args),
            {
              ...retryOptions,
              onRetry: (attempt, error) => {
                if (isMountedRef.current) {
                  setState((prev) => ({ ...prev, retryCount: attempt }))
                }
                retryOptions.onRetry?.(attempt, error)
              },
            }
          )
        } else {
          result = await asyncFunction(...args)
        }

        if (isMountedRef.current) {
          setState({
            data: result,
            error: null,
            loading: false,
            retryCount: 0,
          })
          options.onSuccess?.(result)
        }

        return result
      } catch (error) {
        const err = error as Error

        if (isMountedRef.current) {
          setState({
            data: null,
            error: err,
            loading: false,
            retryCount: 0,
          })
          options.onError?.(err)
        }

        throw err
      }
    },
    [asyncFunction, options]
  )

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({
        data: null,
        error: null,
        loading: false,
        retryCount: 0,
      })
    }
  }, [])

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && !!state.data,
    isError: !state.loading && !!state.error,
  }
}
