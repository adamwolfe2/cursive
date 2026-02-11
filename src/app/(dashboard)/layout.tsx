// Dashboard Layout - Protected layout with navigation

// Force dynamic rendering for all dashboard pages (auth required)
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout'
import { ImpersonationBanner } from '@/components/admin'
import { isAdmin } from '@/lib/auth/admin'
import { TierProvider } from '@/lib/hooks/use-tier'
import { BrandThemeWrapper } from '@/components/layout/brand-theme-wrapper'
import { CrispChat } from '@/components/crisp-chat'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const hasAdminBypass = cookieStore.get('admin_bypass_waitlist')?.value === 'true'

  const supabase = await createClient()

  // Check authentication
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
              }}
              workspace={{
                name: mockUser.workspaces.name,
                logoUrl: null,
              }}
            >
              {children}
            </AppShell>
            <CrispChat />
          </BrandThemeWrapper>
        </TierProvider>
      )
    }
  }

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: userData } = await supabase
    .from('users')
    .select('*, workspaces(*)')
    .eq('auth_user_id', user.id)
    .single()

  // Type the user data
  const userProfile = userData as {
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

  if (!userProfile) {
    redirect('/welcome')
  }

  // Fetch workspace credit balance from workspace_credits table
  let creditBalance = 0
  if (userProfile.workspace_id) {
    const { data: creditsData } = await supabase
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', userProfile.workspace_id)
      .single()

    creditBalance = creditsData?.balance ?? 0
  }

  // Check if user is an admin (for showing impersonation banner)
  const userIsAdmin = await isAdmin()

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
        >
          {children}
        </AppShell>
        <CrispChat />
      </BrandThemeWrapper>
    </TierProvider>
  )
}
