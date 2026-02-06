import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { OnboardingForm } from '@/components/services/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/services/onboarding')
  }

  // Get user's workspace
  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single()

  if (!userData?.workspace_id) {
    redirect('/welcome')
  }

  // Get active subscription
  const subscription = await serviceTierRepository.getWorkspaceActiveSubscription(userData.workspace_id)

  if (!subscription) {
    redirect('/services')
  }

  // If already completed, redirect to dashboard
  if (subscription.onboarding_completed) {
    redirect('/dashboard?onboarding=complete')
  }

  const tier = subscription.service_tiers

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Let's get your first leads rolling
          </h1>
          <p className="text-xl text-zinc-600">
            Tell me about your ideal customer so I can deliver leads that actually convert.
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            This takes about 10 minutes. You're setting up {tier?.name}.
          </p>
        </div>

        <OnboardingForm
          subscriptionId={subscription.id}
          tierName={tier?.name || 'your subscription'}
          initialData={subscription.onboarding_data as Record<string, any> || {}}
        />
      </div>
    </div>
  )
}
