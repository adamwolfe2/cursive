'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { SegmentResult } from '@/lib/copilot/types'

interface SegmentCardProps {
  segment: SegmentResult
  index: number
  onPreview?: (segmentId: string) => void
}

export function SegmentCard({ segment, index, onPreview }: SegmentCardProps) {
  const [copied, setCopied] = useState(false)

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(segment.segment_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-enterprise-xs transition-all hover:border-primary/30 hover:shadow-enterprise-sm"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-foreground">
              {segment.name}
            </h4>
            <Badge variant={segment.type === 'B2B' ? 'info' : 'secondary'} size="sm">
              {segment.type}
            </Badge>
            {typeof segment.similarity === 'number' && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {Math.round(segment.similarity * 100)}% match
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {segment.category}
            {segment.sub_category ? ` · ${segment.sub_category}` : ''}
          </p>

          {segment.description && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-foreground/80">
              {segment.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {onPreview && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onPreview(segment.segment_id)}
              >
                Preview size
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={copyId}
              leftIcon={copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            >
              {copied ? 'Copied' : segment.segment_id}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
