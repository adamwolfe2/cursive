// Outbound Workflow detail page — the Rox-style stage pipeline view.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { OutboundRunRepository } from '@/lib/repositories/outbound-run.repository'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StagePipeline } from '@/components/outbound/stage-pipeline'
import { RunNowButton } from '@/components/outbound/run-now-button'
import { RunStatusBadge } from '@/components/outbound/run-status-badge'
import { ProspectsList } from '@/components/outbound/prospects-list'
import { ChatToggle } from '@/components/outbound/chat-toggle'
import { Settings as SettingsIcon } from 'lucide-react'
import type { WorkflowStatsResponse, StageCounts } from '@/types/outbound'

export const metadata: Metadata = { title: 'Outbound Workflow | Cursive' }

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!userData?.workspace_id) redirect('/welcome')

  const agentRepo = new AgentRepository()
  const runRepo = new OutboundRunRepository()
  const agent = await agentRepo.findOutboundById(id, userData.workspace_id)
  if (!agent) notFound()

  // Initial stats snapshot for SSR — avoids the empty flash before first poll
  const [latestRun, recentRuns, viewRow] = await Promise.all([
    runRepo.findLatest(id, userData.workspace_id),
    runRepo.findRecent(id, userData.workspace_id, 10),
    supabase.from('outbound_pipeline_counts').select('*').eq('agent_id', id).maybeSingle(),
  ])

  const stages: StageCounts = {
    prospecting: ((viewRow.data as any)?.prospecting_count) ?? 0,
    enriching: ((viewRow.data as any)?.enriching_count) ?? 0,
    drafting: ((viewRow.data as any)?.drafting_count) ?? 0,
    engaging: ((viewRow.data as any)?.engaging_count) ?? 0,
    replying: ((viewRow.data as any)?.replying_count) ?? 0,
    booked: ((viewRow.data as any)?.booked_count) ?? 0,
  }

  const initialStats: WorkflowStatsResponse = {
    stages,
    latest_run: latestRun,
    recent_runs: recentRuns,
  }

  return (
    <PageContainer>
      <PageHeader
        title={agent.name}
        description={agent.icp_text || 'Click Edit Setup to define your ICP.'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Outbound Agent', href: '/outbound' },
          { label: agent.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <RunStatusBadge status={(latestRun?.status as any) ?? 'idle'} />
            <Link href={`/outbound/${id}/edit`}>
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-1.5" />
                Edit Setup
              </Button>
            </Link>
            <ChatToggle agentId={id} agentName={agent.name} />
            <RunNowButton agentId={id} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(380px,420px)_1fr]">
        {/* Left column — 6 stage cards */}
        <div>
          <StagePipeline agentId={id} initialStats={initialStats} />
        </div>

        {/* Right column — prospects list */}
        <div>
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Prospects</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Click any row with a draft to review and approve the email.
              </p>
            </div>
            <ProspectsList agentId={id} />
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
