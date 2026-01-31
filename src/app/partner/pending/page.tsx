/**
 * Partner Pending Approval Page
 * Shown to partners who have registered but are awaiting admin approval
 */

import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PartnerPendingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await getUserWithRole(session.user)
  if (!user) {
    redirect('/login')
  }

  // Get partner details
  const { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('email', user.email)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 flex items-center justify-center py-20 px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-yellow-100 rounded-full">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">
            Your Account is Under Review
          </h1>

          {/* Message */}
          <p className="text-lg text-zinc-600 mb-8">
            Thank you for registering as a partner! Your account is currently being reviewed by our team.
          </p>

          {/* Info Box */}
          <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-zinc-900 mb-4">What's Happening?</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-zinc-700">
                  {partner?.stripe_onboarding_complete
                    ? '✓ Stripe Connect setup completed'
                    : '○ Stripe Connect setup required'}
                </p>
              </div>
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-zinc-700">
                  Awaiting admin approval (usually within 24 hours)
                </p>
              </div>
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-zinc-700">
                  Once approved, you can start uploading leads and earning commissions
                </p>
              </div>
            </div>
          </div>

          {/* Partner Details */}
          {partner && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">Your Partner Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Email:</span>
                  <span className="text-blue-900 font-medium">{partner.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Company:</span>
                  <span className="text-blue-900 font-medium">{partner.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Status:</span>
                  <span className="text-blue-900 font-medium capitalize">{partner.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Commission Rate:</span>
                  <span className="text-blue-900 font-medium">{(partner.base_commission_rate * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <a
              href="mailto:support@meetcursive.com"
              className="px-8 py-3 border-2 border-zinc-900 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Contact Support
            </a>
          </div>

          {/* Help Text */}
          <p className="text-sm text-zinc-500 mt-8">
            Need help? Email us at{' '}
            <a href="mailto:support@meetcursive.com" className="text-blue-600 hover:underline">
              support@meetcursive.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
