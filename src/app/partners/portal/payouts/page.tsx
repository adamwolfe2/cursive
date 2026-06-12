import { requireAffiliate } from '../_lib/require-affiliate'
import { buildPortalSummary } from '@/lib/affiliate/portal'
import { createAdminClient } from '@/lib/supabase/admin'
import { usd, shortDate } from '../_lib/format'
import { CheckCircle2, ExternalLink, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAYOUT_STATUS_STYLE: Record<string, string> = {
  paid: 'bg-green-50 text-green-700 border-green-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

export default async function PayoutsPage() {
  const affiliate = await requireAffiliate()
  const [summary, payoutsRes] = await Promise.all([
    buildPortalSummary(affiliate),
    createAdminClient()
      .from('affiliate_payouts')
      .select('id, amount, status, period_start, period_end, created_at')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false }),
  ])
  const payouts = payoutsRes.data || []

  return (
    <div className="space-y-6">
      {/* Balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Pending balance</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{usd(summary.pendingBalanceCents)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Paid this month</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{usd(summary.paidThisMonthCents)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Next payout</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{shortDate(summary.nextPayoutDateISO)}</p>
        </div>
      </div>

      {/* Stripe Connect */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Payout method</h3>
        {summary.stripeOnboarded ? (
          <p className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Stripe connected — you&apos;re set to receive payouts.
          </p>
        ) : (
          <div>
            <p className="mb-3 text-sm text-gray-500">
              Connect Stripe to receive your commission. Payouts run monthly for balances over{' '}
              {usd(5000, { cents: false })}.
            </p>
            <a
              href="/api/affiliate/stripe-connect"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Connect Stripe <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Payout history</h3>
        {payouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Wallet className="mx-auto mb-3 h-7 w-7 text-gray-300" />
            <p className="text-sm text-gray-500">No payouts yet. Your first runs once you have a balance.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-gray-600">{shortDate(p.created_at)}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {shortDate(p.period_start)} – {shortDate(p.period_end)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{usd(p.amount)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          PAYOUT_STATUS_STYLE[p.status] || PAYOUT_STATUS_STYLE.pending
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
