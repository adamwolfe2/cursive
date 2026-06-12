import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { requireAffiliate } from './_lib/require-affiliate'
import { PortalNav } from './_components/PortalNav'

export const metadata: Metadata = {
  title: 'Partner Portal | Cursive',
  description: 'Track your referrals, commission, payouts, and tier progress.',
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const affiliate = await requireAffiliate()
  const signed = !!affiliate.agreement_accepted_at

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-primary">Cursive Partners</p>
            <h1 className="text-xl font-semibold text-gray-900">
              {affiliate.first_name ? `Welcome, ${affiliate.first_name}` : 'Partner Portal'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Your code</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{affiliate.partner_code}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-8">
        {!signed && (
          <Link
            href="/partners/portal/agreement"
            className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>Action needed:</strong> Sign your Partner Agreement to activate payouts. Commissions
              accrue but can&apos;t be paid out until it&apos;s signed.
            </span>
          </Link>
        )}

        <PortalNav />
        {children}
      </main>
    </div>
  )
}
