// Client Component for Leads Table
// Uses React Query for data fetching with filters from Zustand

'use client'

import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLeads } from '@/lib/hooks/use-leads'
import { useCRMStore } from '@/lib/crm/crm-state'
import { LeadsDataTable } from './LeadsDataTable'
import { LeadsFilterBar, type LeadsFilterBarRef } from './LeadsFilterBar'
import { BulkActionsToolbar } from './BulkActionsToolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts'
import type { WorkspaceUser } from './LeadsTableColumns'

export function LeadsTableClient() {
  const { filters } = useCRMStore()
  const filterBarRef = useRef<LeadsFilterBarRef>(null)

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onFocusSearch: () => filterBarRef.current?.focusSearch(),
  })

  // Fetch workspace users for assignment dropdown
  const { data: usersData } = useQuery({
    queryKey: ['workspace', 'users'],
    queryFn: async () => {
      const res = await fetch('/api/crm/workspace/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  // Fetch workspace tags
  const { data: tagsData } = useQuery({
    queryKey: ['workspace', 'tags'],
    queryFn: async () => {
      const res = await fetch('/api/crm/workspace/tags')
      if (!res.ok) throw new Error('Failed to fetch tags')
      return res.json()
    },
  })

  // Fetch leads with current filters
  const { data, isLoading, error } = useLeads(filters)

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load leads</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <LeadsFilterBar ref={filterBarRef} />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <LeadsDataTable
          data={data?.leads || []}
          totalCount={data?.total || 0}
          pageCount={data?.pageCount || 0}
          availableUsers={usersData?.users || []}
          commonTags={tagsData?.tags || []}
        />
      )}

      {/* Bulk actions toolbar (slides up when leads selected) */}
      <BulkActionsToolbar
        availableUsers={usersData?.users || []}
        commonTags={tagsData?.tags || []}
      />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100/50 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm">
        {/* Table Header Skeleton */}
        <div className="h-12 border-b border-blue-100/50 bg-gradient-cursive-soft flex items-center gap-4 px-6">
          <div className="shimmer-cursive h-4 w-4 rounded" />
          <div className="shimmer-cursive h-4 w-32 rounded" />
          <div className="shimmer-cursive h-4 w-48 rounded" />
          <div className="shimmer-cursive h-4 w-24 rounded" />
          <div className="shimmer-cursive h-4 w-20 rounded" />
          <div className="flex-1" />
          <div className="shimmer-cursive h-4 w-16 rounded" />
        </div>

        {/* Table Rows Skeleton */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-blue-50/50 flex items-center gap-4 px-6 hover:bg-gradient-cursive-subtle/50 transition-colors"
          >
            <div className="shimmer-cursive h-4 w-4 rounded" />
            <div className="shimmer-cursive h-6 w-6 rounded-full" />
            <div className="shimmer-cursive h-4 w-40 rounded" />
            <div className="shimmer-cursive h-4 w-32 rounded" />
            <div className="shimmer-cursive h-5 w-16 rounded-full" />
            <div className="shimmer-cursive h-4 w-20 rounded" />
            <div className="flex-1" />
            <div className="shimmer-cursive h-8 w-8 rounded" />
          </div>
        ))}
      </div>

      {/* Empty State Message (for truly empty tables) */}
      <div className="text-center py-8 px-4">
        <div className="mx-auto w-fit mb-4">
          <div className="shimmer-cursive h-16 w-16 rounded-full" />
        </div>
        <div className="shimmer-cursive h-6 w-48 rounded mx-auto mb-2" />
        <div className="shimmer-cursive h-4 w-64 rounded mx-auto" />
      </div>
    </div>
  )
}
