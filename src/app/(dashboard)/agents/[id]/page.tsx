// Agent Detail Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get agent with details
  const agentRepo = new AgentRepository()
  const result = await agentRepo.findByIdWithDetails(id, user.workspace_id)

  if (!result) {
    notFound()
  }

  const { agent, instructions, kbEntries, threadCount, taskCount } = result

  return (
    <PageContainer>
      <PageHeader
        title={agent.name}
        description="Manage agent settings, instructions, and knowledge base"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Agents', href: '/agents' },
          { label: agent.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Threads</p>
              <p className="text-2xl font-semibold">{threadCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-2xl font-semibold">{taskCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instructions</p>
              <p className="text-2xl font-semibold">{instructions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">KB Entries</p>
              <p className="text-2xl font-semibold">{kbEntries.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent Configuration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">AI Provider</span>
              <span className="font-medium capitalize">{agent.ai_provider}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">AI Model</span>
              <span className="font-medium">{agent.ai_model}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Tone</span>
              <Badge variant="muted" className="capitalize">{agent.tone}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Email Bison</span>
              {agent.emailbison_api_key ? (
                <Badge variant="success" dot>Connected</Badge>
              ) : (
                <Badge variant="muted">Not connected</Badge>
              )}
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">OpenAI Key</span>
              {agent.openai_api_key ? (
                <Badge variant="success" dot>Custom</Badge>
              ) : (
                <Badge variant="muted">Default</Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Instructions</h3>
            <Button variant="outline" size="sm">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Button>
          </div>
          {instructions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No instructions yet. Add instructions to guide the AI responses.
            </p>
          ) : (
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div
                  key={instruction.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm flex-1">{instruction.content}</p>
                  {!instruction.enabled && (
                    <Badge variant="muted" size="sm">Disabled</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Knowledge Base */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Knowledge Base</h3>
            <Button variant="outline" size="sm">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Entry
            </Button>
          </div>
          {kbEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No knowledge base entries yet. Add entries to provide context for AI responses.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {kbEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{entry.title}</h4>
                    {entry.is_golden && (
                      <Badge variant="warning" size="sm">Golden</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {entry.content}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="muted" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
