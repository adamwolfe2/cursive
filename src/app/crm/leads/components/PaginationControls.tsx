// Pagination Controls
// Professional pagination with page size selector and navigation

'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useCRMStore } from '@/lib/crm/crm-state'

interface PaginationControlsProps {
  currentPage: number
  pageSize: number
  totalCount: number
  pageCount: number
}

export function PaginationControls({
  currentPage,
  pageSize,
  totalCount,
  pageCount,
}: PaginationControlsProps) {
  const { setFilters } = useCRMStore()

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < pageCount

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage })
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setFilters({ page: 1, pageSize: parseInt(newPageSize) })
  }

  return (
    <div className="flex items-center justify-between px-2 py-2">
      {/* Left side - Results count */}
      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex}</span> to{' '}
          <span className="font-medium text-foreground">{endIndex}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> results
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
            ]}
            selectSize="sm"
            className="w-[70px]"
            aria-label="Select page size"
          />
        </div>
      </div>

      {/* Right side - Navigation */}
      <div className="flex items-center gap-2">
        {/* Page indicator */}
        <div className="text-sm text-muted-foreground mr-2">
          Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
          <span className="font-medium text-foreground">{pageCount}</span>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrevious}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(pageCount)}
            disabled={!canGoNext}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
