import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OnboardingFlow } from './onboarding-flow'
import { AutoSubmitOnboarding } from './auto-submit-onboarding'

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; returning?: string }>
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const params = await searchParams
  const isMarketplace = params.source === 'marketplace'
  const isReturning = params.returning === 'true'

  if (session) {
    // Use admin client to bypass RLS
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

    // User has session but no workspace — they're returning from OAuth
    if (isReturning) {
      return <AutoSubmitOnboarding isMarketplace={isMarketplace} />
    }
  }

  // No session or session without workspace — show the quiz flow
  return <OnboardingFlow isMarketplace={isMarketplace} />
}
