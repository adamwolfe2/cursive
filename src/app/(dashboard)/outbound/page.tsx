// Outbound Agent — workflows list page
// Reuses the dashboard shell + Cursive's white+blue UI tokens.
// Mirrors the structure of `src/app/(dashboard)/agents/page.tsx`.

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { WorkflowCard } from '@/components/outbound/workflow-card'
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
  const workflows = await agentRepo.findOutboundEnabled(userData.workspace_id)

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

      {/* Hero info card — white background, primary-blue accent */}
      <Card className="mb-6 p-5 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">How it works</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Define your ICP, persona, and product in three sentences. Click Run, and Cursive
              prospects high-intent leads from AudienceLab, enriches each one, and drafts a
              personalized email — all waiting for your one-click approval.
            </p>
          </div>
        </div>
      </Card>

      {workflows.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<Rocket className="h-8 w-8" />}
            title="No outbound workflows yet"
            description="Create your first workflow to start prospecting in under a minute."
            action={{ label: 'Create Workflow', href: '/outbound/new' }}
          />
        </Card>
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
