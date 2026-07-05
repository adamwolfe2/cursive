'use client'

import { useState } from 'react'
import { Download, Zap, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionBarProps {
  selectedCount: number
  totalCount: number
  selectedUnenrichedCount: number
  bulkEnriching: boolean
  bulkEnrichProgress: number
  bulkEnrichErrors: number
  creditsRemaining: number
  onSelectAll: () => void
  onClear: () => void
  onExport: () => void
  onBulkEnrich: () => void
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  selectedUnenrichedCount,
  bulkEnriching,
  bulkEnrichProgress,
  bulkEnrichErrors,
  creditsRemaining,
  onSelectAll,
  onClear,
  onExport,
  onBulkEnrich,
}: BulkActionBarProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  function handleEnrichClick() {
    if (selectedUnenrichedCount >= 5) {
      setShowConfirm(true)
    } else {
      onBulkEnrich()
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-primary">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="xs" onClick={onSelectAll}>
            Select all {totalCount}
          </Button>
          {selectedCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={onClear}
                leftIcon={<XCircle className="h-3.5 w-3.5" />}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={onExport}
                leftIcon={<Download className="h-3 w-3" />}
              >
                Export {selectedCount}
              </Button>
              {selectedUnenrichedCount > 0 && (
                <Button
                  variant="default"
                  size="xs"
                  onClick={handleEnrichClick}
                  disabled={bulkEnriching || creditsRemaining < selectedUnenrichedCount}
                  leftIcon={<Zap className="h-3 w-3" />}
                >
                  {bulkEnriching
                    ? `Enriching ${bulkEnrichProgress}/${selectedUnenrichedCount}${bulkEnrichErrors > 0 ? ` (${bulkEnrichErrors} failed)` : ''}…`
                    : `Enrich ${selectedUnenrichedCount} (${selectedUnenrichedCount} cr)`}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk enrich progress bar */}
      {bulkEnriching && selectedUnenrichedCount > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-primary font-medium">
              Enriching leads... {bulkEnrichProgress}/{selectedUnenrichedCount}
            </span>
            {bulkEnrichErrors > 0 && (
              <span className="flex items-center gap-1 text-xs text-warning">
                <AlertCircle className="h-3 w-3" /> {bulkEnrichErrors} failed
              </span>
            )}
          </div>
          <div className="h-1.5 bg-primary/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(bulkEnrichProgress / selectedUnenrichedCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="rounded-lg border border-warning/30 bg-warning-muted px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm text-warning">
              This will use <strong>{selectedUnenrichedCount} credits</strong> to enrich {selectedUnenrichedCount} leads.
              You have {creditsRemaining} credits remaining.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="xs" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={() => { setShowConfirm(false); onBulkEnrich() }}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
