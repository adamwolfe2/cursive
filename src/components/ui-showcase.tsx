'use client'

/**
 * UI Showcase Component
 *
 * This component demonstrates all error boundaries, loading states,
 * and skeleton loaders available in OpenInfo.
 *
 * Usage: Import and render in a test page to see all UI states
 */

import { useState } from 'react'
import { ErrorBoundary, InlineErrorBoundary } from './error-boundary'
import {
  Skeleton,
  TableSkeleton,
  StatCardsSkeleton,
  QueryCardSkeleton,
  DetailPanelSkeleton,
  FormSkeleton,
  SearchResultsSkeleton,
  PageSkeleton,
  ListSkeleton,
  Spinner,
  LoadingOverlay,
} from './skeletons'
import { ErrorDisplay, EmptyState } from './error-display'
import { LoadingButton } from './loading-button'

export function UIShowcase() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  return (
    <div className="space-y-12 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">
          OpenInfo UI Component Showcase
        </h1>
        <p className="text-zinc-600">
          Comprehensive error boundaries and loading states
        </p>
      </div>

      {/* Loading Buttons */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Loading Buttons
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">Primary</p>
            <LoadingButton
              variant="primary"
              onClick={() => {
                setButtonLoading(true)
                setTimeout(() => setButtonLoading(false), 2000)
              }}
              loading={buttonLoading}
              loadingText="Saving..."
            >
              Save Changes
            </LoadingButton>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">Secondary</p>
            <LoadingButton variant="secondary" loading={false}>
              Cancel
            </LoadingButton>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">Danger</p>
            <LoadingButton variant="danger" loading={false}>
              Delete
            </LoadingButton>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">Ghost</p>
            <LoadingButton variant="ghost" loading={false}>
              Learn More
            </LoadingButton>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-zinc-700">Sizes</p>
          <div className="flex gap-3 items-center">
            <LoadingButton size="sm" loading={buttonLoading}>
              Small
            </LoadingButton>
            <LoadingButton size="md" loading={buttonLoading}>
              Medium
            </LoadingButton>
            <LoadingButton size="lg" loading={buttonLoading}>
              Large
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* Spinners */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">Spinners</h2>
        <div className="flex gap-8 items-center p-6 bg-white rounded-lg border border-zinc-200">
          <div className="text-center">
            <Spinner size="sm" />
            <p className="text-xs text-zinc-500 mt-2">Small</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="text-xs text-zinc-500 mt-2">Medium</p>
          </div>
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-xs text-zinc-500 mt-2">Large</p>
          </div>
        </div>
      </section>

      {/* Error Displays */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Error Displays
        </h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Inline Variant
            </p>
            <ErrorDisplay
              error="Failed to load data. Please try again."
              retry={() => alert('Retry clicked')}
              variant="inline"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Card Variant
            </p>
            <ErrorDisplay
              error="Unable to connect to the server"
              retry={() => alert('Retry clicked')}
              variant="card"
              title="Connection Error"
            />
          </div>
        </div>
      </section>

      {/* Empty States */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Empty States
        </h2>
        <EmptyState
          title="No queries found"
          description="Get started by creating your first query to track topics you care about"
          action={
            <LoadingButton variant="primary">Create Query</LoadingButton>
          }
        />
      </section>

      {/* Skeleton Loaders */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Skeleton Loaders
        </h2>

        <div className="space-y-8">
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Stats Cards
            </p>
            <StatCardsSkeleton count={4} />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Query Cards
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <QueryCardSkeleton />
              <QueryCardSkeleton />
              <QueryCardSkeleton />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Table Skeleton
            </p>
            <TableSkeleton rows={5} columns={6} />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Form Skeleton
            </p>
            <div className="bg-white rounded-lg border border-zinc-200 p-6">
              <FormSkeleton fields={4} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Search Results
            </p>
            <SearchResultsSkeleton count={3} />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              List Skeleton
            </p>
            <ListSkeleton items={5} />
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Loading Overlay
        </h2>
        <div className="relative bg-white rounded-lg border border-zinc-200 p-8 min-h-[200px]">
          <p className="text-zinc-600">Content behind overlay...</p>
          {showOverlay && <LoadingOverlay message="Processing..." />}
        </div>
        <LoadingButton
          variant="secondary"
          onClick={() => setShowOverlay(!showOverlay)}
          className="mt-4"
        >
          {showOverlay ? 'Hide' : 'Show'} Overlay
        </LoadingButton>
      </section>

      {/* Error Boundaries */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Error Boundaries
        </h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Inline Error Boundary
            </p>
            <InlineErrorBoundary>
              <div className="bg-white rounded-lg border border-zinc-200 p-6">
                <p className="text-zinc-900">
                  This content is protected by an error boundary.
                </p>
              </div>
            </InlineErrorBoundary>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 mb-3">
              Full Error Boundary (triggers error)
            </p>
            <ErrorBoundary>
              <ThrowError />
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* Base Skeleton Component */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 mb-4">
          Base Skeleton Component
        </h2>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </section>
    </div>
  )
}

// Component that throws an error for demonstration
function ThrowError() {
  throw new Error('This is a demo error from the showcase')
  return null
}
