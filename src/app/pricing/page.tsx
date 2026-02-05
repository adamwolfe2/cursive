/**
 * Pricing Page
 * Cursive Platform - Interactive pricing with live Stripe checkout
 */

import { createClient } from '@/lib/supabase/server'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for B2B lead intelligence.',
}

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  features: string[]
  sort_order: number
}

export default async function PricingPage() {
  const supabase = await createClient()

  // Fetch subscription plans from database
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch subscription plans:', error)
  }

  // Mark Pro plan as popular
  const plansWithPopular = (plans || []).map(plan => ({
    ...plan,
    is_popular: plan.name === 'pro',
  }))

  // Get current user's plan if authenticated
  let currentPlan: string | undefined
  try {
    const user = await getCurrentUser()
    if (user) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('plan')
        .eq('id', user.workspace_id)
        .single()

      currentPlan = workspace?.plan || 'free'
    }
  } catch (error) {
    // User not authenticated, that's fine
    currentPlan = undefined
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            Start free and upgrade when you need more leads. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards plans={plansWithPopular} currentPlan={currentPlan} />

        {/* FAQ Section */}
        <div className="mt-24 max-w-none sm:max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-zinc-900 text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors">
              <h3 className="font-semibold text-zinc-900 mb-2 text-lg">
                What counts as a lead?
              </h3>
              <p className="text-zinc-600">
                A lead is a company we identify that matches your query criteria and shows intent signals for your topic. Each enriched contact at that company also counts as one lead.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors">
              <h3 className="font-semibold text-zinc-900 mb-2 text-lg">
                Can I cancel anytime?
              </h3>
              <p className="text-zinc-600">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period, and you won't be charged again.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors">
              <h3 className="font-semibold text-zinc-900 mb-2 text-lg">
                Do unused leads roll over?
              </h3>
              <p className="text-zinc-600">
                Monthly lead limits reset each billing cycle and do not roll over. This ensures you're always getting fresh, relevant leads matched to your current needs.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors">
              <h3 className="font-semibold text-zinc-900 mb-2 text-lg">
                What payment methods do you accept?
              </h3>
              <p className="text-zinc-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor. Annual plans can also be paid via ACH transfer or wire.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors">
              <h3 className="font-semibold text-zinc-900 mb-2 text-lg">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-zinc-600">
                Yes! You can upgrade at any time and the change takes effect immediately. Downgrades take effect at the end of your current billing period to ensure you get the value you paid for.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-6 hover:border-zinc-300 transition-colors">
              <h3 className="font-semibold text-zinc-900 mb-2 text-lg">
                Is there a free trial?
              </h3>
              <p className="text-zinc-600">
                The Free plan is available forever with no credit card required. For paid plans, we offer a 14-day money-back guarantee - if you're not satisfied, we'll refund you in full.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-zinc-900 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses using Cursive to find and convert their ideal customers with AI-powered lead intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <a
                href="/signup"
                className="px-8 py-4 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors text-center"
              >
                Start Free
              </a>
              <a
                href="https://cal.com/adamwolfe/cursive-ai-audit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-center"
              >
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
