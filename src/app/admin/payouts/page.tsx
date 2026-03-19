'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/lib/hooks/use-toast'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-helpers'

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

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-zinc-100 text-zinc-700',
  processing: 'bg-zinc-100 text-zinc-700',
  completed:  'bg-zinc-100 text-zinc-700',
  rejected:   'bg-zinc-100 text-zinc-700',
  failed:     'bg-zinc-100 text-zinc-700',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {status}
    </span>
  )
}

const FILTERS = ['all', 'pending', 'completed', 'rejected'] as const

export default function AdminPayoutsPage() {
  const { toast } = useToast()
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
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { window.location.href = '/login'; return }
      const { data: userData } = await supabase
        .from('users').select('role').eq('auth_user_id', user.id).maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'; return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [supabase])

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts?status=${statusFilter}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setPayouts(data.payouts || [])
        setTotals(data.totals || { pending_amount: 0, approved_amount: 0, completed_amount: 0, rejected_amount: 0 })
      }
    } catch (error) {
      safeError('[AdminPayouts]', 'Failed to fetch payouts:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (authChecked && isAdmin) fetchPayouts()
  }, [fetchPayouts, authChecked, isAdmin])

  const handleApprove = async (payoutId: string) => {
    setConfirmApproveId(null)
    setProcessingPayoutId(payoutId)
    try {
      const res = await fetch('/api/admin/payouts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_id: payoutId }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ type: 'success', message: data.message || 'Payout approved' })
        fetchPayouts()
      } else {
        toast({ type: 'error', message: `Failed: ${data.error}` })
      }
    } catch (error: unknown) {
      toast({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setProcessingPayoutId(null)
    }
  }

  const handleReject = async (payoutId: string) => {
    if (!rejectReason.trim()) { toast({ type: 'warning', message: 'Please provide a rejection reason' }); return }
    setProcessingPayoutId(payoutId)
    try {
      const res = await fetch('/api/admin/payouts/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_id: payoutId, reason: rejectReason }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ type: 'success', message: data.message || 'Payout rejected' })
        setRejectDialogOpen(null)
        setRejectReason('')
        fetchPayouts()
      } else {
        toast({ type: 'error', message: `Failed: ${data.error}` })
      }
    } catch (error: unknown) {
      toast({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setProcessingPayoutId(null)
    }
  }

  if (!authChecked) return (
    <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  )
  if (!isAdmin) return null

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Partner Payouts</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage and approve partner commission payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending',   value: fmt(totals.pending_amount) },
          { label: 'Approved',  value: fmt(totals.approved_amount) },
          { label: 'Completed', value: fmt(totals.completed_amount) },
          { label: 'Rejected',  value: fmt(totals.rejected_amount) },
        ].map(s => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="text-xs text-zinc-500">{s.label}</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              statusFilter === f
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-200 border-t-zinc-900" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No payouts found</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {payouts.map((payout) => (
              <li key={payout.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-zinc-900">{payout.partner.name}</span>
                      <StatusBadge status={payout.status} />
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{payout.partner.email}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                      <span>${payout.amount.toFixed(2)}</span>
                      <span className="text-zinc-300">·</span>
                      <span>{payout.lead_count} leads</span>
                      <span className="text-zinc-300">·</span>
                      <span>{new Date(payout.created_at).toLocaleDateString()}</span>
                    </div>
                    {payout.stripe_transfer_id && (
                      <div className="text-xs text-zinc-400 mt-1 font-mono">{payout.stripe_transfer_id}</div>
                    )}
                    {payout.rejection_reason && (
                      <div className="text-xs text-red-600 mt-1">Rejected: {payout.rejection_reason}</div>
                    )}
                    {payout.error_message && (
                      <div className="text-xs text-red-600 mt-1">Error: {payout.error_message}</div>
                    )}
                  </div>

                  {payout.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => setConfirmApproveId(payout.id)}
                        disabled={processingPayoutId === payout.id || !payout.partner.stripe_account_id}
                        size="sm"
                      >
                        {processingPayoutId === payout.id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => { setRejectDialogOpen(payout.id); setRejectReason('') }}
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

      {/* Approve Dialog */}
      <Dialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) setConfirmApproveId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout</DialogTitle>
            <DialogDescription>This will initiate a Stripe transfer to the partner.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApproveId(null)}>Cancel</Button>
            <Button onClick={() => { if (confirmApproveId) handleApprove(confirmApproveId) }}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-base font-semibold text-zinc-900">Reject Payout</h3>
            <p className="text-sm text-zinc-500">Provide a reason for rejecting this payout:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRejectDialogOpen(null); setRejectReason('') }}>Cancel</Button>
              <Button
                onClick={() => handleReject(rejectDialogOpen)}
                disabled={!rejectReason.trim() || processingPayoutId === rejectDialogOpen}
                variant="destructive"
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
