// Outbound Agent — workflows list page
// Reuses the dashboard shell + Cursive's white+blue UI tokens.
// Mirrors the structure of `src/app/(dashboard)/agents/page.tsx`.

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { getSendingAccountGate } from '@/lib/services/outbound/email-account-gate.service'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WorkflowCard } from '@/components/outbound/workflow-card'
import { ConnectEmailListBanner } from '@/components/outbound/connect-email-list-banner'
import { TrySampleCard } from '@/components/outbound/try-sample-card'
import { Rocket, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Outbound Agent | Cursive' }

export default async function OutboundListPage() {
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
  const [workflows, sendingGate] = await Promise.all([
    agentRepo.findOutboundEnabled(userData.workspace_id),
    getSendingAccountGate(userData.workspace_id),
  ])

  return (
    <PageContainer>
      <PageHeader
        title="Outbound Agent"
        description="AI-driven prospecting, drafting, and outreach. Powered by Cursive's high-intent data."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Outbound Agent' },
        ]}
        actions={
          <Link href="/outbound/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </Link>
        }
      />

      <ConnectEmailListBanner
        status={{
          ready: sendingGate.ready,
          count: sendingGate.count,
          needs_reconnect: sendingGate.needs_reconnect,
          account: sendingGate.account,
        }}
      />

      {workflows.length === 0 ? (
        <>
          {/* The aha-moment card — first-run users skip the form-configure
              friction entirely and get real drafts against real leads in
              under 30 seconds. */}
          <TrySampleCard />

          {/* Secondary info — "how it works" explainer for users who want
              to understand before clicking. */}
          <Card className="mt-6 p-5 bg-muted/30 border-border">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">How it works</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define your ICP, persona, and product in three sentences. Click Run, and Cursive
                  prospects high-intent leads from AudienceLab, enriches each one, and drafts a
                  personalized email — all waiting for your one-click approval. Connect your
                  Gmail when you&apos;re ready to send.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map(agent => (
            <WorkflowCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
