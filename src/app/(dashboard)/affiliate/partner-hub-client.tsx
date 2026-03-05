'use client'

import { useState } from 'react'
import { Users2, Copy, Check, ExternalLink, TrendingUp, Award, DollarSign, UserCheck } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const MARKETING_URL = 'https://meetcursive.com'

const TIER_THRESHOLDS = [
  { tier: 1, activations: 5 },
  { tier: 2, activations: 10 },
  { tier: 3, activations: 15 },
  { tier: 4, activations: 30 },
  { tier: 5, activations: 50 },
  { tier: 6, activations: 100 },
]

const TIER_BONUSES: Record<number, number> = {
  1: 50, 2: 150, 3: 250, 4: 500, 5: 1000, 6: 2500,
}

function getNextTierInfo(currentTier: number, activations: number): { activationsNeeded: number; bonusAmount: number; nextTier: number } | null {
  const next = TIER_THRESHOLDS.find(t => t.tier > currentTier)
  if (!next) return null
  return {
    nextTier: next.tier,
    activationsNeeded: next.activations - activations,
    bonusAmount: TIER_BONUSES[next.tier] ?? 0,
  }
}

function getTierProgress(currentTier: number, activations: number): { current: number; max: number } {
  const nextThreshold = TIER_THRESHOLDS.find(t => t.tier > currentTier)
  const prevThreshold = TIER_THRESHOLDS.find(t => t.tier === currentTier)
  const start = prevThreshold?.activations ?? 0
  const end = nextThreshold?.activations ?? start
  return { current: activations - start, max: end - start }
}

interface Affiliate {
  id: string
  email: string
  first_name: string
  partner_code: string
  status: string
  stripe_onboarding_complete: boolean
  total_activations: number
  current_tier: number
  free_months_earned: number
  total_earnings: number
  agreement_accepted_at: string | null
}

interface Referral {
  id: string
  referred_email: string
  status: string
  attributed_at: string
  activated_at: string | null
}

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

interface Props {
  affiliate: Affiliate | null
  referrals: Referral[]
  commissions: Commission[]
  milestones: Milestone[]
}

export function PartnerHubClient({ affiliate, referrals, commissions, milestones }: Props) {
  const [copied, setCopied] = useState(false)

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
          <Users2 className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Join the Partner Program</h1>
        <p className="text-zinc-500 leading-relaxed">
          Refer businesses to Cursive and earn bonuses for every activation.
          Unlock higher tiers as your network grows.
        </p>
        <a
          href="/affiliates/apply"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Apply to Partner Program
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    )
  }

  const referralLink = `${MARKETING_URL}?ref=${affiliate.partner_code}`
  const activations = affiliate.total_activations
  const tier = affiliate.current_tier
  const totalReferrals = referrals.length
  const nextTier = getNextTierInfo(tier, activations)
  const progress = getTierProgress(tier, activations)
  const progressPct = progress.max > 0 ? Math.min((progress.current / progress.max) * 100, 100) : 100

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Partner Hub</h1>
        <p className="text-zinc-500 text-sm mt-1">Track your referrals, tier progress, and earnings.</p>
      </div>

      {/* Referral link */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Your Referral Link</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm text-zinc-800 font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 truncate">
            {referralLink}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Users2 className="h-5 w-5 text-blue-500" />} label="Referrals" value={totalReferrals} />
        <StatCard icon={<UserCheck className="h-5 w-5 text-green-500" />} label="Activations" value={activations} />
        <StatCard icon={<Award className="h-5 w-5 text-amber-500" />} label="Tier" value={`${tier} / 6`} />
        <StatCard icon={<DollarSign className="h-5 w-5 text-purple-500" />} label="Earnings" value={`$${(affiliate.total_earnings / 100).toFixed(0)}`} />
      </div>

      {/* Tier progress */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-700">Tier Progress</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2.5">
          <div
            className="bg-zinc-900 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{activations} activation{activations !== 1 ? 's' : ''} total</span>
          {nextTier ? (
            <span>
              Tier {nextTier.nextTier} in {nextTier.activationsNeeded} more
              {nextTier.bonusAmount ? ` — $${nextTier.bonusAmount} bonus` : ''}
            </span>
          ) : (
            <span>Maximum tier reached</span>
          )}
        </div>
        {tier < 5 && (
          <p className="text-xs text-zinc-400">
            Commission payouts unlock at Tier 5 (50 activations)
          </p>
        )}
      </div>

      {/* Stripe Connect banner */}
      {!affiliate.stripe_onboarding_complete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Set up payouts to receive bonuses</p>
            <p className="text-xs text-amber-700 mt-0.5">Connect your bank account via Stripe to receive milestone bonuses when you hit a new tier.</p>
          </div>
          <a
            href="/affiliate/settings"
            className="shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
          >
            Connect Stripe
          </a>
        </div>
      )}

      {/* Referrals table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-700">Referrals</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">
            No referrals yet. Share your link to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Referred</th>
                  <th className="px-5 py-3 font-medium">Activated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 text-zinc-700">{r.referred_email}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{formatDate(r.attributed_at)}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{r.activated_at ? formatDate(r.activated_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commissions — only visible at Tier 5+ */}
      {tier >= 5 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Commissions</h2>
            {totalPending > 0 && (
              <span className="text-xs text-zinc-500">
                ${(totalPending / 100).toFixed(2)} pending
              </span>
            )}
          </div>
          {commissions.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">
              No commissions yet. Commissions are calculated on recurring payments from your referrals.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Invoice Amount</th>
                    <th className="px-5 py-3 font-medium">Rate</th>
                    <th className="px-5 py-3 font-medium">Commission</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 text-zinc-400 text-xs">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3 text-zinc-700">${(c.invoice_amount / 100).toFixed(2)}</td>
                      <td className="px-5 py-3 text-zinc-500">{(c.commission_rate * 100).toFixed(0)}%</td>
                      <td className="px-5 py-3 font-medium text-zinc-900">${(c.commission_amount / 100).toFixed(2)}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Milestone bonuses */}
      {milestones.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-700">Milestone Bonuses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">Bonus</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 text-zinc-700">Tier {m.tier}</td>
                    <td className="px-5 py-3 font-medium text-zinc-900">${(m.bonus_amount / 100).toFixed(0)}</td>
                    <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  lead: 'bg-blue-50 text-blue-700',
  activated: 'bg-green-50 text-green-700',
  churned: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  clawed_back: 'bg-red-50 text-red-700',
  active: 'bg-green-50 text-green-700',
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || 'bg-zinc-100 text-zinc-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${style}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}
