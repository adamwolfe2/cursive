'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/design-system'
import { DATE_RANGES, ENRICHMENT_FILTERS } from './visitor-types'

interface VisitorFiltersProps {
  dateRange: string
  enrichmentFilter: string
  totalCount: number | undefined
  onDateRangeChange: (value: string) => void
  onEnrichmentFilterChange: (value: string) => void
}

export function VisitorFilters({
  dateRange,
  enrichmentFilter,
  totalCount,
  onDateRangeChange,
  onEnrichmentFilterChange,
}: VisitorFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Date range */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
        <Calendar className="h-4 w-4 text-gray-400 ml-2" />
        {DATE_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onDateRangeChange(r.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              dateRange === r.value
                ? 'bg-primary text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Enrichment filter */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
        {ENRICHMENT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onEnrichmentFilterChange(f.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              enrichmentFilter === f.value
                ? 'bg-primary text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {totalCount !== undefined && (
        <span className="text-sm text-gray-400 ml-auto">
          {totalCount.toLocaleString()} visitor{totalCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
