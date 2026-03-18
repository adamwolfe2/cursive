'use client'

import { Button } from '@/components/ui/button'
import { BulkIntelligenceAction } from '@/components/intelligence'
import type { VisitorLead, PixelInfo } from './visitor-types'
import { VisitorCard } from './VisitorCard'

// ─── Loading Skeleton ──────────────────────────────────────

function VisitorGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────

function EmptyState({ hasPixel }: { hasPixel: boolean }) {
  if (!hasPixel) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Install the Cursive pixel</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          Install a lightweight pixel to identify anonymous website visitors in real-time. Free for 14 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/settings/pixel"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Set Up Pixel — Free 14-Day Trial
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No visitors yet</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        Visitors will appear here once your pixel starts firing. Make sure the snippet is installed on every page.
      </p>
      <a
        href="/settings/pixel"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
      >
        Check pixel install status
      </a>
    </div>
  )
}

// ─── Main Grid ─────────────────────────────────────────────

interface VisitorGridProps {
  visitors: VisitorLead[]
  pixel: PixelInfo | null | undefined
  isLoading: boolean
  page: number
  pagination: { total: number; page: number; limit: number; pages: number } | undefined
  selectedVisitorIds: string[]
  onPageChange: (page: number) => void
  onSelectionChange: (ids: string[]) => void
  onEnrich: (lead: VisitorLead) => void
  onView: (id: string) => void
  onBulkComplete: () => void
}

export function VisitorGrid({
  visitors,
  pixel,
  isLoading,
  page,
  pagination,
  selectedVisitorIds,
  onPageChange,
  onSelectionChange,
  onEnrich,
  onView,
  onBulkComplete,
}: VisitorGridProps) {
  // Trial expired — don't show the normal grid
  if (pixel?.trial_status === 'expired') return null

  if (isLoading) {
    return <VisitorGridSkeleton />
  }

  if (visitors.length === 0) {
    return <EmptyState hasPixel={!!pixel} />
  }

  return (
    <>
      {selectedVisitorIds.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedVisitorIds.length} visitor{selectedVisitorIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <BulkIntelligenceAction
              selectedLeadIds={selectedVisitorIds}
              onComplete={onBulkComplete}
            />
            <button
              onClick={() => onSelectionChange([])}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visitors.map((v) => (
          <div key={v.id} className="relative">
            <input
              type="checkbox"
              checked={selectedVisitorIds.includes(v.id)}
              onChange={(e) => {
                onSelectionChange(
                  e.target.checked
                    ? [...selectedVisitorIds, v.id]
                    : selectedVisitorIds.filter(id => id !== v.id)
                )
              }}
              className="absolute top-3 right-3 z-10 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <VisitorCard
              lead={v}
              onEnrich={onEnrich}
              onView={onView}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  )
}
