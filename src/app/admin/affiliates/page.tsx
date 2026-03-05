'use client'

/**
 * /admin/affiliates — Affiliate Partner Program Admin
 * Auth is handled by the admin layout — no redundant check needed here.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft, Users, Clock, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface AffiliateApplication {
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
  created_at: string
}

interface AffiliatesData {
  applications: AffiliateApplication[]
  stats: {
    total_applications: number
    pending: number
    approved: number
    rejected: number
    active_affiliates: number
    total_activations: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const AUDIENCE_SIZE_LABELS: Record<string, string> = {
  under_500: '< 500',
  '500_2k': '500–2K',
  '2k_10k': '2K–10K',
  '10k_50k': '10K–50K',
  '50k_plus': '50K+',
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-zinc-100 text-zinc-500',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${styles[status] || 'bg-zinc-100 text-zinc-500'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export default function AdminAffiliatesPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<AffiliatesData>({
    queryKey: ['admin', 'affiliates', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/affiliates?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'affiliates'] })
      setExpanded(null)
    },
  })

  const stats = data?.stats

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-600 mb-1 transition-colors">
          <ChevronLeft size={13} />
          Admin
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Affiliate Partners</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Review applications and manage active affiliate partners</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Applications', value: stats.total_applications, icon: Users },
            { label: 'Pending Review', value: stats.pending, icon: Clock, highlight: stats.pending > 0 },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2 },
            { label: 'Active Partners', value: stats.active_affiliates, icon: TrendingUp },
            { label: 'Total Activations', value: stats.total_activations, icon: DollarSign },
          ].map((s) => (
            <div key={s.label} className={`bg-white border rounded-lg p-4 ${s.highlight ? 'border-amber-300' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={13} className={s.highlight ? 'text-amber-500' : 'text-zinc-400'} />
                <span className="text-[12px] text-zinc-500">{s.label}</span>
              </div>
              <div className={`text-2xl font-semibold ${s.highlight ? 'text-amber-600' : 'text-zinc-900'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
            {f === 'pending' && stats?.pending ? (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                {stats.pending}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400">Loading...</div>
        ) : !data?.applications.length ? (
          <div className="p-12 text-center text-zinc-400">
            <Users size={32} className="mx-auto mb-3 text-zinc-300" />
            <p>No applications found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Name</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Email</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Channels</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Audience</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Applied</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {data.applications.map((a) => (
                <>
                  <tr
                    key={a.id}
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  >
                    <td className="px-5 py-3 text-[13px] font-medium text-zinc-900">
                      {a.first_name} {a.last_name}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-zinc-600">{a.email}</td>
                    <td className="px-5 py-3 text-[12px] text-zinc-600 max-w-[180px] truncate">
                      {a.audience_types.join(', ')}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-zinc-600">
                      {AUDIENCE_SIZE_LABELS[a.audience_size] || a.audience_size}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-zinc-500">
                      {format(new Date(a.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-[12px] text-zinc-400">
                      {expanded === a.id ? '▲' : '▼'}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expanded === a.id && (
                    <tr key={`${a.id}-detail`} className="bg-zinc-50 border-b border-zinc-100">
                      <td colSpan={7} className="px-5 py-5">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Promotion Plan</p>
                            <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{a.promotion_plan}</p>
                          </div>
                          <div className="space-y-3">
                            {a.website && (
                              <div>
                                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Website</p>
                                <a href={a.website} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-600 hover:underline break-all">
                                  {a.website}
                                </a>
                              </div>
                            )}
                            {a.phone && (
                              <div>
                                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Phone</p>
                                <p className="text-[13px] text-zinc-700">{a.phone}</p>
                              </div>
                            )}
                            {a.status === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => reviewMutation.mutate({ id: a.id, action: 'approve' })}
                                  disabled={reviewMutation.isPending}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Approve & Send Welcome Email
                                </button>
                                <button
                                  onClick={() => reviewMutation.mutate({ id: a.id, action: 'reject' })}
                                  disabled={reviewMutation.isPending}
                                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
