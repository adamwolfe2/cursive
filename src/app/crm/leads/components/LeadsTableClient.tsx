// Client Component for Leads Table
// Uses React Query for data fetching with filters from Zustand

'use client'

import { useRef } from 'react'
import { useLeads } from '@/lib/hooks/use-leads'
import { useCRMStore } from '@/lib/crm/crm-state'
import { LeadsDataTable } from './LeadsDataTable'
import { LeadsFilterBar, type LeadsFilterBarRef } from './LeadsFilterBar'
import { BulkActionsToolbar } from './BulkActionsToolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts'

export function LeadsTableClient() {
  const { filters } = useCRMStore()
  const filterBarRef = useRef<LeadsFilterBarRef>(null)

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onFocusSearch: () => filterBarRef.current?.focusSearch(),
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
        />
      )}

      {/* Bulk actions toolbar (slides up when leads selected) */}
      <BulkActionsToolbar />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="h-10 border-b flex items-center gap-4 px-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 border-b flex items-center gap-4 px-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
