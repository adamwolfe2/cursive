'use client'

/**
 * ProspectsList — table of prospects in the outbound workflow.
 * Polls /api/outbound/workflows/[id]/prospects every 10 seconds.
 *
 * Click a row that has a draft → opens the EmailDraftModal (Feature 7 wires it).
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { EmailDraftModal } from './email-draft-modal'
import type { OutboundProspect } from '@/types/outbound'

export interface ProspectsListProps {
  agentId: string
}

export function ProspectsList({ agentId }: ProspectsListProps) {
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<{ data: OutboundProspect[] }>({
    queryKey: ['outbound', 'prospects', agentId],
    queryFn: async () => {
      const r = await fetch(`/api/outbound/workflows/${agentId}/prospects?limit=100`)
      if (!r.ok) throw new Error('Failed to load prospects')
      return r.json()
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  })

  const prospects = data?.data ?? []

  if (isLoading && prospects.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted-foreground">Loading prospects…</div>
    )
  }

  if (isError) {
    return (
      <div className="px-5 py-12 text-center text-sm text-destructive">
        Failed to load prospects. Will retry in 10 seconds.
      </div>
    )
  }

  if (prospects.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No prospects yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Click <span className="font-semibold">Run Now</span> to start prospecting.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Company
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Stage
              </th>
            </tr>
          </thead>
          <tbody>
            {prospects.map(p => {
              const hasDraft = p.display_stage === 'drafting'
              const name =
                p.lead_full_name ||
                [p.lead_first_name, p.lead_last_name].filter(Boolean).join(' ').trim() ||
                p.lead_email ||
                'Unknown'
              return (
                <tr
                  key={p.id}
                  className={`border-b border-border last:border-0 ${
                    hasDraft ? 'cursor-pointer hover:bg-muted/30' : ''
                  }`}
                  onClick={() => hasDraft && setOpenLeadId(p.lead_id)}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{name}</div>
                    {p.lead_job_title && (
                      <div className="text-xs text-muted-foreground">{p.lead_job_title}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-foreground">{p.lead_company_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <StageBadge stage={p.display_stage} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {openLeadId && (
        <EmailDraftModal
          agentId={agentId}
          leadId={openLeadId}
          onClose={() => setOpenLeadId(null)}
        />
      )}
    </>
  )
}

function StageBadge({ stage }: { stage?: OutboundProspect['display_stage'] }) {
  switch (stage) {
    case 'enriching':
      return <Badge variant="muted">Enriching</Badge>
    case 'drafting':
      return <Badge variant="info">Drafted</Badge>
    case 'engaging':
      return <Badge variant="info">In sequence</Badge>
    case 'replying':
      return <Badge variant="success">Replied</Badge>
    case 'booked':
      return <Badge variant="success">Booked</Badge>
    case 'skipped':
      return <Badge variant="muted">Skipped</Badge>
    default:
      return <Badge variant="muted">—</Badge>
  }
}
