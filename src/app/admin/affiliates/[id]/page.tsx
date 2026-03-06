'use client'

/**
 * /admin/affiliates/[id] — Application detail + approve/reject/pause/terminate
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, XCircle, Clock, PauseCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/lib/hooks/use-toast'

interface ApplicationDetail {
  application: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    website: string | null
    audience_size: string
    audience_types: string[]
    promotion_plan: string
    status: string
    review_notes: string | null
    reviewed_at: string | null
    created_at: string
  }
  affiliate: {
    id: string
    partner_code: string
    status: string
    total_activations: number
    current_tier: number
    free_months_earned: number
    total_earnings: number
    agreement_accepted_at: string | null
    stripe_onboarding_complete: boolean
    created_at: string
    referrals: { id: string; referred_email: string; status: string; activated_at: string | null; attributed_at: string }[]
    commissions: { id: string; commission_amount: number; status: string; created_at: string }[]
    milestones: { id: string; tier: number; bonus_amount: number; status: string; created_at: string }[]
  } | null
}

const AUDIENCE_SIZE_LABELS: Record<string, string> = {
  under_500: 'Under 500',
  '500_2k': '500–2,000',
  '2k_10k': '2,000–10,000',
  '10k_50k': '10,000–50,000',
  '50k_plus': '50,000+',
}

export default function AdminAffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [id, setId] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    params.then((p) => setId(p.id))
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { window.location.href = '/login'; return }
      const { data: userData } = await supabase
        .from('users').select('role').eq('auth_user_id', session.user.id).maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'; return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    check()
  }, [])

  const { data, isLoading } = useQuery<ApplicationDetail>({
    queryKey: ['admin', 'affiliates', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/affiliates/${id}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: authChecked && isAdmin && !!id,
  })

  const actionMutation = useMutation({
    mutationFn: async ({ action, reviewNotes }: { action: string; reviewNotes?: string }) => {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNotes }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] })
      toast({ type: 'success', message: `${vars.action === 'approve' ? 'Approved' : vars.action === 'reject' ? 'Rejected' : 'Updated'} successfully` })
      setShowRejectForm(false)
    },
    onError: () => toast({ type: 'error', message: 'Action failed' }),
  })

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

  const app = data?.application
  const affiliate = data?.affiliate

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/affiliates" className="inline-flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-600 mb-1 transition-colors">
          <ChevronLeft size={13} />
          Affiliate Partners
        </Link>
        {app && (
          <h1 className="text-xl font-semibold text-zinc-900">
            {app.first_name} {app.last_name}
          </h1>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-zinc-400">Loading...</div>
      ) : !app ? (
        <div className="p-12 text-center text-zinc-400">Application not found.</div>
      ) : (
        <div className="space-y-6">
          {/* Application detail */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-zinc-900">Application</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                'bg-zinc-100 text-zinc-500'
              }`}>
                {app.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Name', value: `${app.first_name} ${app.last_name}` },
                { label: 'Email', value: app.email },
                { label: 'Phone', value: app.phone || '—' },
                { label: 'Website', value: app.website || '—' },
                { label: 'Audience Size', value: AUDIENCE_SIZE_LABELS[app.audience_size] || app.audience_size },
                { label: 'Applied', value: format(new Date(app.created_at), 'MMM d, yyyy') },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[11px] text-zinc-400 mb-0.5">{f.label}</div>
                  <div className="text-[13px] text-zinc-800">{f.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="text-[11px] text-zinc-400 mb-0.5">Audience Types</div>
              <div className="flex flex-wrap gap-1">
                {app.audience_types.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-400 mb-0.5">Promotion Plan</div>
              <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{app.promotion_plan}</p>
            </div>

            {/* Actions */}
            {app.status === 'pending' && (
              <div className="mt-6 pt-5 border-t border-zinc-100">
                {!showRejectForm ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => actionMutation.mutate({ action: 'approve' })}
                      disabled={actionMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-[13px] font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-zinc-700 text-[13px] font-medium rounded-lg border border-zinc-200 hover:border-zinc-400 transition-colors"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Optional rejection notes (visible to admin only)..."
                      rows={3}
                      className="w-full px-3 py-2 text-[13px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => actionMutation.mutate({ action: 'reject', reviewNotes: rejectNotes })}
                        disabled={actionMutation.isPending}
                        className="px-4 py-2 bg-red-600 text-white text-[13px] font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="px-4 py-2 text-zinc-600 text-[13px] rounded-lg hover:bg-zinc-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Affiliate section (if approved) */}
          {affiliate && (
            <>
              <div className="bg-white border border-zinc-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-semibold text-zinc-900">Partner Status</h2>
                  <div className="flex items-center gap-2">
                    {affiliate.status === 'active' && (
                      <>
                        <button
                          onClick={() => actionMutation.mutate({ action: 'pause' })}
                          disabled={actionMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-amber-700 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <PauseCircle size={12} />
                          Pause
                        </button>
                        <button
                          onClick={() => { if (confirm('Terminate this partner? All pending earnings will be forfeited.')) actionMutation.mutate({ action: 'terminate' }) }}
                          disabled={actionMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-red-700 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <AlertTriangle size={12} />
                          Terminate
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Partner Code', value: affiliate.partner_code },
                    { label: 'Status', value: affiliate.status },
                    { label: 'Current Tier', value: `Tier ${affiliate.current_tier}` },
                    { label: 'Total Activations', value: affiliate.total_activations },
                    { label: 'Free Months Earned', value: affiliate.free_months_earned },
                    { label: 'Total Earnings', value: `$${(affiliate.total_earnings / 100).toFixed(2)}` },
                    { label: 'Agreement Accepted', value: affiliate.agreement_accepted_at ? format(new Date(affiliate.agreement_accepted_at), 'MMM d, yyyy') : 'Not yet' },
                    { label: 'Stripe Connected', value: affiliate.stripe_onboarding_complete ? 'Yes' : 'No' },
                    { label: 'Member Since', value: format(new Date(affiliate.created_at), 'MMM d, yyyy') },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="text-[11px] text-zinc-400 mb-0.5">{f.label}</div>
                      <div className="text-[13px] text-zinc-800 font-medium">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referrals */}
              {affiliate.referrals && affiliate.referrals.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                  <h2 className="text-[14px] font-semibold text-zinc-900 mb-4">Referrals ({affiliate.referrals.length})</h2>
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-[11px] font-medium text-zinc-500">Email</th>
                        <th className="px-4 py-2 text-left text-[11px] font-medium text-zinc-500">Status</th>
                        <th className="px-4 py-2 text-left text-[11px] font-medium text-zinc-500">Attributed</th>
                        <th className="px-4 py-2 text-left text-[11px] font-medium text-zinc-500">Activated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliate.referrals.map((r) => (
                        <tr key={r.id} className="border-b border-zinc-50">
                          <td className="px-4 py-2 text-[12px] text-zinc-800">{r.referred_email}</td>
                          <td className="px-4 py-2">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                              r.status === 'activated' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'churned' ? 'bg-zinc-100 text-zinc-500' :
                              'bg-blue-100 text-blue-700'
                            }`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-2 text-[12px] text-zinc-500">{format(new Date(r.attributed_at), 'MMM d, yyyy')}</td>
                          <td className="px-4 py-2 text-[12px] text-zinc-500">{r.activated_at ? format(new Date(r.activated_at), 'MMM d, yyyy') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
