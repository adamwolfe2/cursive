'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Users } from 'lucide-react'
import { useState } from 'react'
import type { SegmentResult } from '@/lib/copilot/types'

interface PublicSegmentCardProps {
  segment: SegmentResult
  index: number
  onShowSample?: () => void
}

/**
 * Public-surface segment card — deliberately does NOT surface the
 * segment_id (even the hashed pseudo-id). Shows name, type, similarity,
 * and an expandable category/description section only.
 */
export function PublicSegmentCard({
  segment,
  index,
  onShowSample,
}: PublicSegmentCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        open ? 'border-slate-300' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50/80"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#0F172A]">
          {segment.name}
        </span>

        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {segment.type}
        </span>

        {typeof segment.similarity === 'number' && (
          <span className="shrink-0 tabular-nums text-[11px] text-slate-500">
            {Math.round(segment.similarity * 100)}% match
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
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
            <div className="space-y-2 border-t border-slate-200 px-3.5 pb-3.5 pt-2.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                {segment.category}
                {segment.sub_category ? ` · ${segment.sub_category}` : ''}
              </p>

              {segment.description && (
                <p className="text-[13px] leading-relaxed text-slate-700">
                  {segment.description}
                </p>
              )}

              {onShowSample && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowSample()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Users className="h-3 w-3" />
                    Show me real leads
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
