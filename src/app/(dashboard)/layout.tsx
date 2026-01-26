// Dashboard Layout - Protected layout with navigation

// Force dynamic rendering for all dashboard pages (auth required)
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user profile
  const { data: user } = await supabase
    .from('users')
    .select('*, workspaces(*)')
    .eq('auth_user_id', session.user.id)
    .single()

  if (!user) {
    redirect('/onboarding')
  }

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
    <AppShell
      user={{
        name: user.full_name,
        email: user.email,
        plan: user.plan,
        creditsRemaining: user.daily_credit_limit - user.daily_credits_used,
        totalCredits: user.daily_credit_limit,
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
  )
}
