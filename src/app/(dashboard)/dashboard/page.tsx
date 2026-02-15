import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard | Cursive',
}
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { Users, TrendingUp, Crown, ArrowRight, Sparkles, Package, CheckCircle } from 'lucide-react'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { RequestMoreLeadsBanner } from '@/components/dashboard/RequestMoreLeadsBanner'
import { sanitizeName, sanitizeCompanyName, sanitizeText } from '@/lib/utils/sanitize-text'
import { DashboardAnimationWrapper, AnimatedSection } from '@/components/dashboard/dashboard-animation-wrapper'

interface DashboardPageProps {
  searchParams: Promise<{ onboarding?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { onboarding } = await searchParams
  const supabase = await createClient()

  // Layout already verified auth — get session for user ID only (no network call)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    // Layout should have caught this, but safety fallback
    redirect('/login')
  }

  // Get user profile (lightweight — layout already fetches full profile for sidebar)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, auth_user_id, workspace_id, email, full_name, plan, role, workspaces(id, name, industry_vertical)')
    .eq('auth_user_id', user.id)
    .single()

  // Type the user data
  const userProfile = userData as {
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
  if (userError || !userProfile || !userProfile.workspace_id) {
    redirect('/welcome')
  }

  // Parallelize all dashboard queries — they all depend only on workspace_id
  const [leadsCountResult, pixelResult, recentLeadsResult, activeSubscription] = await Promise.all([
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id),
    supabase
      .from('audiencelab_pixels')
      .select('pixel_id')
      .eq('workspace_id', userProfile.workspace_id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('leads')
      .select('id, company_name, full_name, first_name, last_name, company_industry, status, created_at, intent_score_calculated, source')
      .eq('workspace_id', userProfile.workspace_id)
      .order('created_at', { ascending: false })
      .limit(5),
    serviceTierRepository.getWorkspaceActiveSubscription(userProfile.workspace_id),
  ])

  const leadsCount = leadsCountResult.count
  const hasPixel = !!pixelResult.data
  const recentLeads = recentLeadsResult.data

  const workspace = userProfile.workspaces

  return (
    <PageContainer maxWidth="wide">
      <DashboardAnimationWrapper>
      {/* Header */}
      <AnimatedSection delay={0}>
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-1">
              Welcome back, {userProfile.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-sm text-muted-foreground">{workspace?.name || 'Your Workspace'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">{userProfile.email}</span>
            <Link
              href="/auth/signout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </GradientCard>
      </AnimatedSection>

      {/* Onboarding Complete Banner */}
      {onboarding === 'complete' && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Onboarding complete!</p>
            <p className="text-sm text-green-700">We&apos;re setting up your tracking pixel and campaigns now. You&apos;ll get an email when everything is live.</p>
          </div>
        </div>
      )}

      {/* Request More Leads Banner - shows when approaching or at limit */}
      <RequestMoreLeadsBanner
        currentLeads={leadsCount || 0}
        leadLimit={100}
        workspaceName={workspace?.name}
      />

      {/* Getting Started Guide for New Users */}
      {leadsCount === 0 && (
        <div className="mb-8 rounded-xl border border-border bg-background p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Getting Started</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Complete these steps to start receiving leads.
          </p>
          <div className="space-y-4">
            {/* Step 1: Account Created - always done */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground line-through text-muted-foreground">Create your account</p>
                <p className="text-xs text-muted-foreground">Done!</p>
              </div>
            </div>
            {/* Step 2: Install pixel */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {hasPixel ? (
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${hasPixel ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  Install pixel on your site
                </p>
                {hasPixel ? (
                  <p className="text-xs text-muted-foreground">Done!</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Add a tracking snippet to identify website visitors</p>
                    <Link
                      href="/settings/pixel"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Set up pixel
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </>
                )}
              </div>
            </div>
            {/* Step 3: Set up targeting */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className={`h-6 w-6 rounded-full border-2 ${hasPixel ? 'border-primary' : 'border-muted-foreground/30'} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${hasPixel ? 'text-primary' : 'text-muted-foreground/50'}`}>3</span>
                </div>
              </div>
              <div>
                <p className={`text-sm font-medium ${hasPixel ? 'text-foreground' : 'text-muted-foreground/70'}`}>Set up your lead preferences</p>
                <p className="text-xs text-muted-foreground mb-2">Tell us what industries and locations you serve</p>
                {hasPixel && (
                  <Link
                    href="/my-leads/preferences"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Set preferences
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
            {/* Step 4: Leads arrive */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground/50">4</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground/70">Leads start arriving</p>
                <p className="text-xs text-muted-foreground">Matched leads will appear in My Leads automatically</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <AnimatedSection delay={0.1}>
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
                {userProfile.plan || 'Free'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
          </div>
        </GradientCard>
      </div>
      </AnimatedSection>

      {/* Service Tier Upsell Banner */}
      {!activeSubscription && userProfile.plan === 'free' && (leadsCount ?? 0) > 0 && (
        <GradientCard variant="prominent" className="mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 rounded-lg bg-white/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Want More Leads?
              </h3>
              <p className="text-white/90 mb-4">
                Get 500+ fresh, verified leads delivered every month with Cursive Data. Starting at $1k/mo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 text-primary font-medium rounded-lg transition-colors"
                >
                  View Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
                >
                  Book Call
                </a>
              </div>
            </div>
          </div>
        </GradientCard>
      )}

      {/* Recent Leads Section */}
      <GradientCard variant="subtle" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Leads</h2>
          <Link
            href="/my-leads"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentLeads && recentLeads.length > 0 ? (
          <div className="space-y-3">
            {recentLeads.map((lead: any) => {
              // SECURITY: Sanitize all user-generated content to prevent XSS
              const displayName = sanitizeCompanyName(lead.company_name) ||
                sanitizeName(lead.full_name) ||
                sanitizeName([lead.first_name, lead.last_name].filter(Boolean).join(' ')) ||
                'Unknown'

              const displayDetails = sanitizeText(lead.company_industry) ||
                sanitizeText(lead.source) ||
                'No details'

              const displayStatus = sanitizeText(lead.status) || 'new'

              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {displayDetails}
                    </p>
                  </div>
                  <GradientBadge
                    className={`flex-shrink-0 ${
                      lead.status === 'new'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : lead.status === 'contacted'
                          ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          : lead.status === 'qualified'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : ''
                    }`}
                  >
                    {displayStatus}
                  </GradientBadge>
                </div>
              )
            })}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/my-leads" className="group">
          <GradientCard variant="subtle" className="hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  My Leads
                </h3>
                <p className="text-sm text-muted-foreground">
                  View and manage your matched leads
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </GradientCard>
        </Link>

        <Link href="/settings/billing" className="group">
          <GradientCard variant="subtle" className="hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Buy Credits
                </h3>
                <p className="text-sm text-muted-foreground">
                  Purchase credits for lead access
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </GradientCard>
        </Link>

        <Link href="/services" className="group">
          <GradientCard variant="prominent" className="hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1 group-hover:text-white/90 transition-colors">
                  Services
                </h3>
                <p className="text-sm text-white/80">
                  Explore done-for-you options
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </GradientCard>
        </Link>
      </div>
      </DashboardAnimationWrapper>
    </PageContainer>
  )
}
