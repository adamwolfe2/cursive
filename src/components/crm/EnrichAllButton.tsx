'use client'

import { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EnrichAllButtonProps {
  /** Lead IDs to enrich. Pass only IDs of leads not yet enriched. */
  leadIds: string[]
  onComplete?: () => void
}

export function EnrichAllButton({ leadIds, onComplete }: EnrichAllButtonProps) {
  const [enriching, setEnriching] = useState(false)
  const [progress, setProgress] = useState(0)

  if (leadIds.length === 0) return null

  const handleEnrichAll = async () => {
    if (enriching) return
    setEnriching(true)
    setProgress(0)

    const toastId = toast.loading(
      `Enriching ${leadIds.length} lead${leadIds.length !== 1 ? 's' : ''}…`,
      { description: '0 / ' + leadIds.length + ' completed' }
    )

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < leadIds.length; i++) {
      const id = leadIds[i]
      try {
        const res = await fetch(`/api/leads/${id}/enrich`, { method: 'POST' })
        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }

      const done = i + 1
      setProgress(done)
      toast.loading(
        `Enriching ${leadIds.length} lead${leadIds.length !== 1 ? 's' : ''}…`,
        { id: toastId, description: `${done} / ${leadIds.length} completed` }
      )
    }

    setEnriching(false)
    setProgress(0)

    if (errorCount === 0) {
      toast.success(
        `Enriched ${successCount} lead${successCount !== 1 ? 's' : ''}`,
        { id: toastId, description: 'All leads have been enriched.' }
      )
    } else {
      toast.warning(
        `Enriched ${successCount} lead${successCount !== 1 ? 's' : ''}`,
        {
          id: toastId,
          description: `${errorCount} lead${errorCount !== 1 ? 's' : ''} could not be enriched (insufficient credits or already enriched).`,
        }
      )
    }

    onComplete?.()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnrichAll}
      disabled={enriching}
      className="gap-1.5"
    >
      {enriching ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Enriching {progress}/{leadIds.length}…
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5" />
          Enrich unprocessed leads ({leadIds.length})
        </>
      )}
    </Button>
  )
}
