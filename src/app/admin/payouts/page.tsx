'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'
import { safeError } from '@/lib/utils/log-sanitizer'

interface Partner {
  id: string
  name: string
  email: string
  stripe_account_id: string | null
  payout_rate: number
}

interface Payout {
  id: string
  partner_id: string
  amount: number
  lead_count: number
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed'
  created_at: string
  approved_at: string | null
  approved_by_user_id: string | null
  rejected_at: string | null
  rejected_by_user_id: string | null
  rejection_reason: string | null
  completed_at: string | null
  stripe_transfer_id: string | null
  error_message: string | null
  partner: Partner
}

interface PayoutTotals {
  pending_amount: number
  approved_amount: number
  completed_amount: number
  rejected_amount: number
}

export default function AdminPayoutsPage() {
  const toast = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [totals, setTotals] = useState<PayoutTotals>({
    pending_amount: 0,
    approved_amount: 0,
    completed_amount: 0,
    rejected_amount: 0,
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const supabase = createClient()

  // Admin role check - prevent non-admins from accessing
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (authChecked && isAdmin) fetchPayouts()
  }, [statusFilter, authChecked, isAdmin])

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const url = `/api/admin/payouts?status=${statusFilter}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (data.success) {
        setPayouts(data.payouts || [])
        setTotals(data.totals || { pending_amount: 0, approved_amount: 0, completed_amount: 0, rejected_amount: 0 })
      }
    } catch (error) {
      safeError('[AdminPayouts]', 'Failed to fetch payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (payoutId: string) => {
    if (!confirm('Are you sure you want to approve this payout? This will initiate a Stripe transfer.')) {
      return
    }

    setProcessingPayoutId(payoutId)
    try {
      const response = await fetch('/api/admin/payouts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_id: payoutId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Payout approved successfully')
        fetchPayouts()
      } else {
        toast.error(`Failed to approve payout: ${data.error}`)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setProcessingPayoutId(null)
    }
  }

  const handleRejectClick = (payoutId: string) => {
    setRejectDialogOpen(payoutId)
    setRejectReason('')
  }

  const handleReject = async (payoutId: string) => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a rejection reason')
      return
    }

    setProcessingPayoutId(payoutId)
    try {
      const response = await fetch('/api/admin/payouts/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_id: payoutId, reason: rejectReason }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Payout rejected successfully')
        setRejectDialogOpen(null)
        setRejectReason('')
        fetchPayouts()
      } else {
        toast.error(`Failed to reject payout: ${data.error}`)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setProcessingPayoutId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-red-200 text-red-900',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Partner Payouts</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage and approve partner commission payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">
              ${totals.pending_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">
              ${totals.approved_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              ${totals.completed_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">
              ${totals.rejected_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Completed
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Rejected
        </button>
      </div>

      {/* Payouts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No payouts found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {payouts.map((payout) => (
              <li key={payout.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-gray-900">
                        {payout.partner.name}
                      </p>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {payout.partner.email}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Amount: ${payout.amount.toFixed(2)}</span>
                      <span>•</span>
                      <span>Leads: {payout.lead_count}</span>
                      <span>•</span>
                      <span>Created: {new Date(payout.created_at).toLocaleDateString()}</span>
                    </div>
                    {payout.status === 'completed' && payout.stripe_transfer_id && (
                      <p className="mt-1 text-xs text-gray-400">
                        Transfer ID: {payout.stripe_transfer_id}
                      </p>
                    )}
                    {payout.status === 'rejected' && payout.rejection_reason && (
                      <p className="mt-1 text-xs text-red-600">
                        Reason: {payout.rejection_reason}
                      </p>
                    )}
                    {payout.status === 'failed' && payout.error_message && (
                      <p className="mt-1 text-xs text-red-600">
                        Error: {payout.error_message}
                      </p>
                    )}
                  </div>

                  {payout.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleApprove(payout.id)}
                        disabled={processingPayoutId === payout.id || !payout.partner.stripe_account_id}
                        variant="default"
                        size="sm"
                      >
                        {processingPayoutId === payout.id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(payout.id)}
                        disabled={processingPayoutId === payout.id}
                        variant="outline"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Payout</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this payout:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 min-h-[100px]"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setRejectDialogOpen(null)
                  setRejectReason('')
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(rejectDialogOpen)}
                disabled={!rejectReason.trim() || processingPayoutId === rejectDialogOpen}
                className="bg-red-600 hover:bg-red-700"
              >
                {processingPayoutId === rejectDialogOpen ? 'Rejecting...' : 'Reject Payout'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
