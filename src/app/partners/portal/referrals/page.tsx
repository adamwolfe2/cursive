import { requireAffiliate } from '../_lib/require-affiliate'
import { createAdminClient } from '@/lib/supabase/admin'
import { shortDate, usd } from '../_lib/format'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  paying: 'bg-green-50 text-green-700 border-green-200',
  lead: 'bg-amber-50 text-amber-700 border-amber-200',
  activated: 'bg-blue-50 text-blue-700 border-blue-200',
  churned: 'bg-gray-100 text-gray-500 border-gray-200',
}

const STATUS_LABEL: Record<string, string> = {
  paying: 'Paying',
  lead: 'Signed up',
  activated: 'Activated',
  churned: 'Churned',
}

/** Mask an email for privacy: jo***@domain.com */
function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  const head = user.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`
}

export default async function ReferralsPage() {
  const affiliate = await requireAffiliate()
  const admin = createAdminClient()

  const { data: referrals } = await admin
    .from('affiliate_referrals')
    .select('id, referred_email, status, package_slug, mrr_amount, attributed_at, first_paid_at')
    .eq('affiliate_id', affiliate.id)
    .order('attributed_at', { ascending: false })

  const rows = referrals || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Your referrals</h2>
        <p className="text-sm text-gray-500">
          Everyone who signed up through your link, and where they are in the funnel.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-900">No referrals yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Share your links from the Links &amp; Assets tab to start driving signups.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Referral</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Package</th>
                <th className="px-5 py-3 font-medium">Their MRR</th>
                <th className="px-5 py-3 font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">{maskEmail(r.referred_email)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[r.status] || STATUS_STYLE.lead
                      }`}
                    >
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{r.package_slug || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {r.status === 'paying' && r.mrr_amount ? `${usd(r.mrr_amount, { cents: false })}/mo` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{shortDate(r.attributed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
