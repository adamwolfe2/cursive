'use client'

/**
 * Application Providers
 * OpenInfo Platform
 *
 * Combines all providers needed for the application in the correct order.
 */

import * as React from 'react'
import { QueryProvider } from '@/lib/query'
import { ToastProvider } from '@/components/ui/toast'

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Root providers for the application
 * Wraps children with all necessary context providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryProvider>
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
