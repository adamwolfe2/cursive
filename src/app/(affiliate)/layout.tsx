/**
 * Affiliate Portal Layout
 * Route group (affiliate) — adds layout without adding URL segment
 * Gates on: auth → affiliate lookup → agreement → status checks
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AffiliateSidebar } from './affiliate-sidebar'

interface Affiliate {
  id: string
  email: string
  first_name: string
  last_name: string
  partner_code: string
  status: string
  agreement_accepted_at: string | null
  stripe_onboarding_complete: boolean
  total_activations: number
  current_tier: number
  free_months_earned: number
  total_earnings: number
}

export default async function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/affiliate/dashboard')
  }

  const admin = createAdminClient()

  // Look up affiliate by user_id first
  let affiliate: Affiliate | null = null
  const { data: byUserId } = await admin
    .from('affiliates')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (byUserId) {
    affiliate = byUserId as Affiliate
  } else {
    // First sign-in: look up by email and link user_id
    const { data: byEmail } = await admin
      .from('affiliates')
      .select('*')
      .eq('email', authUser.email?.toLowerCase() || '')
      .maybeSingle()

    if (byEmail) {
      // Link the user_id so future lookups are fast
      await admin
        .from('affiliates')
        .update({ user_id: authUser.id })
        .eq('id', byEmail.id)
      affiliate = { ...byEmail, user_id: authUser.id } as Affiliate
    }
  }

  // Not an affiliate — redirect to application
  if (!affiliate) {
    redirect('/affiliates/apply')
  }

  // Agreement gate
  if (!affiliate.agreement_accepted_at) {
    redirect('/affiliate/accept-terms')
  }

  // Status checks
  if (affiliate.status === 'paused') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 text-xl">⏸</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Account Paused</h1>
          <p className="text-zinc-500 text-[14px] leading-relaxed">
            Your partner account has been temporarily paused. Please contact{' '}
            <a href="mailto:adam@meetcursive.com" className="text-zinc-700 underline">
              adam@meetcursive.com
            </a>{' '}
            for more information.
          </p>
        </div>
      </div>
    )
  }

  if (affiliate.status === 'terminated') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Account Terminated</h1>
          <p className="text-zinc-500 text-[14px] leading-relaxed">
            Your partner account has been terminated. If you believe this is in error, contact{' '}
            <a href="mailto:adam@meetcursive.com" className="text-zinc-700 underline">
              adam@meetcursive.com
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <AffiliateSidebar affiliate={affiliate} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
