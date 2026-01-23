/**
 * Test Rendering Utilities
 * OpenInfo Platform
 *
 * Custom render function that wraps components with necessary providers.
 */

import * as React from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/toast'
import userEvent from '@testing-library/user-event'

// ============================================
// QUERY CLIENT FOR TESTS
// ============================================

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// ============================================
// ALL PROVIDERS WRAPPER
// ============================================

interface AllProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient ?? createTestQueryClient()

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}

// ============================================
// CUSTOM RENDER
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { queryClient, ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  )

  const user = userEvent.setup()

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    user,
  }
}

// ============================================
// RENDER WITH QUERY CLIENT
// ============================================

/**
 * Render with a specific query client (for testing query states)
 */
export function renderWithQueryClient(
  ui: React.ReactElement,
  client: QueryClient,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// ============================================
// RENDER HOOK UTILITY
// ============================================

interface RenderHookResult<T> {
  result: { current: T }
  rerender: (newProps?: Record<string, unknown>) => void
  unmount: () => void
}

/**
 * Render a hook with providers
 */
export function renderHook<T>(
  hook: () => T,
  options: { queryClient?: QueryClient } = {}
): RenderHookResult<T> {
  const result: { current: T } = { current: undefined as unknown as T }

  function TestComponent() {
    result.current = hook()
    return null
  }

  const { rerender, unmount } = customRender(<TestComponent />, {
    queryClient: options.queryClient,
  })

  return {
    result,
    rerender: () => rerender(<TestComponent />),
    unmount,
  }
}

// ============================================
// RE-EXPORTS
// ============================================

export * from '@testing-library/react'
export { userEvent }
export { customRender as render }
