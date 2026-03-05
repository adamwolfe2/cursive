'use client'

/**
 * /admin/affiliates — Affiliate Partner Program Admin
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, Users, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

interface AffiliateApplication {
  id: string
  first_name: string
  last_name: string
  email: string
  audience_size: string
  audience_types: string[]
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
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
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

  const { data, isLoading, refetch } = useQuery<AffiliatesData>({
    queryKey: ['admin', 'affiliates', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/affiliates?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: authChecked && isAdmin,
  })

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Applications', value: stats.total_applications, icon: Users },
            { label: 'Pending Review', value: stats.pending, icon: Clock },
            { label: 'Active Partners', value: stats.active_affiliates, icon: CheckCircle2 },
            { label: 'Total Activations', value: stats.total_activations, icon: ArrowRight },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={13} className="text-zinc-400" />
                <span className="text-[12px] text-zinc-500">{s.label}</span>
              </div>
              <div className="text-2xl font-semibold text-zinc-900">{s.value}</div>
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
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Audience</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Size</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Applied</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {data.applications.map((a) => (
                <tr key={a.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3 text-[13px] font-medium text-zinc-900">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-600">{a.email}</td>
                  <td className="px-5 py-3 text-[12px] text-zinc-600">
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
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/affiliates/${a.id}`}
                      className="text-[12px] text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
