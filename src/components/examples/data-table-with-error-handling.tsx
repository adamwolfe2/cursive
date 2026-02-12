'use client'

/**
 * Example: Data Table with Complete Error Handling
 *
 * This example demonstrates best practices for implementing
 * error boundaries, loading states, and retry logic.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ErrorBoundary,
  TableSkeleton,
  ErrorDisplay,
  EmptyState,
  LoadingButton,
  Spinner,
} from '@/components'
import { retryFetchJson } from '@/lib/utils/retry'

interface Item {
  id: string
  name: string
  status: string
  created_at: string
}

export function DataTableWithErrorHandling() {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Fetch data with retry logic
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['items'],
    queryFn: () => retryFetchJson<{ data: Item[] }>('/api/items', undefined, {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (attempt: number, _error: Error) => {
        // Log retry attempt
      },
    }),
    // React Query automatic retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/items/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!response.ok) throw new Error('Failed to delete items')
      return response.json()
    },
    onMutate: async (ids) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['items'])

      // Optimistically update
      queryClient.setQueryData(['items'], (old: any) => ({
        ...old,
        data: old.data.filter((item: Item) => !ids.includes(item.id)),
      }))

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['items'], context.previousData)
      }
    },
    onSuccess: () => {
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Delete ${selectedIds.length} item(s)?`)) return

    try {
      await deleteMutation.mutateAsync(selectedIds)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Items</h2>
        </div>
        <ErrorDisplay
          error={error as Error}
          retry={() => { refetch() }}
          variant="card"
          title="Failed to load items"
        />
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse" />
          <div className="h-10 w-28 bg-zinc-200 rounded animate-pulse" />
        </div>
        <TableSkeleton rows={10} columns={5} />
      </div>
    )
  }

  const items = data?.data || []

  // Empty state
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Items</h2>
          <LoadingButton variant="primary">
            Add Item
          </LoadingButton>
        </div>
        <EmptyState
          title="No items found"
          description="Get started by adding your first item to the system"
          action={
            <LoadingButton variant="primary">
              Add Your First Item
            </LoadingButton>
          }
        />
      </div>
    )
  }

  // Success state - render table
  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Items</h2>
            <p className="text-sm text-zinc-600 mt-1">
              {items.length} total items
            </p>
          </div>
          <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <LoadingButton
                variant="danger"
                loading={deleteMutation.isPending}
                loadingText="Deleting..."
                onClick={handleBulkDelete}
              >
                Delete ({selectedIds.length})
              </LoadingButton>
            )}
            <LoadingButton variant="primary">
              Add Item
            </LoadingButton>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(items.map((item) => item.id))
                      } else {
                        setSelectedIds([])
                      }
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, item.id])
                        } else {
                          setSelectedIds(selectedIds.filter((id) => id !== item.id))
                        }
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                          : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Refresh button */}
        <div className="flex justify-end">
          <LoadingButton
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </LoadingButton>
        </div>
      </div>
    </ErrorBoundary>
  )
}
