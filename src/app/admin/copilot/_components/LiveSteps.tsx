'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/design-system'
import { CursiveOrb } from './CursiveOrb'

interface ToolCall {
  id: string
  name: string
  input: unknown
  summary?: string
}

interface LiveStepsProps {
  isStreaming: boolean
  hasThinking: boolean
  hasText: boolean
  toolCalls?: ToolCall[]
}

interface Step {
  key: string
  label: string
  state: 'active' | 'done' | 'pending'
}

function describeToolCall(name: string, input: unknown): string {
  const i = (input ?? {}) as Record<string, unknown>
  switch (name) {
    case 'search_segments': {
      const q = typeof i.query === 'string' ? i.query.trim() : ''
      const label = q.length > 48 ? q.slice(0, 48).trimEnd() + '…' : q
      return label ? `Searching the catalog for "${label}"` : 'Searching the segment catalog'
    }
    case 'get_segment_details':
      return i.segment_id ? `Looking up segment ${i.segment_id}` : 'Fetching segment details'
    case 'preview_audience_count':
      return i.segment_id
        ? `Pulling live in-market count for ${i.segment_id}`
        : 'Pulling live in-market count'
    case 'list_top_categories':
      return 'Mapping the catalog'
    default:
      return `Running ${name}`
  }
}

export function LiveSteps({ isStreaming, hasThinking, hasText, toolCalls }: LiveStepsProps) {
  if (!isStreaming) return null

  const steps: Step[] = []
  const hasToolActivity = (toolCalls?.length ?? 0) > 0

  // Initial thinking step
  steps.push({
    key: 'think',
    label: hasThinking ? 'Reasoning' : 'Thinking',
    state: hasToolActivity || hasText ? 'done' : 'active',
  })

  // Tool call steps
  for (const tc of toolCalls ?? []) {
    steps.push({
      key: `tc_${tc.id}`,
      label: describeToolCall(tc.name, tc.input),
      state: tc.summary || hasText ? 'done' : 'active',
    })
  }

  // Synthesis step (only when we know tools ran)
  if (hasToolActivity) {
    steps.push({
      key: 'answer',
      label: 'Crafting your answer',
      state: hasText ? 'active' : 'pending',
    })
  }

  return (
    <div className="mb-3 space-y-1.5">
      <AnimatePresence initial={false}>
        {steps.map((s, i) => (
          <StepRow key={s.key} step={s} index={i} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function StepRow({ step, index }: { step: Step; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2 text-[12.5px]"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {step.state === 'active' ? (
          <CursiveOrb size={14} pulsing />
        ) : step.state === 'done' ? (
          <Check className="h-3 w-3 text-muted-foreground/60" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        )}
      </span>
      <span
        className={cn(
          'transition-colors',
          step.state === 'active' && 'text-foreground',
          step.state === 'done' && 'text-muted-foreground',
          step.state === 'pending' && 'text-muted-foreground/60'
        )}
      >
        {step.label}
      </span>
    </motion.div>
  )
}
