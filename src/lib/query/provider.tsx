'use client'

/**
 * React Query Provider with Optimized Configurations
 * OpenInfo Platform
 *
 * Provides centralized data fetching, caching, and state management.
 */

import * as React from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'

// ============================================
// QUERY CONFIGURATION
// ============================================

const STALE_TIME = 1000 * 60 * 5 // 5 minutes
const GC_TIME = 1000 * 60 * 30 // 30 minutes (formerly cacheTime)

interface QueryProviderProps {
  children: React.ReactNode
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log errors for monitoring (except for expected 404s)
        if (process.env.NODE_ENV === 'development') {
          console.error(`Query error for ${query.queryKey}:`, error)
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        // Log mutation errors for monitoring
        if (process.env.NODE_ENV === 'development') {
          console.error('Mutation error:', error)
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: STALE_TIME,
        // Garbage collection time - how long to keep inactive data
        gcTime: GC_TIME,
        // Retry failed queries
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus for most queries
        refetchOnWindowFocus: false,
        // Don't refetch on mount if data is fresh
        refetchOnMount: true,
        // Don't refetch on reconnect
        refetchOnReconnect: 'always',
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
        retryDelay: 1000,
      },
    },
  })
}

// For client-side only, reuse the same QueryClient
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may suspend
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// ============================================
// QUERY KEY FACTORIES
// ============================================

/**
 * Centralized query key factories for consistency and type-safety
 */
export const queryKeys = {
  // User queries
  user: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    profile: () => ['users', 'profile'] as const,
  },

  // Workspace queries
  workspace: {
    all: ['workspaces'] as const,
    detail: (id: string) => ['workspaces', id] as const,
    members: (workspaceId: string) => ['workspaces', workspaceId, 'members'] as const,
  },

  // Query (search) queries
  queries: {
    all: ['queries'] as const,
    lists: () => ['queries', 'list'] as const,
    list: (workspaceId: string, filters?: Record<string, unknown>) =>
      ['queries', 'list', workspaceId, filters] as const,
    detail: (id: string) => ['queries', 'detail', id] as const,
    results: (queryId: string, page?: number) =>
      ['queries', 'results', queryId, page] as const,
  },

  // Lead queries
  leads: {
    all: ['leads'] as const,
    lists: () => ['leads', 'list'] as const,
    list: (workspaceId: string, filters?: Record<string, unknown>) =>
      ['leads', 'list', workspaceId, filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    stats: (workspaceId: string) => ['leads', 'stats', workspaceId] as const,
  },

  // People search queries
  peopleSearch: {
    all: ['people-search'] as const,
    search: (params: Record<string, unknown>) =>
      ['people-search', 'search', params] as const,
    detail: (id: string) => ['people-search', 'detail', id] as const,
  },

  // Integration queries
  integrations: {
    all: ['integrations'] as const,
    list: (workspaceId: string) => ['integrations', 'list', workspaceId] as const,
    detail: (type: string) => ['integrations', 'detail', type] as const,
  },

  // Trends queries
  trends: {
    all: ['trends'] as const,
    list: (workspaceId: string, timeRange?: string) =>
      ['trends', 'list', workspaceId, timeRange] as const,
  },

  // Settings queries
  settings: {
    all: ['settings'] as const,
    notifications: () => ['settings', 'notifications'] as const,
    billing: () => ['settings', 'billing'] as const,
    security: () => ['settings', 'security'] as const,
  },
}

// ============================================
// QUERY UTILITIES
// ============================================

/**
 * Create optimistic update helper
 */
export function createOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (old: TData, variables: TVariables) => TData
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, (old) => {
          if (old) {
            return updater(old, variables)
          }
          return old
        })
      }

      return { previousData }
    },
    onError: (_err: unknown, _variables: TVariables, context?: { previousData?: TData }) => {
      // Roll back to the previous value
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  }
}

/**
 * Prefetch helper for route transitions
 */
export async function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: STALE_TIME,
  })
}

/**
 * Invalidate all queries for a specific entity type
 */
export function invalidateEntity(
  queryClient: QueryClient,
  entityKey: readonly unknown[]
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: entityKey })
}

// Export the query client getter for use in server components
export { getQueryClient }
