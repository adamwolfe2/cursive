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
        <div className="container mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary">Cursive Partners</p>
            <h1 className="truncate text-base font-semibold text-gray-900">
              {affiliate.first_name ? `Welcome, ${affiliate.first_name}` : 'Partner Portal'}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Your code</p>
            <p className="font-mono text-xs font-semibold text-gray-900">{affiliate.partner_code}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-5">
        {!signed && (
          <Link
            href="/partners/portal/agreement"
            className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-snug text-amber-900 hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Action needed:</strong> Sign your Partner Agreement to activate payouts — commissions
              accrue but can&apos;t pay out until signed.
            </span>
          </Link>
        )}

        <PortalNav />
        {children}
      </main>
    </div>
  )
}
