'use client'

import { cn } from '@/lib/utils'
import { LoadingButton } from './loading-button'

export interface ErrorDisplayProps {
  error: Error | string
  retry?: () => void | Promise<void>
  retrying?: boolean
  title?: string
  variant?: 'inline' | 'card' | 'page'
  className?: string
}

export function ErrorDisplay({
  error,
  retry,
  retrying = false,
  title = 'Error',
  variant = 'inline',
  className,
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  // Inline variant (compact)
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 p-4',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-red-900">{title}</h4>
            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
            {retry && (
              <button
                onClick={retry}
                disabled={retrying}
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline disabled:opacity-50"
              >
                {retrying ? 'Retrying...' : 'Try again'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Card variant (medium)
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center',
          className
        )}
      >
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-red-900 mb-2">{title}</h3>
        <p className="text-sm text-red-700 mb-6 max-w-md mx-auto">
          {errorMessage}
        </p>
        {retry && (
          <LoadingButton
            onClick={retry}
            loading={retrying}
            loadingText="Retrying..."
            variant="danger"
            size="md"
          >
            Try Again
          </LoadingButton>
        )}
      </div>
    )
  }

  // Page variant (full page)
  return (
    <div
      className={cn(
        'min-h-[400px] flex items-center justify-center px-4 py-12',
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-900 mb-2">{title}</h2>
        <p className="text-base text-red-700 mb-8">{errorMessage}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {retry && (
            <LoadingButton
              onClick={retry}
              loading={retrying}
              loadingText="Retrying..."
              variant="danger"
              size="lg"
            >
              Try Again
            </LoadingButton>
          )}
          <LoadingButton
            onClick={() => window.location.reload()}
            variant="secondary"
            size="lg"
          >
            Reload Page
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}

// Empty state component (not an error, but related)
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center',
        className
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4">{icon}</div>
      ) : (
        <svg
          className="mx-auto h-12 w-12 text-zinc-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}
      <h3 className="text-base font-semibold text-zinc-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
