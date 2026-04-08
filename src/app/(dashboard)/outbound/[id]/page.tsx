// Outbound Workflow detail page — the Rox-style stage pipeline view.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { OutboundRunRepository } from '@/lib/repositories/outbound-run.repository'
import { getSendingAccountGate } from '@/lib/services/outbound/email-account-gate.service'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StagePipeline } from '@/components/outbound/stage-pipeline'
import { RunNowButton } from '@/components/outbound/run-now-button'
import { RunStatusBadge } from '@/components/outbound/run-status-badge'
import { ProspectsList } from '@/components/outbound/prospects-list'
import { ChatToggle } from '@/components/outbound/chat-toggle'
import { ConnectEmailBanner } from '@/components/outbound/connect-email-banner'
import { Settings as SettingsIcon, Sparkles, CheckCircle2 } from 'lucide-react'
import type { WorkflowStatsResponse, StageCounts } from '@/types/outbound'

export const metadata: Metadata = { title: 'Outbound Workflow | Cursive' }

export default async function WorkflowDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sample?: string }>
}) {
  const { id } = await params
  const { sample } = await searchParams
  const isSampleReady = sample === 'ready'
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
  const [latestRun, recentRuns, viewRow, sendingGate] = await Promise.all([
    runRepo.findLatest(id, userData.workspace_id),
    runRepo.findRecent(id, userData.workspace_id, 10),
    supabase.from('outbound_pipeline_counts').select('*').eq('agent_id', id).maybeSingle(),
    getSendingAccountGate(userData.workspace_id),
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
    sending_account: {
      ready: sendingGate.ready,
      count: sendingGate.count,
      needs_reconnect: sendingGate.needs_reconnect,
      account: sendingGate.account,
    },
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

      {/* Sample-ready celebration banner — only shown after the user
          completes the 1-click sample flow from /outbound's empty state. */}
      {isSampleReady && (
        <Card className="mb-5 p-5 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Your sample workflow is ready</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We picked 3 enriched leads from your workspace and drafted a personalized
                cold email for each one. Click any prospect on the right to review and edit
                the draft. Connect Gmail in Settings → Email Accounts when you&apos;re ready
                to actually send.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                No credits spent. Real leads. Real Claude-generated drafts.
              </div>
            </div>
          </div>
        </Card>
      )}

      <ConnectEmailBanner agentId={id} />

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
