/**
 * Affiliate Portal Layout
 * Route group (affiliate) — adds layout without adding URL segment
 * Gates on: auth → affiliate lookup → agreement → status checks
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAffiliateIdForUser } from '@/lib/affiliate/portal'
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

  // Resolve the affiliate via the SINGLE hardened claim authority (verified-email
  // + one-time link). The previous inline raw-email link here was the same
  // takeover vector as accept-terms (blocker B1) — never re-introduce it.
  const affiliateId = await resolveAffiliateIdForUser(
    authUser.id,
    authUser.email,
    !!authUser.email_confirmed_at
  )

  let affiliate: Affiliate | null = null
  if (affiliateId) {
    const { data } = await admin
      .from('affiliates')
      .select('*')
      .eq('id', affiliateId)
      .maybeSingle()
    affiliate = (data as Affiliate) ?? null
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
