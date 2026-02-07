import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { serviceTierRepository } from '@/lib/repositories/service-tier.repository'

interface SuccessPageProps {
  searchParams: Promise<{
    tier?: string
    session_id?: string
  }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

  const tierSlug = resolvedSearchParams.tier || subscription?.service_tiers?.slug
  let tierName = 'Cursive Service'

  if (tierSlug) {
    const tier = await serviceTierRepository.getTierBySlug(tierSlug)
    if (tier) {
      tierName = tier.name
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">
            Welcome to {tierName}!
          </h1>

          <p className="text-lg text-zinc-600 mb-8">
            Your subscription has been activated successfully. We're excited to help you scale your lead generation and outreach.
          </p>

          {/* What Happens Next */}
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6 mb-8 text-left">
            <h2 className="font-semibold text-zinc-900 mb-4">What happens next:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-700">
                  You'll receive a welcome email at {userData.email} with next steps
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-700">
                  I'll reach out personally within 24 hours to schedule our kickoff call
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-700">
                  Your first delivery will begin within 5-7 business days
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-700">
                  You can manage your subscription anytime from your dashboard
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/services/manage"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-900 font-medium rounded-lg border border-zinc-200 transition-colors"
            >
              Manage Subscription
            </Link>
          </div>

          {/* Support */}
          <p className="text-sm text-zinc-500 mt-8">
            Questions? Reply to your welcome email or contact{' '}
            <a href="mailto:adam@meetcursive.com" className="text-primary hover:underline">
              adam@meetcursive.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
