'use client'

/**
 * /affiliate/commissions — Commission history + milestone bonuses
 */

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { DollarSign, Lock } from 'lucide-react'

interface Commission {
  id: string
  invoice_amount: number
  commission_rate: number
  commission_amount: number
  status: string
  created_at: string
}

interface Milestone {
  id: string
  tier: number
  bonus_amount: number
  status: string
  created_at: string
}

interface CommissionsData {
  commissions: Commission[]
  milestones: Milestone[]
  affiliate: {
    total_activations: number
    current_tier: number
    total_earnings: number
  }
}

const MILESTONE_LABELS: Record<number, string> = {
  1: '5 activations',
  2: '10 activations',
  3: '15 activations',
  4: '30 activations',
  5: '50 activations',
  6: '100 activations',
}

export default function AffiliateCommissionsPage() {
  const { data, isLoading } = useQuery<CommissionsData>({
    queryKey: ['affiliate', 'commissions'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/commissions')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="p-12 text-center text-zinc-400">Loading...</div>
      </div>
    )
  }

  const { commissions = [], milestones = [], affiliate } = data || {}
  const totalActivations = affiliate?.total_activations || 0
  const _currentTier = affiliate?.current_tier || 0
  const commissionsUnlocked = totalActivations >= 50

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Commissions</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Recurring commissions and milestone bonuses</p>
      </div>

      {/* Commission section */}
      <div className="bg-white border border-zinc-200 rounded-lg mb-6">
        <div className="px-5 py-4 border-b border-zinc-100">
          <div className="text-[13px] font-medium text-zinc-900">Recurring Commissions</div>
        </div>

        {!commissionsUnlocked ? (
          <div className="p-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-zinc-400" />
            </div>
            <div>
              <div className="text-[14px] text-zinc-800 font-medium mb-1">Commission unlocks at 50 activations</div>
              <p className="text-[13px] text-zinc-500 leading-relaxed">
                You&apos;re at <span className="font-medium text-zinc-700">{totalActivations}</span> activations.
                Every activation earns a free month — you&apos;re{' '}
                <span className="font-medium text-zinc-700">{50 - totalActivations}</span> away from the $1,000 bonus
                and your first commission.
              </p>
            </div>
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <DollarSign size={32} className="mx-auto mb-3 text-zinc-300" />
            <p>No commissions yet. Commissions appear when referred customers make payments.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Invoice Amount</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Rate</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Commission</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50">
                  <td className="px-5 py-3 text-[13px] text-zinc-800">${(c.invoice_amount / 100).toFixed(2)}</td>
                  <td className="px-5 py-3 text-[13px] text-zinc-600">{c.commission_rate}%</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-zinc-900">${(c.commission_amount / 100).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      c.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-500">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Milestone bonuses */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <div className="px-5 py-4 border-b border-zinc-100">
          <div className="text-[13px] font-medium text-zinc-900">Milestone Bonuses</div>
        </div>
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Milestone</th>
              <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Bonus</th>
              <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Status</th>
              <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Date Earned</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-zinc-400">
                  No milestone bonuses yet. Hit 5 activations to earn your first $50.
                </td>
              </tr>
            ) : (
              milestones.map((m) => (
                <tr key={m.id} className="border-b border-zinc-50">
                  <td className="px-5 py-3 text-[13px] text-zinc-800">{MILESTONE_LABELS[m.tier] || `Tier ${m.tier}`}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-zinc-900">${(m.bonus_amount / 100).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      m.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      m.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{m.status}</span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-500">{format(new Date(m.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
