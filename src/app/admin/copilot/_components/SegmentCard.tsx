'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/design-system'
import type { SegmentResult } from '@/lib/copilot/types'

interface SegmentCardProps {
  segment: SegmentResult
  index: number
  onPreview?: (segmentId: string) => void
}

export function SegmentCard({ segment, index, onPreview }: SegmentCardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyId = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(segment.segment_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview?.(segment.segment_id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        'overflow-hidden rounded-lg border border-border/60 bg-card transition-colors',
        open && 'border-border'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/30"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {segment.name}
        </span>

        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {segment.type}
        </span>

        {typeof segment.similarity === 'number' && (
          <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
            {Math.round(segment.similarity * 100)}%
          </span>
        )}

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-border/50 px-3 pb-3 pt-2">
              <p className="text-xs text-muted-foreground">
                {segment.category}
                {segment.sub_category ? ` · ${segment.sub_category}` : ''}
              </p>

              {segment.description && (
                <p className="text-xs leading-relaxed text-foreground/80">
                  {segment.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {onPreview && (
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40"
                  >
                    Preview size
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyId}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{segment.segment_id}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
