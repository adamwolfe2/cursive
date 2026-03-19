'use client'

import Link from 'next/link'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

const TIER_NAMES = ['Starter', 'Builder', 'Grower', 'Scaler', 'Pro', 'Elite', 'Legend']

const MILESTONES_CONFIG = [
  { tier: 1, activations: 5, bonus: 5000, label: '$50' },
  { tier: 2, activations: 10, bonus: 15000, label: '$150' },
  { tier: 3, activations: 15, bonus: 25000, label: '$250' },
  { tier: 4, activations: 30, bonus: 50000, label: '$500' },
  { tier: 5, activations: 50, bonus: 100000, label: '$1,000 + 10% commission' },
  { tier: 6, activations: 100, bonus: 250000, label: '$2,500 + 20% commission' },
]

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

interface Props {
  affiliate: {
    id: string
    partner_code: string
    total_activations: number
    current_tier: number
    free_months_earned: number
    total_earnings: number
    stripe_onboarding_complete: boolean
    first_name: string
  }
  recentReferrals: any[]
  recentCommissions: any[]
  milestones: any[]
  pendingAmount: number
}

export function AffiliateDashboardClient({ affiliate, recentReferrals, recentCommissions, milestones, pendingAmount }: Props) {
  const referralUrl = `https://meetcursive.com?ref=${affiliate.partner_code}`
  const tierName = TIER_NAMES[affiliate.current_tier] || 'Starter'
  const nextMilestone = MILESTONES_CONFIG.find((m) => m.activations > affiliate.total_activations)
  const _currentMilestoneConfig = MILESTONES_CONFIG.find((m) => m.tier === affiliate.current_tier)

  // Progress to next tier
  const progressPercent = nextMilestone
    ? Math.min(100, Math.round((affiliate.total_activations / nextMilestone.activations) * 100))
    : 100

  const earnedTierSet = new Set(milestones.filter((m) => m.status === 'paid').map((m) => m.tier))

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Your affiliate performance at a glance</p>
      </div>

      {/* Stripe Connect banner */}
      {!affiliate.stripe_onboarding_complete && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-1">
            <div className="text-[13px] font-medium text-amber-800 mb-1">Connect your Stripe account to receive payouts</div>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Until your Stripe account is connected, your earnings are tracked but held. Cash milestone bonuses and commissions
              will be paid as soon as you connect.
            </p>
          </div>
          <Link
            href="/api/affiliate/stripe-connect"
            className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white text-[12px] font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Connect Stripe
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Activations', value: affiliate.total_activations, color: 'text-zinc-900' },
          { label: 'Free Months Earned', value: affiliate.free_months_earned, color: 'text-emerald-600' },
          { label: 'Lifetime Earnings', value: `$${(affiliate.total_earnings / 100).toFixed(2)}`, color: 'text-zinc-900' },
          { label: 'Current Tier', value: tierName, color: 'text-zinc-900' },
          { label: 'Pending Payout', value: pendingAmount > 0 ? `$${(pendingAmount / 100).toFixed(2)}` : '—', color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[11px] text-zinc-400 mb-1">{s.label}</div>
            <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pending balance note */}
      {pendingAmount >= 5000 && (
        <div className="mb-6 text-[13px] text-zinc-500">
          You have <span className="font-medium text-zinc-900">${(pendingAmount / 100).toFixed(2)}</span> pending.
          Payouts process on the 1st of each month (minimum $50).
        </div>
      )}

      {/* Tier progress */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium text-zinc-900">Tier Progress</div>
          {affiliate.current_tier < 6 && nextMilestone && (
            <div className="text-[12px] text-zinc-500">
              {affiliate.total_activations} / {nextMilestone.activations} activations for{' '}
              <span className="font-medium text-zinc-700">{nextMilestone.label}</span>
            </div>
          )}
        </div>
        {affiliate.current_tier < 6 ? (
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : (
          <div className="text-[13px] text-emerald-600 font-medium">Maximum tier reached — 20% recurring commission active</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Referral link */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[13px] font-medium text-zinc-900 mb-3">Your Referral Link</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[12px] text-zinc-700 font-mono break-all">
              {referralUrl}
            </div>
            <CopyButton value={referralUrl} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Code: <span className="font-mono font-medium text-zinc-600">{affiliate.partner_code}</span></span>
            <span>Attribution tracked for 30 days from first click.</span>
          </div>
        </div>

        {/* Milestone tracker */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[13px] font-medium text-zinc-900 mb-3">Milestones</div>
          <div className="space-y-2">
            {MILESTONES_CONFIG.map((m) => {
              const reached = affiliate.total_activations >= m.activations
              const paid = earnedTierSet.has(m.tier)
              return (
                <div key={m.tier} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    paid ? 'bg-emerald-500' : reached ? 'bg-zinc-300' : 'bg-zinc-100'
                  }`}>
                    {paid ? (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full ${reached ? 'bg-zinc-500' : 'bg-zinc-300'}`} />
                    )}
                  </div>
                  <span className={`text-[12px] ${reached ? 'text-zinc-800' : 'text-zinc-400'}`}>
                    <span className="font-medium">{m.activations} activations</span> — {m.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent referrals */}
      {recentReferrals.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg mb-6">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="text-[13px] font-medium text-zinc-900">Recent Referrals</div>
            <Link href="/affiliate/referrals" className="text-[12px] text-zinc-400 hover:text-zinc-600">View all →</Link>
          </div>
          <table className="w-full">
            <tbody>
              {recentReferrals.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 text-[12px] text-zinc-800">{r.referred_email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                      r.status === 'activated' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'churned' ? 'bg-zinc-100 text-zinc-500' :
                      'bg-blue-100 text-blue-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-zinc-400">
                    {format(new Date(r.attributed_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent commissions (tier 5+) */}
      {affiliate.current_tier >= 5 && recentCommissions.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="text-[13px] font-medium text-zinc-900">Recent Commissions</div>
            <Link href="/affiliate/commissions" className="text-[12px] text-zinc-400 hover:text-zinc-600">View all →</Link>
          </div>
          <table className="w-full">
            <tbody>
              {recentCommissions.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 text-[12px] text-zinc-800">${(c.invoice_amount / 100).toFixed(2)}</td>
                  <td className="px-5 py-3 text-[12px] text-zinc-600">{c.commission_rate}%</td>
                  <td className="px-5 py-3 text-[12px] font-medium text-zinc-900">${(c.commission_amount / 100).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                      c.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-zinc-400">
                    {format(new Date(c.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
