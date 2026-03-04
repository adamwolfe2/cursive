'use client'

/**
 * /admin/ops/calls — Booking Log
 * Full Cal.com booking history with status + signed-up indicator
 */

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, CheckCircle2, XCircle, Clock, AlertTriangle, TrendingUp, Copy, Check, ChevronLeft, Search } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { format } from 'date-fns'

interface CalBooking {
  id: string
  booking_uid: string
  attendee_name: string
  attendee_email: string
  start_time: string
  end_time: string
  status: string
  workspace_id: string | null
  workspace_name: string | null
  signed_up: boolean
  created_at: string
}

interface CallsData {
  bookings: CalBooking[]
  stats: {
    total: number
    upcoming: number
    completed: number
    cancelled: number
    signed_up: number
    conversion_rate: number
  }
  pagination: { total: number; page: number; limit: number; pages: number }
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="ml-1 text-zinc-400 hover:text-zinc-600"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'upcoming':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 text-blue-700"><Clock size={10} />Upcoming</span>
    case 'completed':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} />Completed</span>
    case 'cancelled':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-zinc-100 text-zinc-600"><XCircle size={10} />Cancelled</span>
    case 'no_show':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-100 text-red-700"><AlertTriangle size={10} />No Show</span>
    default:
      return <span className="px-2 py-0.5 text-[11px] rounded-full bg-zinc-100 text-zinc-600">{status}</span>
  }
}

export default function CallsPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAdmin = async () => {
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
    checkAdmin()
  }, [])

  const { data, isLoading } = useQuery<CallsData>({
    queryKey: ['admin', 'ops', 'calls', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/ops/calls?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: authChecked && isAdmin,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ booking_uid, status }: { booking_uid: string; status: string }) => {
      const res = await fetch('/api/admin/ops/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_uid, status }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops', 'calls'] })
      toast({ type: 'success', message: 'Booking updated' })
    },
    onError: () => toast({ type: 'error', message: 'Failed to update booking' }),
  })

  const filteredBookings = useMemo(() => {
    if (!data?.bookings) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.bookings
    return data.bookings.filter(
      (b) =>
        b.attendee_name.toLowerCase().includes(q) ||
        b.attendee_email.toLowerCase().includes(q)
    )
  }, [data?.bookings, search])

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

  const stats = data?.stats

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/ops" className="inline-flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-600 mb-1 transition-colors">
          <ChevronLeft size={13} />
          Ops Hub
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Booking Log</h1>
        <p className="text-[13px] text-zinc-500 mt-1">All Cal.com demo bookings — conversion rate + follow-up</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Bookings', value: stats.total, color: 'text-zinc-900' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-600' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600' },
            { label: 'Signed Up', value: stats.signed_up, color: 'text-green-600' },
            { label: 'Conversion Rate', value: `${stats.conversion_rate}%`, color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-[12px] text-zinc-500">{s.label}</div>
              <div className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="h-9 pl-8 pr-3 text-[13px] bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-56"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 px-3 text-[13px] bg-white border border-zinc-200 rounded-lg focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-400">Loading bookings...</div>
        ) : !data?.bookings.length ? (
          <div className="p-12 text-center text-zinc-400">
            <Calendar size={32} className="mx-auto mb-3 text-zinc-300" />
            <p>No bookings yet. Cal.com webhooks will populate this table automatically.</p>
          </div>
        ) : !filteredBookings.length ? (
          <div className="p-12 text-center text-zinc-400">
            <Search size={24} className="mx-auto mb-3 text-zinc-300" />
            <p>No bookings match your search.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Name</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Email</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Meeting Time</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Signed Up?</th>
                <th className="px-5 py-3 text-left text-[12px] font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3 text-[13px] font-medium text-zinc-900">{b.attendee_name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center text-[12px] text-zinc-600">
                      {b.attendee_email}
                      <CopyBtn value={b.attendee_email} />
                      <a href={`mailto:${b.attendee_email}`} className="ml-2 text-primary hover:text-primary/80 text-[11px]">Email</a>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-zinc-600 whitespace-nowrap">
                    {format(new Date(b.start_time), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-3">
                    {b.signed_up && b.workspace_id
                      ? (
                        <Link href={`/admin/accounts/${b.workspace_id}`} className="inline-flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700 hover:underline">
                          <CheckCircle2 size={13} />
                          {b.workspace_name || 'Yes'}
                        </Link>
                      )
                      : b.signed_up
                      ? <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600"><CheckCircle2 size={13} />Yes</span>
                      : <span className="inline-flex items-center gap-1 text-[12px] text-zinc-400"><XCircle size={13} />No</span>
                    }
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {b.status === 'upcoming' && (
                        <>
                          <button
                            onClick={() => updateMutation.mutate({ booking_uid: b.booking_uid, status: 'no_show' })}
                            disabled={updateMutation.isPending}
                            className="text-[11px] text-red-600 hover:text-red-700 font-medium"
                          >
                            No Show
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ booking_uid: b.booking_uid, status: 'completed' })}
                            disabled={updateMutation.isPending}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Completed
                          </button>
                        </>
                      )}
                      <a
                        href={`https://cal.com/gotdarrenhill/30min`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-zinc-400 hover:text-zinc-600"
                      >
                        Cal.com
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[12px] text-zinc-500">
            Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} total bookings
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-[12px] font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="h-8 px-3 text-[12px] font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
