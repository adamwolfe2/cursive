'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, ChevronRight } from 'lucide-react'
import type { OutboundAgent } from '@/types/outbound'

export interface WorkflowCardProps {
  agent: OutboundAgent
}

/**
 * One card per outbound workflow on the /outbound list page.
 *
 * White-card-with-blue-accent — matches Cursive's existing design tokens.
 * Uses the existing `Card` (variant="interactive") and `Badge` primitives.
 */
export function WorkflowCard({ agent }: WorkflowCardProps) {
  const lastRunLabel = agent.outbound_last_run_at
    ? formatRelative(agent.outbound_last_run_at)
    : 'Never run'

  const filters = (agent.outbound_filters as { industries?: string[]; seniority_levels?: string[] }) ?? {}
  const industries = filters.industries ?? []
  const seniority = filters.seniority_levels ?? []

  return (
    <Link href={`/outbound/${agent.id}`} className="block">
      <Card variant="interactive" className="h-full p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-foreground">{agent.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{lastRunLabel}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>

            {(industries.length > 0 || seniority.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {industries.slice(0, 2).map(ind => (
                  <Badge key={ind} variant="info" className="text-xs">
                    {ind}
                  </Badge>
                ))}
                {seniority.slice(0, 2).map(s => (
                  <Badge key={s} variant="muted" className="text-xs">
                    {s}
                  </Badge>
                ))}
                {industries.length + seniority.length > 4 && (
                  <Badge variant="muted" className="text-xs">
                    +{industries.length + seniority.length - 4}
                  </Badge>
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {agent.icp_text || 'Click to set up your ICP, persona, and product context.'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
