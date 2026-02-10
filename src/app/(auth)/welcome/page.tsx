import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Use admin client to bypass RLS (prevents redirect loop)
  const admin = createAdminClient()
  const { data: user } = await admin
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
