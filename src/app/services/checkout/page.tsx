import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceCheckout } from '@/lib/stripe/service-checkout'
import { supportsDirectCheckout, VENTURE_STUDIO_CALENDAR_URL } from '@/lib/stripe/service-products'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

interface CheckoutPageProps {
  searchParams: Promise<{
    tier?: string
  }>
}

/**
 * Direct Checkout Page
 *
 * Usage from website:
 * - /services/checkout?tier=cursive-data
 * - /services/checkout?tier=cursive-outbound
 * - /services/checkout?tier=cursive-pipeline
 * - /services/checkout?tier=cursive-venture-studio
 */
export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { tier: tierSlug } = await searchParams

  if (!tierSlug) {
    redirect('/')
  }

  // Check if this tier uses calendar booking (Venture Studio)
  if (!supportsDirectCheckout(tierSlug)) {
    redirect(VENTURE_STUDIO_CALENDAR_URL)
  }

  const supabase = await createClient()

  // Get current user via session (fast local JWT check, no network call)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // If not logged in, redirect to sign up first
  if (!user) {
    redirect(`/signup?redirect=${encodeURIComponent(`/services/checkout?tier=${tierSlug}`)}`)
  }

  // Get user's workspace
  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!userData?.workspace_id) {
    redirect('/welcome')
  }

  // Check if user already has this subscription
  const existingSubscription = await serviceTierRepository.getWorkspaceActiveSubscription(userData.workspace_id)
  if (existingSubscription) {
    redirect('/services/manage')
  }

  // Get tier details
  const tier = await serviceTierRepository.getTierBySlug(tierSlug)
  if (!tier) {
    redirect('/')
  }

  try {
    // Create Stripe checkout session
    const checkoutUrl = await createServiceCheckout({
      workspaceId: userData.workspace_id,
      userId: user.id,
      serviceTierSlug: tierSlug,
    })

    redirect(checkoutUrl.checkout_url)
  } catch (error) {
    safeError('[CheckoutPage]', 'Checkout error:', error)
    redirect('/?error=checkout_failed')
  }
}
