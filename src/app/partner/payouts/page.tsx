'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PayoutStats {
  total_earnings: number
  pending_balance: number
  available_balance: number
  lifetime_paid: number
  payout_threshold: number
  stripe_connected: boolean
}

interface PayoutRequest {
  id: string
  amount: number
  status: string
  requested_at: string
  completed_at: string | null
  rejection_reason: string | null
}

export default function PartnerPayoutsPage() {
  const [apiKey, setApiKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [requestAmount, setRequestAmount] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const storedKey = localStorage.getItem('partner_api_key')
    if (storedKey) {
      setApiKey(storedKey)
      authenticateAndFetch(storedKey)
    } else {
      setLoading(false)
    }
  }, [])

  const authenticateAndFetch = async (key: string) => {
    try {
      const response = await fetch('/api/partner/payouts', {
        headers: { 'X-API-Key': key },
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setPartnerName(data.partner_name)
        setStats(data.stats)
        setPayoutHistory(data.payout_history || [])
      }
    } catch (err) {
      console.error('Failed to fetch payout data')
    }
    setLoading(false)
  }

  const handleRequestPayout = async () => {
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const amount = parseFloat(requestAmount)
    if (stats && amount > stats.available_balance) {
      setError('Amount exceeds available balance')
      return
    }

    if (stats && amount < stats.payout_threshold) {
      setError(`Minimum payout amount is $${stats.payout_threshold.toFixed(2)}`)
      return
    }

    setRequesting(true)
    setError('')

    try {
      const response = await fetch('/api/partner/payouts/request', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Payout request submitted successfully!')
        setShowRequestModal(false)
        setRequestAmount('')
        authenticateAndFetch(apiKey)
      } else {
        setError(data.error || 'Failed to submit request')
      }
    } catch (err) {
      setError('Failed to submit payout request')
    }

    setRequesting(false)
  }

  const handleConnectStripe = async () => {
    try {
      const response = await fetch('/api/partner/stripe/connect', {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Failed to initiate Stripe connection')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-600 mb-4">Please sign in to view your payouts</p>
          <Link href="/partner" className="text-violet-600 hover:underline">
            Go to Partner Portal
          </Link>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'approved':
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-zinc-100 text-zinc-700'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/partner" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-medium text-zinc-900">Partner Payouts</div>
                <div className="text-[12px] text-zinc-500">{partnerName}</div>
              </div>
            </Link>
          </div>
          <Link href="/partner" className="text-[13px] text-zinc-600 hover:text-zinc-900">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-[13px] text-emerald-700">
            {success}
          </div>
        )}

        {/* Stripe Connect Banner */}
        {stats && !stats.stripe_connected && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-[14px] font-medium text-amber-900 mb-2">Connect your Stripe account</h3>
            <p className="text-[13px] text-amber-700 mb-4">
              To receive payouts, you need to connect your Stripe account. This allows us to securely transfer your earnings.
            </p>
            <button
              onClick={handleConnectStripe}
              className="h-9 px-4 text-[13px] font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700"
            >
              Connect Stripe Account
            </button>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">Total Earnings</div>
            <div className="text-2xl font-medium text-zinc-900 mt-1">
              {formatCurrency(stats?.total_earnings || 0)}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">Pending (30-day hold)</div>
            <div className="text-2xl font-medium text-amber-600 mt-1">
              {formatCurrency(stats?.pending_balance || 0)}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">Available Balance</div>
            <div className="text-2xl font-medium text-emerald-600 mt-1">
              {formatCurrency(stats?.available_balance || 0)}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-[12px] text-zinc-600">Lifetime Paid</div>
            <div className="text-2xl font-medium text-violet-600 mt-1">
              {formatCurrency(stats?.lifetime_paid || 0)}
            </div>
          </div>
        </div>

        {/* Request Payout Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={!stats?.stripe_connected || (stats?.available_balance || 0) < (stats?.payout_threshold || 50)}
            className="h-10 px-6 text-[13px] font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Payout
          </button>
          {stats && (stats.available_balance || 0) < (stats.payout_threshold || 50) && (
            <p className="text-[12px] text-zinc-500 mt-2">
              Minimum payout amount: {formatCurrency(stats.payout_threshold || 50)}
            </p>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h2 className="text-[15px] font-medium text-zinc-900">Payout History</h2>
          </div>

          {payoutHistory.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-zinc-500">No payout requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {payoutHistory.map((payout) => (
                <div key={payout.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-zinc-900">
                      {formatCurrency(payout.amount)}
                    </div>
                    <div className="text-[12px] text-zinc-500">
                      Requested {new Date(payout.requested_at).toLocaleDateString()}
                    </div>
                    {payout.rejection_reason && (
                      <div className="text-[12px] text-red-600 mt-1">
                        Reason: {payout.rejection_reason}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-[11px] font-medium rounded-full ${getStatusColor(payout.status)}`}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-8 bg-zinc-100 rounded-lg p-6">
          <h3 className="text-[14px] font-medium text-zinc-900 mb-4">How Partner Payouts Work</h3>
          <div className="space-y-3 text-[13px] text-zinc-600">
            <p>1. You earn commission for each lead that gets successfully delivered to a business.</p>
            <p>2. Earnings are held for 30 days to account for potential chargebacks or disputes.</p>
            <p>3. After 30 days, earnings move to your available balance.</p>
            <p>4. Request a payout when your available balance reaches ${stats?.payout_threshold?.toFixed(2) || '50.00'}.</p>
            <p>5. Payouts are processed within 3-5 business days via Stripe.</p>
          </div>
        </div>
      </main>

      {/* Request Payout Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Request Payout</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                Amount (Available: {formatCurrency(stats?.available_balance || 0)})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min={stats?.payout_threshold || 50}
                  max={stats?.available_balance || 0}
                  className="w-full h-10 pl-7 pr-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
                />
              </div>
              <p className="text-[12px] text-zinc-500 mt-1">
                Minimum: {formatCurrency(stats?.payout_threshold || 50)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestAmount('')
                  setError('')
                }}
                className="flex-1 h-10 text-[13px] font-medium border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={requesting}
                className="flex-1 h-10 text-[13px] font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {requesting ? 'Submitting...' : 'Request Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
