// Dashboard Layout - Protected layout with navigation

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // SECURITY: Use getUser() for server-side JWT verification.
  // getSession() trusts the client cookie without verification, which can fail
  // to refresh expired tokens in SSR context, causing spurious redirects.
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
                isPartner: false,
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

  // Cache the user profile for 5 minutes — it changes rarely (plan upgrades, name edits).
  // Key includes auth user ID so each user gets their own cache slot.
  const getUserProfile = unstable_cache(
    async (authUserId: string) => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('users')
        .select('id, auth_user_id, full_name, email, plan, role, workspace_id, daily_credit_limit, daily_credits_used, is_partner, workspaces(id, name, subdomain, website_url, branding)')
        .eq('auth_user_id', authUserId)
        .maybeSingle()
      return data
    },
    ['user-profile'],
    { revalidate: 300, tags: [`user-profile-${user.id}`] }
  )

  // Cache the admin check for 5 minutes
  const getIsAdmin = unstable_cache(
    async (email: string) => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('platform_admins')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()
      return !!data
    },
    ['is-admin'],
    { revalidate: 300, tags: [`is-admin-${user.email}`] }
  )

  // Cache credits for 2 minutes (balance changes on enrichment, not per-request)
  const getCredits = unstable_cache(
    async (wsId: string) => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('workspace_credits')
        .select('balance')
        .eq('workspace_id', wsId)
        .maybeSingle()
      return data
    },
    ['workspace-credits'],
    { revalidate: 120, tags: [`workspace-credits-${cachedWorkspaceId ?? 'unknown'}`] }
  )

  // Cache today's lead count from stats table (refreshed every 15 min)
  const getTodayLeads = unstable_cache(
    async (wsId: string) => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('workspace_stats_cache')
        .select('today_leads')
        .eq('workspace_id', wsId)
        .maybeSingle()
      return data?.today_leads ?? 0
    },
    ['today-leads'],
    { revalidate: 120, tags: [`workspace-stats-${cachedWorkspaceId ?? 'unknown'}`] }
  )

  // Cache hot leads count (intent ≥70, not yet won/lost) — drives sidebar badge urgency
  const getHotLeads = unstable_cache(
    async (wsId: string) => {
      const admin = createAdminClient()
      const { count } = await admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', wsId)
        .gte('intent_score_calculated', 70)
        .not('status', 'in', '("won","lost")')
      return count ?? 0
    },
    ['hot-leads-count'],
    { revalidate: 120, tags: [`workspace-stats-${cachedWorkspaceId ?? 'unknown'}`] }
  )

  const workspaceIdForQueries = cachedWorkspaceId ?? ''

  const [userProfileData, userIsAdmin, creditsData, todayLeadsFromStats, hotLeadsFromStats] = await Promise.all([
    getUserProfile(user.id),
    user.email ? getIsAdmin(user.email) : Promise.resolve(false),
    workspaceIdForQueries ? getCredits(workspaceIdForQueries) : Promise.resolve(null),
    workspaceIdForQueries ? getTodayLeads(workspaceIdForQueries) : Promise.resolve(0),
    workspaceIdForQueries ? getHotLeads(workspaceIdForQueries) : Promise.resolve(0),
  ])

  const userProfile = userProfileData as {
    id: string
    full_name: string | null
    email: string
    plan: string | null
    role: string
    workspace_id: string | null
    daily_credit_limit: number
    daily_credits_used: number
    is_partner: boolean
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

  if (!userProfile) {
    redirect('/welcome')
  }

  let creditBalance = creditsData?.balance ?? 0
  let todayLeadCount = todayLeadsFromStats ?? 0
  let hotLeadCount = hotLeadsFromStats ?? 0

  // Fallback: if no cached workspace_id but user has one, fetch now
  if (!cachedWorkspaceId && userProfile.workspace_id) {
    const [fallbackCredits, fallbackLeads, fallbackHotLeads] = await Promise.all([
      getCredits(userProfile.workspace_id),
      getTodayLeads(userProfile.workspace_id),
      getHotLeads(userProfile.workspace_id),
    ])
    creditBalance = fallbackCredits?.balance ?? 0
    todayLeadCount = fallbackLeads ?? 0
    hotLeadCount = fallbackHotLeads ?? 0
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
            isPartner: userProfile.is_partner,
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
          hotLeadCount={hotLeadCount > 0 ? hotLeadCount : undefined}
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
