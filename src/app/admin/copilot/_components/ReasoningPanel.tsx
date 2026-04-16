'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
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

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-border-light bg-muted/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles
            className={cn(
              'h-3 w-3',
              isActive && 'animate-pulse text-primary'
            )}
          />
          <span>
            {isActive
              ? 'Thinking…'
              : `Reasoning${toolCalls && toolCalls.length > 0 ? ` · ${toolCalls.length} tool call${toolCalls.length > 1 ? 's' : ''}` : ''}`}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-border-light px-3 py-2 text-xs">
              {thinking && (
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {thinking}
                </pre>
              )}
              {toolCalls?.map((tc) => (
                <div key={tc.id} className="rounded border border-border-light bg-background/60 p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <code className="font-mono text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {tc.name}
                    </code>
                  </div>
                  <code className="block break-all font-mono text-[10px] leading-relaxed text-foreground/70">
                    {JSON.stringify(tc.input, null, 2)}
                  </code>
                  {tc.summary && (
                    <div className="mt-1.5 border-t border-border-light pt-1.5 text-[10px] text-muted-foreground">
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
