// App Layout - Protected layout with navigation
// Used by email-sequences, segment-builder, analytics, and other app pages

// Force dynamic rendering for all app pages (auth required)
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout'
import { ImpersonationBanner } from '@/components/admin'
import { TierProvider } from '@/lib/hooks/use-tier'
import { BrandThemeWrapper } from '@/components/layout/brand-theme-wrapper'
import { DashboardProvider } from '@/lib/contexts/dashboard-context'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const hasAdminBypass = cookieStore.get('admin_bypass_waitlist')?.value === 'true'

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Development-only: admin bypass cookie for local testing
  if (process.env.NODE_ENV === 'development') {
    if (!user && hasAdminBypass) {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Admin',
        email: 'adam@meetcursive.com',
        plan: 'pro' as const,
        role: 'owner',
        daily_credit_limit: 10000,
        daily_credits_used: 0,
        workspaces: {
          name: 'Admin Workspace',
          subdomain: 'admin',
          website_url: null,
          branding: null,
        },
      }

      return (
        <TierProvider>
          <BrandThemeWrapper>
            <ImpersonationBanner />
            <AppShell
              user={{
                name: mockUser.full_name,
                email: mockUser.email,
                plan: mockUser.plan,
                role: mockUser.role,
                creditsRemaining: mockUser.daily_credit_limit,
                totalCredits: mockUser.daily_credit_limit,
                avatarUrl: null,
              }}
              workspace={{
                name: mockUser.workspaces.name,
                logoUrl: null,
              }}
            >
              {children}
            </AppShell>
          </BrandThemeWrapper>
        </TierProvider>
      )
    }
  }

  if (!user) {
    redirect('/login')
  }

  const cachedWorkspaceId = cookieStore.get('x-workspace-id')?.value
  const today = new Date().toISOString().split('T')[0]

  const [userProfileResult, adminResult, creditsResult, leadsResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, auth_user_id, full_name, email, plan, role, workspace_id, daily_credit_limit, daily_credits_used, workspaces(id, name, subdomain, website_url, branding)')
      .eq('auth_user_id', user.id)
      .maybeSingle(),
    user.email
      ? supabase
          .from('platform_admins')
          .select('id')
          .eq('email', user.email)
          .eq('is_active', true)
          .maybeSingle()
          .then(({ data }) => !!data)
      : Promise.resolve(false),
    cachedWorkspaceId
      ? supabase
          .from('workspace_credits')
          .select('balance')
          .eq('workspace_id', cachedWorkspaceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    cachedWorkspaceId
      ? supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', cachedWorkspaceId)
          .gte('delivered_at', `${today}T00:00:00`)
          .lte('delivered_at', `${today}T23:59:59`)
      : Promise.resolve({ count: null }),
  ])

  const userProfile = userProfileResult.data as {
    id: string
    full_name: string | null
    email: string
    plan: string | null
    role: string
    workspace_id: string | null
    daily_credit_limit: number
    daily_credits_used: number
    workspaces: {
      name: string
      subdomain?: string
      website_url?: string | null
      branding?: {
        logo_url?: string | null
        favicon_url?: string | null
        primary_color?: string
      } | null
    } | null
  } | null

  const userIsAdmin = adminResult

  if (!userProfile) {
    redirect('/welcome')
  }

  let creditBalance = creditsResult?.data?.balance ?? 0
  let todayLeadCount = (leadsResult as { count: number | null })?.count ?? 0

  if (!cachedWorkspaceId && userProfile.workspace_id) {
    const [fallbackCredits, fallbackLeads] = await Promise.all([
      supabase
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', userProfile.workspace_id)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', userProfile.workspace_id)
        .gte('delivered_at', `${today}T00:00:00`)
        .lte('delivered_at', `${today}T23:59:59`),
    ])
    creditBalance = fallbackCredits.data?.balance ?? 0
    todayLeadCount = fallbackLeads.count ?? 0
  }

  const workspace = userProfile.workspaces as {
    name: string
    subdomain?: string
    website_url?: string | null
    branding?: {
      logo_url?: string | null
      favicon_url?: string | null
      primary_color?: string
    } | null
  } | null

  return (
    <TierProvider>
      <BrandThemeWrapper>
        {userIsAdmin && <ImpersonationBanner />}

        <AppShell
          user={{
            name: userProfile.full_name || 'User',
            email: userProfile.email,
            plan: userProfile.plan || 'free',
            role: userProfile.role,
            creditsRemaining: creditBalance,
            totalCredits: creditBalance,
            avatarUrl: null,
          }}
          workspace={
            workspace
              ? {
                  name: workspace.name,
                  logoUrl: workspace.branding?.logo_url || workspace.branding?.favicon_url || null,
                }
              : undefined
          }
          todayLeadCount={todayLeadCount}
        >
          <DashboardProvider
            value={{
              userProfile: {
                id: userProfile.id,
                authUserId: user.id,
                fullName: userProfile.full_name,
                email: userProfile.email,
                plan: userProfile.plan,
                role: userProfile.role,
                workspaceId: userProfile.workspace_id,
                dailyCreditLimit: userProfile.daily_credit_limit,
                dailyCreditsUsed: userProfile.daily_credits_used,
              },
              workspace: workspace
                ? {
                    name: workspace.name,
                    subdomain: workspace.subdomain,
                    websiteUrl: workspace.website_url,
                    branding: workspace.branding,
                  }
                : null,
              creditBalance,
              todayLeadCount,
            }}
          >
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </DashboardProvider>
        </AppShell>
      </BrandThemeWrapper>
    </TierProvider>
  )
}
