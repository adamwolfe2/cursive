'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/design-system'

interface ReasoningPanelProps {
  thinking?: string
  toolCalls?: Array<{ id: string; name: string; input: unknown; summary?: string }>
  isActive?: boolean
}

export function ReasoningPanel({ thinking, toolCalls, isActive }: ReasoningPanelProps) {
  const [open, setOpen] = useState(false)
  const hasContent = Boolean(thinking?.trim()) || (toolCalls && toolCalls.length > 0)
  if (!hasContent && !isActive) return null

  const summaryText = isActive
    ? 'Thinking…'
    : toolCalls && toolCalls.length > 0
      ? `Reasoning · ${toolCalls.length} tool call${toolCalls.length > 1 ? 's' : ''}`
      : 'Reasoning'

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-border/50 bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className={cn(isActive && 'animate-pulse')}>{summaryText}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 transition-transform',
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
            <div className="space-y-2 border-t border-border/50 px-3 py-2 text-xs">
              {thinking && (
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {thinking}
                </pre>
              )}
              {toolCalls?.map((tc) => (
                <div key={tc.id} className="rounded border border-border/50 bg-background/80 p-2">
                  <code className="font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                    {tc.name}
                  </code>
                  <code className="mt-1 block break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(tc.input, null, 2)}
                  </code>
                  {tc.summary && (
                    <div className="mt-1.5 border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground/90">
                      {tc.summary.length > 400 ? tc.summary.slice(0, 400) + '…' : tc.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
