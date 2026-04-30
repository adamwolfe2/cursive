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
  searchParams: Promise<{
    source?: string
    returning?: string
    ref?: string
    email?: string
    claim?: string
    domain?: string
  }>
}) {
  const supabase = await createClient()
  // SECURITY: Use getUser() for server-side JWT verification instead of getSession()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const params = await searchParams
  const isMarketplace = params.source === 'marketplace'
  const isReturning = params.returning === 'true'
  // ?ref=call: coming from Darren's post-call recap email link
  const isCallProspect = params.ref === 'call'
  // ?email=: pre-fill the email field if coming from the recap email
  const prefilledEmail = params.email || ''
  // ?claim=: pixel_id to claim deterministically after signup. Stored in
  // localStorage by OnboardingFlow so AutoSubmitOnboarding can pass it to
  // /api/pixel/provision after the workspace is created.
  const claimPixelId = params.claim || ''
  // ?domain=: the pixel's domain (e.g. "acmecorp.com"). Used to pre-fill
  // company name / industry in the signup form and to seed the setup wizard.
  const prefilledDomain = params.domain || ''

  if (authUser) {
    // Use admin client to bypass RLS
    const admin = createAdminClient()
    const { data: user } = await admin
      .from('users')
      .select('workspace_id, role')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    // User already has a workspace — send them into the setup wizard.
    // /setup checks whether pixel + targeting are configured and either runs
    // the remaining steps or auto-forwards to /dashboard when everything is done.
    if (user?.workspace_id) {
      redirect('/setup')
    }

    // User has session but no workspace — they're returning from OAuth.
    // Show AutoSubmitOnboarding which reads form data from localStorage.
    // If localStorage is empty (e.g. user navigated here directly),
    // AutoSubmitOnboarding will redirect them back to the quiz flow.
    return <AutoSubmitOnboarding isMarketplace={isMarketplace} isReturning={isReturning} />
  }

  // No session — show the onboarding flow. For call prospects we skip the
  // quiz and go straight to the signup form.
  return (
    <OnboardingFlow
      isMarketplace={isMarketplace}
      isCallProspect={isCallProspect}
      prefilledEmail={prefilledEmail}
      claimPixelId={claimPixelId}
      prefilledDomain={prefilledDomain}
    />
  )
}
