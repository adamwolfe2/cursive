'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Upload,
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-react'

interface DashboardStats {
  totalLeadsUploaded: number
  totalLeadsSold: number
  totalEarnings: number
  pendingBalance: number
  availableBalance: number
  verificationPassRate: number
  duplicateRate: number
  partnerScore: number
  partnerTier: string
  leadsUploadedThisMonth: number
  leadsSoldThisMonth: number
  earningsThisMonth: number
}

export default function PartnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/partner/dashboard')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-zinc-800" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950/50 p-6">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'text-yellow-400'
      case 'standard':
        return 'text-blue-400'
      case 'probation':
        return 'text-orange-400'
      default:
        return 'text-zinc-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Partner Dashboard</h1>
          <p className="text-zinc-400">
            Welcome back. Here&apos;s your performance overview.
          </p>
        </div>
        <Link
          href="/partner/upload"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          Upload Leads
        </Link>
      </div>

      {/* Partner Score Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Partner Score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(stats.partnerScore)}`}>
                {stats.partnerScore}
              </span>
              <span className="text-lg text-zinc-500">/100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Tier</p>
            <p className={`mt-1 text-xl font-semibold capitalize ${getTierColor(stats.partnerTier)}`}>
              {stats.partnerTier}
            </p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
          <div>
            <p className="text-xs text-zinc-500">Verification Rate</p>
            <p className="mt-1 text-lg font-medium text-white">
              {stats.verificationPassRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Duplicate Rate</p>
            <p className="mt-1 text-lg font-medium text-white">
              {stats.duplicateRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Conversion Rate</p>
            <p className="mt-1 text-lg font-medium text-white">
              {stats.totalLeadsUploaded > 0
                ? ((stats.totalLeadsSold / stats.totalLeadsUploaded) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads Uploaded */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Total Leads Uploaded</p>
            <Upload className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {stats.totalLeadsUploaded.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            +{stats.leadsUploadedThisMonth.toLocaleString()} this month
          </p>
        </div>

        {/* Leads Sold */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Leads Sold</p>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {stats.totalLeadsSold.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            +{stats.leadsSoldThisMonth.toLocaleString()} this month
          </p>
        </div>

        {/* Total Earnings */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Total Earnings</p>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            ${stats.totalEarnings.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            +${stats.earningsThisMonth.toFixed(2)} this month
          </p>
        </div>

        {/* Available Balance */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Available for Payout</p>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green-400">
            ${stats.availableBalance.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            ${stats.pendingBalance.toFixed(2)} pending
          </p>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Balance Status */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold text-white">Balance Status</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-zinc-400">Pending (14-day holdback)</span>
              </div>
              <span className="font-medium text-white">
                ${stats.pendingBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-zinc-400">Available for Withdrawal</span>
              </div>
              <span className="font-medium text-green-400">
                ${stats.availableBalance.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Total Earned</span>
                <span className="font-bold text-white">
                  ${stats.totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/partner/earnings"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            View Earnings Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <Link
              href="/partner/upload"
              className="flex items-center justify-between rounded-lg bg-zinc-800 p-4 hover:bg-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                  <Upload className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Upload Leads</p>
                  <p className="text-xs text-zinc-400">Upload a new CSV file</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </Link>

            <Link
              href="/partner/uploads"
              className="flex items-center justify-between rounded-lg bg-zinc-800 p-4 hover:bg-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">View Upload History</p>
                  <p className="text-xs text-zinc-400">Check previous uploads</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </Link>

            <Link
              href="/partner/settings"
              className="flex items-center justify-between rounded-lg bg-zinc-800 p-4 hover:bg-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Setup Payouts</p>
                  <p className="text-xs text-zinc-400">Connect Stripe account</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Commission Info */}
      <div className="rounded-lg border border-blue-800/50 bg-blue-950/20 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 text-blue-400" />
          <div>
            <h4 className="font-medium text-blue-300">Commission Structure</h4>
            <p className="mt-1 text-sm text-blue-200/70">
              Earn <strong>30% base commission</strong> on every lead sold. Bonuses available:
              +10% for leads sold within 7 days, +5% for 95%+ verification rate, +5% for 10K+ monthly uploads.
              Maximum commission: 50%.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
