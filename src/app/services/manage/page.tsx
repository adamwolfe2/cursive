import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { SubscriptionDetails } from '@/components/services/SubscriptionDetails'
import { DeliveriesList } from '@/components/services/DeliveriesList'

export default async function ManageSubscriptionPage() {
  const supabase = await createClient()

  // Get current user via session (fast local JWT check, no network call)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) {
    redirect('/login?redirect=/services/manage')
  }

  // Get user's workspace
  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id, full_name, email')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!userData?.workspace_id) {
    redirect('/welcome')
  }

  // Get active subscription
  const subscription = await serviceTierRepository.getWorkspaceActiveSubscription(userData.workspace_id)

  if (!subscription) {
    redirect('/services')
  }

  // Get deliveries
  const { data: deliveries } = await supabase
    .from('service_deliveries')
    .select('*')
    .eq('service_subscription_id', subscription.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const tier = (subscription as any).service_tiers

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            Manage Subscription
          </h1>
          <p className="text-xl text-zinc-600">
            View your subscription details, deliveries, and billing
          </p>
        </div>

        {/* Subscription Details */}
        <SubscriptionDetails
          subscription={subscription}
          tier={tier}
          workspaceId={userData.workspace_id}
        />

        {/* Deliveries */}
        <DeliveriesList deliveries={deliveries || []} />
      </div>
    </div>
  )
}
