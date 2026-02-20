// Queries List Page

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QueryRepository } from '@/lib/repositories/query.repository'
import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-states'
import { Plus, Search } from 'lucide-react'

export const metadata: Metadata = { title: 'Queries | Cursive' }

export default async function QueriesPage() {
  // Layout already verified auth — get session + profile for this page's needs
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, workspace_id, plan, role')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (!userData?.workspace_id) {
    redirect('/welcome')
  }

  const user = userData as { id: string; workspace_id: string; plan: string | null; role: string }

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
        action={
          <Link href="/queries/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </Link>
        }
      />

      {/* Query Limit Info */}
      <GradientCard variant="accent" className="mb-6">
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
      </GradientCard>

      {/* Queries List */}
      {queries.length === 0 ? (
        <>
          <EmptyState
            icon={Search}
            title="No queries yet"
            description="Create your first query to start tracking companies researching topics you care about."
          />
          <div className="flex justify-center mt-4">
            <Link href="/queries/new">
              <Button size="lg">Create Query</Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queries.map((query: any) => (
            <Link key={query.id} href={`/queries/${query.id}`}>
              <GradientCard
                variant="subtle"
                className="h-full hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-medium text-foreground">
                      {query.name || query.global_topics?.topic}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground capitalize">
                      {query.global_topics?.category}
                    </p>
                  </div>
                  <GradientBadge className={`flex-shrink-0 ml-2 ${
                    query.status === 'active'
                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                      : query.status === 'paused'
                        ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        : ''
                  }`}>
                    {query.status}
                  </GradientBadge>
                </div>

                <div className="space-y-2 py-3 border-t border-border">
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
                  <div className="mt-3 pt-3 border-t border-border">
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
              </GradientCard>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
