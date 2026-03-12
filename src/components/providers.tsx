'use client'

/**
 * Application Providers
 * Cursive Platform
 *
 * Combines all providers needed for the application in the correct order.
 */

import { ReactNode, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ErrorBoundary } from './error-boundary'
import { initGlobalErrorHandler } from '@/lib/utils/global-error-handler'
import { ToastProvider } from '@/lib/contexts/toast-context'
import { PostHogProvider } from './providers/posthog-provider'

// Redirect to login when any query/mutation returns 401 (expired JWT)
function handle401(error: unknown) {
  if (typeof window === 'undefined') return
  const status = (error as any)?.status ?? (error as any)?.statusCode
  if (status === 401) {
    window.location.href = '/login'
  }
}

// Create a client
function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handle401 }),
    mutationCache: new MutationCache({ onError: handle401 }),
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false, // Don't retry mutations by default
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => getQueryClient())

  // Initialize global error handler
  useEffect(() => {
    initGlobalErrorHandler()
  }, [])

  return (
    <ErrorBoundary>
      <PostHogProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </ErrorBoundary>
  )
}

/**
 * Dashboard-specific providers
 * Use this for authenticated dashboard routes
 */
export function DashboardProviders({ children }: ProvidersProps) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}
