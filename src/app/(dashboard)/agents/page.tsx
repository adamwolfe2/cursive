// AI Agents List Page

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { AgentsListWrapper } from '@/components/agents/agents-list-wrapper'

export const metadata: Metadata = { title: 'AI Agents | Cursive' }

export default async function AgentsPage() {
  // Layout already verified auth — get session for workspace lookup
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()
  if (!userData?.workspace_id) redirect('/welcome')

  // Get agents
  const agentRepo = new AgentRepository()
  const agents = await agentRepo.findByWorkspace(userData.workspace_id)

  return (
    <PageContainer>
      <PageHeader
        title="AI Agents"
        description="Manage your AI email response agents"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Agents' },
        ]}
        actions={
          <Link href="/agents/new">
            <Button>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Agent
            </Button>
          </Link>
        }
      />

      <AgentsListWrapper>
        {/* Info Card */}
        <Card className="mb-6 p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">AI Email Agents</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create AI agents to automatically respond to email replies from your outreach campaigns.
              Configure instructions, knowledge base, and tone to match your brand.
            </p>
          </div>
        </div>
      </Card>

      {/* Agents List */}
      {agents.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="No agents yet"
            description="Create your first AI agent to start automating email responses."
            action={{ label: 'Create Agent', href: '/agents/new' }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card variant="interactive" className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-medium text-foreground">
                      {agent.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground capitalize">
                      {agent.ai_provider} / {agent.ai_model}
                    </p>
                  </div>
                  <Badge variant="muted" className="capitalize">
                    {agent.tone}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">AI Provider</span>
                    <span className="font-medium text-foreground capitalize">
                      {agent.ai_provider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email Bison</span>
                    <span className="font-medium text-foreground">
                      {agent.emailbison_api_key ? (
                        <Badge variant="success" dot>Connected</Badge>
                      ) : (
                        <Badge variant="muted">Not connected</Badge>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(agent.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </AgentsListWrapper>
    </PageContainer>
  )
}
