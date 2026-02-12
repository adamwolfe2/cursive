import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Welcome | Cursive',
}
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

    // User has session but no workspace — they're returning from OAuth.
    // Show AutoSubmitOnboarding which reads form data from sessionStorage.
    // If sessionStorage is empty (e.g. user navigated here directly),
    // AutoSubmitOnboarding will redirect them back to the quiz flow.
    return <AutoSubmitOnboarding isMarketplace={isMarketplace} />
  }

  // No session — show the quiz flow
  return <OnboardingFlow isMarketplace={isMarketplace} />
}
