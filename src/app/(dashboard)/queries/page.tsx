// Queries List Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QueryRepository } from '@/lib/repositories/query.repository'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'

export default async function QueriesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get queries
  const queryRepo = new QueryRepository()
  const queries = await queryRepo.findByWorkspace(user.workspace_id)

  const activeCount = queries.filter((q) => (q as any).status === 'active').length
  const queryLimit = user.plan === 'pro' ? 5 : 1
  const usagePercentage = (activeCount / queryLimit) * 100

  return (
    <PageContainer>
      <PageHeader
        title="Queries"
        description="Manage your topic tracking queries"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Queries' },
        ]}
        actions={
          <Link href="/queries/new">
            <Button>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Query
            </Button>
          </Link>
        }
      />

      {/* Query Limit Info */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-foreground">Query Usage</p>
            <p className="text-sm text-muted-foreground">
              {activeCount} of {queryLimit} active {queryLimit === 1 ? 'query' : 'queries'}
            </p>
          </div>
          {user.plan === 'free' && activeCount >= queryLimit && (
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
        <Progress value={usagePercentage} variant={usagePercentage >= 100 ? 'warning' : 'default'} />
      </Card>

      {/* Queries List */}
      {queries.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title="No queries yet"
            description="Create your first query to start tracking companies researching topics you care about."
            action={{ label: 'Create Query', href: '/queries/new' }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queries.map((query: any) => (
            <Link key={query.id} href={`/queries/${query.id}`}>
              <Card variant="interactive" className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-medium text-foreground">
                      {query.name || query.global_topics?.topic}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground capitalize">
                      {query.global_topics?.category}
                    </p>
                  </div>
                  <Badge
                    variant={
                      query.status === 'active'
                        ? 'success'
                        : query.status === 'paused'
                          ? 'warning'
                          : 'muted'
                    }
                    dot
                  >
                    {query.status}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Leads</span>
                    <span className="font-medium text-foreground">
                      {(query.total_leads_generated || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-medium text-foreground">
                      {(query.leads_this_week || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {query.last_run_at && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Last run: {new Date(query.last_run_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
