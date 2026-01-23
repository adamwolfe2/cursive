// Dashboard Layout - Protected layout with navigation

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

  const workspace = user.workspaces as { name: string; subdomain?: string } | null

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
              subdomain: workspace.subdomain,
            }
          : undefined
      }
    >
      {children}
    </AppShell>
  )
}
