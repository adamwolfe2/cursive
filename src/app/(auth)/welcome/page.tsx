import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WelcomeForm from './welcome-form'

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: { source?: string }
}) {
  const supabase = await createClient()

  // Server-side auth check
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Server-side workspace check using authenticated user context
  const { data: user, error } = await supabase
    .from('users')
    .select('workspace_id, role')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  // If user already has workspace, redirect to dashboard
  if (user?.workspace_id) {
    redirect('/dashboard')
  }

  // If error or no workspace, show onboarding form
  const isMarketplace = searchParams.source === 'marketplace'

  return <WelcomeForm isMarketplace={isMarketplace} />
}
