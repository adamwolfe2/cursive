import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OnboardingChecklist } from '@/components/onboarding/checklist'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Users, TrendingUp, Crown, ArrowRight, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    redirect('/login')
  }

  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*, workspaces(*)')
    .eq('auth_user_id', session.user.id)
    .single()

  // Type the user data
  const user = userData as {
    id: string
    auth_user_id: string
    workspace_id: string
    email: string
    full_name: string | null
    plan: string | null
    role: string
    workspaces: {
      id: string
      name: string
      industry_vertical: string | null
    } | null
  } | null

  // If no user profile exists, redirect to onboarding
  if (userError || !user || !user.workspace_id) {
    redirect('/onboarding')
  }

  // Get leads count (safe query)
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user.workspace_id)

  // Get recent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', user.workspace_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const workspace = user.workspaces

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-1">
              Welcome back, {user.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-muted-foreground">{workspace?.name || 'Your Workspace'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
            <Link
              href="/auth/signout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </GradientCard>

      {/* Onboarding Checklist */}
      <div className="mb-8">
        <OnboardingChecklist />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Leads */}
        <GradientCard variant="accent" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Leads</p>
              <p className="text-3xl sm:text-4xl font-bold text-foreground">{leadsCount || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </GradientCard>

        {/* Industry */}
        <GradientCard variant="subtle" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-1">Industry</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                {workspace?.industry_vertical || 'Not set'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </GradientCard>

        {/* Plan */}
        <GradientCard variant="subtle" className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Plan</p>
              <p className="text-3xl sm:text-4xl font-bold text-foreground capitalize">
                {user.plan || 'Free'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
          </div>
        </GradientCard>
      </div>

      {/* Recent Leads Section */}
      <GradientCard variant="subtle" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Leads</h2>
          <Link
            href="/leads"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentLeads && recentLeads.length > 0 ? (
          <div className="space-y-3">
            {recentLeads.map((lead: any) => (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {lead.company_name || lead.contact_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {lead.contact_email || lead.industry || 'No details'}
                  </p>
                </div>
                <GradientBadge className={`flex-shrink-0 ${
                  lead.status === 'new' ? 'bg-primary/10 text-primary border-primary/20' :
                  lead.status === 'contacted' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                  lead.status === 'qualified' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                  ''
                }`}>
                  {lead.status || 'new'}
                </GradientBadge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-foreground font-medium mb-2">No leads yet</p>
            <p className="text-sm text-muted-foreground">
              Leads will appear here once they are added to your workspace
            </p>
          </div>
        )}
      </GradientCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/ai-studio" className="group">
          <GradientCard variant="primary" className="hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  AI Studio
                </h3>
                <p className="text-sm text-muted-foreground">
                  Generate brand content with AI
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </GradientCard>
        </Link>

        <Link href="/crm/leads" className="group">
          <GradientCard variant="subtle" className="hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  CRM
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage leads and pipeline
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </GradientCard>
        </Link>

        <Link href="/settings" className="group">
          <GradientCard variant="subtle" className="hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure your workspace
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </GradientCard>
        </Link>
      </div>
    </PageContainer>
  )
}
