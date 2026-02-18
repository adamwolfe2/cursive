// Dashboard Layout - Protected layout with navigation

// Force dynamic rendering for all dashboard pages (auth required)
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout'
import { ImpersonationBanner } from '@/components/admin'
import { TierProvider } from '@/lib/hooks/use-tier'
import { BrandThemeWrapper } from '@/components/layout/brand-theme-wrapper'
import { DashboardProvider } from '@/lib/contexts/dashboard-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const hasAdminBypass = cookieStore.get('admin_bypass_waitlist')?.value === 'true'

  const supabase = await createClient()

  // Check authentication using getSession() for fast local JWT check.
  // getSession() reads cookies locally without a network call (only calls network
  // if JWT needs refreshing). This is much faster than getUser() which always
  // makes a network call to Supabase Auth server.
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

  // Try to read cached workspace_id from middleware cookie to flatten all queries
  // into a single Promise.all (avoids 2 sequential DB roundtrips on most navigations)
  const cachedWorkspaceId = cookieStore.get('x-workspace-id')?.value
  const today = new Date().toISOString().split('T')[0]

  // When we have a cached workspace_id, run ALL queries in one parallel batch.
  // Otherwise fall back to sequential (profile first, then workspace queries).
  const [userProfileResult, adminResult, creditsResult, leadsResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, auth_user_id, full_name, email, plan, role, workspace_id, daily_credit_limit, daily_credits_used, workspaces(id, name, subdomain, website_url, branding)')
      .eq('auth_user_id', user.id)
      .single(),
    // Inline admin check to avoid redundant getSession() call in isAdmin()
    user.email
      ? supabase
          .from('platform_admins')
          .select('id')
          .eq('email', user.email)
          .eq('is_active', true)
          .maybeSingle()
          .then(({ data }) => !!data)
      : Promise.resolve(false),
    // Credits — only if we have a cached workspace_id
    cachedWorkspaceId
      ? supabase
          .from('workspace_credits')
          .select('balance')
          .eq('workspace_id', cachedWorkspaceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Today's lead count — only if we have a cached workspace_id
    cachedWorkspaceId
      ? supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', cachedWorkspaceId)
          .gte('delivered_at', `${today}T00:00:00`)
          .lte('delivered_at', `${today}T23:59:59`)
      : Promise.resolve({ count: null }),
  ])

  // Type the user data
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

  // If we had a cache hit, use the parallel results. Otherwise do a sequential fallback.
  let creditBalance = creditsResult?.data?.balance ?? 0
  let todayLeadCount = (leadsResult as { count: number | null })?.count ?? 0

  // Fallback: if no cached workspace_id but user has one, fetch now
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
        {/* Show impersonation banner for admins */}
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
            {children}
          </DashboardProvider>
        </AppShell>
      </BrandThemeWrapper>
    </TierProvider>
  )
}
