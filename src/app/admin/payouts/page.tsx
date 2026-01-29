'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

interface PayoutRequest {
  id: string
  partner_id: string
  amount: number
  status: string
  requested_at: string
  reviewed_at: string | null
  completed_at: string | null
  admin_notes: string | null
  rejection_reason: string | null
  partner: {
    name: string
    email: string
    company_name: string | null
    stripe_account_id: string | null
  }
}

interface PayoutStats {
  pending_count: number
  pending_amount: number
  approved_count: number
  approved_amount: number
  processing_count: number
  processing_amount: number
  total_paid_this_month: number
}

export default function AdminPayoutsPage() {
  const { toast } = useToast()
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null)
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'process' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchPayouts = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/payouts?status=${filter}`)
      const data = await response.json()

      if (data.success) {
        setPayouts(data.payouts || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])

  const handleAction = async (action: 'approve' | 'reject' | 'process') => {
    if (!selectedPayout) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/payouts/${selectedPayout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes,
          rejection_reason: rejectionReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActionModal(null)
        setSelectedPayout(null)
        setAdminNotes('')
        setRejectionReason('')
        fetchPayouts()
        toast({
          title: 'Action completed',
          message: `Payout ${action} successful`,
          type: 'success',
        })
      } else {
        toast({
          title: 'Action failed',
          message: data.error || 'Failed to process payout action',
          type: 'error',
        })
      }
    } catch (error) {
      toast({
        title: 'Action failed',
        message: 'An error occurred while processing the action',
        type: 'error',
      })
    }
    setProcessing(false)
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
        return 'bg-blue-100 text-blue-700'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-600">Loading payouts...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Partner Payouts</h1>
        <p className="text-[13px] text-zinc-600 mt-1">Manage partner payout requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Pending Review</div>
          <div className="text-xl font-medium text-amber-600 mt-1">
            {stats?.pending_count || 0}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {formatCurrency(stats?.pending_amount || 0)}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Approved</div>
          <div className="text-xl font-medium text-blue-600 mt-1">
            {stats?.approved_count || 0}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {formatCurrency(stats?.approved_amount || 0)}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Processing</div>
          <div className="text-xl font-medium text-primary mt-1">
            {stats?.processing_count || 0}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            {formatCurrency(stats?.processing_amount || 0)}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Paid This Month</div>
          <div className="text-xl font-medium text-emerald-600 mt-1">
            {formatCurrency(stats?.total_paid_this_month || 0)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'processing', 'completed', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Payouts Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-zinc-600">Partner</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-zinc-600">Amount</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-zinc-600">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-zinc-600">Requested</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 text-[13px]">
                  No payout requests found
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-zinc-900">
                      {payout.partner?.name || 'Unknown'}
                    </div>
                    <div className="text-[12px] text-zinc-500">
                      {payout.partner?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-zinc-900">
                      {formatCurrency(payout.amount)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[11px] font-medium rounded-full ${getStatusColor(payout.status)}`}>
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-zinc-600">
                      {new Date(payout.requested_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {payout.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPayout(payout)
                              setActionModal('approve')
                            }}
                            className="px-3 py-1.5 text-[12px] font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayout(payout)
                              setActionModal('reject')
                            }}
                            className="px-3 py-1.5 text-[12px] font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {payout.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedPayout(payout)
                            setActionModal('process')
                          }}
                          className="px-3 py-1.5 text-[12px] font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Process Payout
                        </button>
                      )}
                      {payout.status === 'rejected' && payout.rejection_reason && (
                        <span className="text-[12px] text-red-600">
                          {payout.rejection_reason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {actionModal && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-[15px] font-medium text-zinc-900 mb-4">
              {actionModal === 'approve' && 'Approve Payout Request'}
              {actionModal === 'reject' && 'Reject Payout Request'}
              {actionModal === 'process' && 'Process Payout'}
            </h2>

            <div className="mb-4 p-3 bg-zinc-50 rounded-lg">
              <div className="text-[13px] font-medium text-zinc-900">
                {selectedPayout.partner?.name}
              </div>
              <div className="text-[12px] text-zinc-500">
                {selectedPayout.partner?.email}
              </div>
              <div className="text-[14px] font-medium text-zinc-900 mt-2">
                {formatCurrency(selectedPayout.amount)}
              </div>
            </div>

            {actionModal === 'reject' && (
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  className="w-full h-24 px-3 py-2 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes..."
                className="w-full h-20 px-3 py-2 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {actionModal === 'process' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-[12px] text-amber-700">
                  This will initiate a Stripe transfer to the partner&apos;s connected account.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModal(null)
                  setSelectedPayout(null)
                  setAdminNotes('')
                  setRejectionReason('')
                }}
                className="flex-1 h-10 text-[13px] font-medium border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionModal)}
                disabled={processing || (actionModal === 'reject' && !rejectionReason)}
                className={`flex-1 h-10 text-[13px] font-medium rounded-lg disabled:opacity-50 ${
                  actionModal === 'reject'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {processing ? 'Processing...' : actionModal.charAt(0).toUpperCase() + actionModal.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
