// Dashboard Home Page

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PageContainer, PageHeader, Section } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', session!.user.id)
    .single()

  // Get queries count
  const { count: queriesCount } = await supabase
    .from('queries')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user!.workspace_id)

  // Get leads count
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user!.workspace_id)

  // Get leads by enrichment status
  const { count: enrichedCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user!.workspace_id)
    .eq('enrichment_status', 'enriched')

  // Get recent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', user!.workspace_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent queries
  const { data: recentQueries } = await supabase
    .from('queries')
    .select('*')
    .eq('workspace_id', user!.workspace_id)
    .order('created_at', { ascending: false })
    .limit(3)

  const creditsUsed = user!.daily_credits_used
  const creditsTotal = user!.daily_credit_limit
  const creditsRemaining = creditsTotal - creditsUsed
  const creditsPercentage = (creditsUsed / creditsTotal) * 100

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'there'}`}
        description="Here's an overview of your lead generation activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Active Queries"
          value={queriesCount || 0}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Leads"
          value={leadsCount || 0}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Enriched Leads"
          value={enrichedCount || 0}
          description={leadsCount ? `${Math.round(((enrichedCount || 0) / leadsCount) * 100)}% of total` : undefined}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Credits Today</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {creditsRemaining.toLocaleString()}
              </p>
              <div className="mt-3">
                <Progress value={creditsPercentage} variant={creditsPercentage > 80 ? 'warning' : 'default'} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {creditsUsed} of {creditsTotal} used
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Section title="Quick Actions">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link href="/queries/new">
                <Card variant="interactive" padding="none" className="h-full">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Create Query</p>
                      <p className="text-sm text-muted-foreground">Track a new topic</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/data">
                <Card variant="interactive" padding="none" className="h-full">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-success-foreground">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">View Leads</p>
                      <p className="text-sm text-muted-foreground">Browse your data</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/people-search">
                <Card variant="interactive" padding="none" className="h-full">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info text-info-foreground">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">People Search</p>
                      <p className="text-sm text-muted-foreground">Find contacts</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </Section>

          {/* Recent Leads */}
          <Section
            title="Recent Leads"
            actions={
              recentLeads && recentLeads.length > 0 ? (
                <Link href="/data" className="text-sm font-medium text-primary hover:text-primary/80">
                  View all
                </Link>
              ) : null
            }
          >
            <Card padding="none">
              {recentLeads && recentLeads.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentLeads.map((lead) => {
                    const companyData = lead.company_data as { name?: string; industry?: string } | null
                    return (
                      <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground font-medium">
                            {(companyData?.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {companyData?.name || 'Unknown Company'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {companyData?.industry || 'No industry'}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            lead.enrichment_status === 'enriched'
                              ? 'success'
                              : lead.enrichment_status === 'pending'
                                ? 'warning'
                                : 'muted'
                          }
                        >
                          {lead.enrichment_status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="No leads yet"
                  description="Create a query to start generating leads"
                  action={{ label: 'Create Query', href: '/queries/new' }}
                />
              )}
            </Card>
          </Section>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Plan Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plan Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge variant={user!.plan === 'pro' ? 'default' : 'muted'} size="lg">
                  {user!.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </Badge>
                {user!.plan !== 'pro' && (
                  <Link href="/pricing">
                    <Button size="sm">Upgrade</Button>
                  </Link>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Queries</span>
                  <span className="font-medium">{queriesCount || 0} / {user!.plan === 'pro' ? '5' : '1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Credits</span>
                  <span className="font-medium">{creditsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Delivery</span>
                  <span className="font-medium">{user!.plan === 'pro' ? 'Multi-channel' : 'Basic'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Queries */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Queries</CardTitle>
                <Link href="/queries" className="text-sm font-medium text-primary hover:text-primary/80">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentQueries && recentQueries.length > 0 ? (
                <div className="space-y-3">
                  {recentQueries.map((query) => (
                    <Link
                      key={query.id}
                      href={`/queries/${query.id}`}
                      className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground text-sm">{query.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Created {new Date(query.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={query.status === 'active' ? 'success' : 'muted'}
                          size="sm"
                          dot
                        >
                          {query.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">No queries yet</p>
                  <Link href="/queries/new">
                    <Button size="sm">Create Query</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Getting Started */}
          {queriesCount === 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Get Started</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first query to start tracking companies researching topics you care about.
                    </p>
                    <Link href="/queries/new">
                      <Button className="mt-3" size="sm">
                        Create Your First Query
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
