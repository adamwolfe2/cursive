'use client'

/**
 * Activate Page
 *
 * Two premium upsell flows triggered from the Website Visitors page:
 *   1. Lookalike Audience Builder — define ICP, we build the list
 *   2. Outbound Campaign Launcher — we run cold email on your behalf
 *
 * Multi-step wizard. On submit -> Slack alert fires to Cursive team.
 */

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FlowType } from './types'
import { FlowSelector } from './FlowSelector'
import { AudienceWizard } from './AudienceWizard'
import { CampaignWizard } from './CampaignWizard'
import { SuccessScreen } from './SuccessScreen'

// ─── Main Page ─────────────────────────────────────────────

function ActivatePageInner() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const initialFlow = (searchParams.get('flow') as FlowType) ?? null
  const [flow, setFlow] = useState<FlowType>(initialFlow)
  const [done, setDone] = useState(false)

  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/user')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 60_000,
  })

  const { data: visitorStats } = useQuery({
    queryKey: ['visitors-stats'],
    queryFn: async () => {
      const res = await fetch('/api/visitors?limit=1')
      if (!res.ok) return null
      const data = await res.json()
      return { pixel_visitors: data.stats?.total ?? 0, enriched: data.stats?.enriched ?? 0 }
    },
    staleTime: 60_000,
  })

  const defaultEmail = userData?.user?.email ?? ''
  const defaultName = userData?.user?.user_metadata?.full_name?.split(' ')[0]
    || userData?.user?.user_metadata?.name?.split(' ')[0]
    || ''

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SuccessScreen flow={flow} onReset={() => { setDone(false); setFlow(null) }} />
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="py-6">
        <FlowSelector onSelect={setFlow} stats={visitorStats} />
      </div>
    )
  }

  if (flow === 'audience') {
    return (
      <div className="py-6">
        <AudienceWizard
          onBack={() => setFlow(null)}
          onSuccess={() => { setDone(true); queryClient.invalidateQueries({ queryKey: ['visitors-stats'] }) }}
          defaultEmail={defaultEmail}
          defaultName={defaultName}
        />
      </div>
    )
  }

  return (
    <div className="py-6">
      <CampaignWizard
        onBack={() => setFlow(null)}
        onSuccess={() => { setDone(true); queryClient.invalidateQueries({ queryKey: ['visitors-stats'] }) }}
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>}>
      <ActivatePageInner />
    </Suspense>
  )
}
