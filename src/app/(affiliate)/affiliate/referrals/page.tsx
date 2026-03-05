'use client'

/**
 * /affiliate/referrals — All referrals with filter tabs
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Users } from 'lucide-react'

interface Referral {
  id: string
  referred_email: string
  status: string
  attributed_at: string
  activated_at: string | null
}

export default function AffiliateReferralsPage() {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: referrals = [], isLoading } = useQuery<Referral[]>({
    queryKey: ['affiliate', 'referrals', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/affiliate/referrals?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const total = referrals.length
  const activated = referrals.filter((r) => r.status === 'activated').length
  const conversionRate = total > 0 ? Math.round((activated / total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Referrals</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          {total} total · {activated} activated · {conversionRate}% conversion rate
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {['all', 'lead', 'activated', 'churned'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 text-[12px] rounded-lg font-medium transition-colors ${
              statusFilter === f
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Users size={32} className="mx-auto mb-3 text-zinc-300" />
            <p>No referrals yet. Share your link to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Email</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Attributed</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Activated</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3 text-[13px] text-zinc-800">{r.referred_email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'activated' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'churned' ? 'bg-zinc-100 text-zinc-500' :
                      'bg-blue-100 text-blue-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-500">
                    {format(new Date(r.attributed_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-500">
                    {r.activated_at ? format(new Date(r.activated_at), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
