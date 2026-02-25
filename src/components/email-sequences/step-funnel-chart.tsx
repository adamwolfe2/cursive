'use client'

/**
 * StepFunnelChart
 * Visual funnel showing per-step email engagement drop-off.
 * Renders a horizontal bar-based funnel without any external chart library.
 */

import { Mail, MousePointerClick, MessageSquare, Eye } from 'lucide-react'
import { cn } from '@/lib/design-system'

interface FunnelStep {
  id: string
  step_order: number
  name: string
  subject: string | null
  sent_count: number
  opened_count: number
  clicked_count: number
  replied_count: number
}

interface StepFunnelChartProps {
  steps: FunnelStep[]
  className?: string
}

interface MetricConfig {
  key: keyof Pick<FunnelStep, 'sent_count' | 'opened_count' | 'clicked_count' | 'replied_count'>
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  barColor: string
}

const METRICS: MetricConfig[] = [
  {
    key: 'sent_count',
    label: 'Sent',
    icon: Mail,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    barColor: 'bg-slate-400',
  },
  {
    key: 'opened_count',
    label: 'Opened',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    barColor: 'bg-blue-500',
  },
  {
    key: 'clicked_count',
    label: 'Clicked',
    icon: MousePointerClick,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    barColor: 'bg-sky-500',
  },
  {
    key: 'replied_count',
    label: 'Replied',
    icon: MessageSquare,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    barColor: 'bg-emerald-500',
  },
]

function calcPct(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function FunnelBar({
  value,
  max,
  barColor,
  label,
  pct,
}: {
  value: number
  max: number
  barColor: string
  label: string
  pct: number
}) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-8 text-right shrink-0">
        {pct}%
      </span>
    </div>
  )
}

function StepCard({ step, maxSent }: { step: FunnelStep; maxSent: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Step header */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
          {step.step_order}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{step.name}</p>
          {step.subject && (
            <p className="text-xs text-muted-foreground truncate">{step.subject}</p>
          )}
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-lg font-bold text-foreground">{step.sent_count.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">sent</p>
        </div>
      </div>

      {/* Metric bars */}
      <div className="space-y-2">
        {METRICS.slice(1).map((metric) => {
          const value = step[metric.key] as number
          const pct = calcPct(value, step.sent_count)
          return (
            <div key={metric.key} className="flex items-center gap-3">
              <div className={cn('flex items-center gap-1 w-20 shrink-0', metric.color)}>
                <metric.icon className="h-3 w-3" />
                <span className="text-xs font-medium">{metric.label}</span>
              </div>
              <div className="flex-1 min-w-0">
                <FunnelBar
                  value={value}
                  max={step.sent_count}
                  barColor={metric.barColor}
                  label={`${metric.label}: ${value}`}
                  pct={pct}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
                {value.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StepFunnelChart({ steps, className }: StepFunnelChartProps) {
  if (steps.length === 0) {
    return null
  }

  const maxSent = Math.max(...steps.map((s) => s.sent_count), 1)

  // Aggregate totals across steps
  const totals = steps.reduce(
    (acc, step) => ({
      sent: acc.sent + step.sent_count,
      opened: acc.opened + step.opened_count,
      clicked: acc.clicked + step.clicked_count,
      replied: acc.replied + step.replied_count,
    }),
    { sent: 0, opened: 0, clicked: 0, replied: 0 }
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall funnel summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-muted/30">
        {METRICS.map((metric) => {
          const value =
            metric.key === 'sent_count'
              ? totals.sent
              : metric.key === 'opened_count'
              ? totals.opened
              : metric.key === 'clicked_count'
              ? totals.clicked
              : totals.replied
          const pct = calcPct(value, totals.sent)
          return (
            <div key={metric.key} className="text-center">
              <div
                className={cn(
                  'inline-flex items-center justify-center h-8 w-8 rounded-full mb-1',
                  metric.bgColor
                )}
              >
                <metric.icon className={cn('h-4 w-4', metric.color)} />
              </div>
              <p className="text-lg font-bold text-foreground">{value.toLocaleString()}</p>
              <p className={cn('text-xs font-medium', metric.color)}>{metric.label}</p>
              {metric.key !== 'sent_count' && (
                <p className="text-xs text-muted-foreground">{pct}% of sent</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Funnel connector line */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" aria-hidden="true" />
        <div className="space-y-3 pl-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative">
              {/* Drop-off indicator between steps */}
              {idx > 0 && step.sent_count < steps[idx - 1].sent_count && (
                <div className="flex items-center gap-2 ml-6 mb-2 pl-4">
                  <span className="text-xs text-muted-foreground italic">
                    {(steps[idx - 1].sent_count - step.sent_count).toLocaleString()} contacts
                    didn&apos;t advance
                  </span>
                </div>
              )}
              <StepCard step={step} maxSent={maxSent} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
