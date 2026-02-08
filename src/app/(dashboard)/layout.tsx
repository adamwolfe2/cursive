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
  const user = userData as {
    id: string
    full_name: string | null
    email: string
    plan: string | null
    role: string
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

  if (!user) {
    redirect('/welcome')
  }

  // Check if user is an admin (for showing impersonation banner)
  const userIsAdmin = await isAdmin()

  const workspace = user.workspaces as {
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
      {/* Show impersonation banner for admins */}
      {userIsAdmin && <ImpersonationBanner />}

      <AppShell
        user={{
          name: user.full_name || 'User',
          email: user.email,
          plan: user.plan || 'free',
          role: user.role,
          creditsRemaining: (user.daily_credit_limit || 0) - (user.daily_credits_used || 0),
          totalCredits: user.daily_credit_limit || 0,
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
    </TierProvider>
  )
}
