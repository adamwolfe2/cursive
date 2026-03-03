'use client'

/**
 * /admin/ops — Ops Hub
 * Today's KPIs + live activity feed + quick links to Pipeline, Visitors, Calls
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar, Users, AlertTriangle, CheckCircle2, Activity,
  ArrowRight, TrendingUp, Clock, Mail, Kanban, Eye,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SummaryData {
  bookings_today: number
  active_trials: number
  expiring_soon: number
  active_clients: number
  unclaimed_demos: number
  activity_feed: {
    type: 'booking' | 'signup'
    id: string
    label: string
    sub: string | null
    time: string
    status: string | null
  }[]
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-[13px] text-zinc-500">{label}</span>
      </div>
      <div className="text-3xl font-semibold text-zinc-900">{value}</div>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-zinc-900 group-hover:text-primary transition-colors">{title}</div>
        <div className="text-[12px] text-zinc-500 mt-0.5">{description}</div>
      </div>
      <ArrowRight size={16} className="text-zinc-400 group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
    </Link>
  )
}

export default function OpsHubPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { window.location.href = '/login'; return }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'; return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  const { data, isLoading } = useQuery<SummaryData>({
    queryKey: ['admin', 'ops', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ops/summary')
      if (!res.ok) throw new Error('Failed to load summary')
      return res.json()
    },
    enabled: authChecked && isAdmin,
    refetchInterval: 60_000, // refresh every minute
  })

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

  const stats = [
    { icon: Calendar, label: 'Demo Bookings Today', value: data?.bookings_today ?? 0, color: 'bg-blue-50 text-blue-600' },
    { icon: TrendingUp, label: 'Active Trials', value: data?.active_trials ?? 0, color: 'bg-amber-50 text-amber-600' },
    { icon: AlertTriangle, label: 'Expiring ≤7 Days', value: data?.expiring_soon ?? 0, color: 'bg-red-50 text-red-600' },
    { icon: CheckCircle2, label: 'Active Clients', value: data?.active_clients ?? 0, color: 'bg-green-50 text-green-600' },
    { icon: Users, label: 'Unclaimed Demos', value: data?.unclaimed_demos ?? 0, color: 'bg-violet-50 text-violet-600' },
  ]

  const getStatusBadge = (type: string, status: string | null) => {
    if (type === 'signup') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Signed Up</span>
    }
    switch (status) {
      case 'upcoming':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Upcoming</span>
      case 'completed':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">Completed</span>
      case 'cancelled':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">Cancelled</span>
      case 'no_show':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">No Show</span>
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Ops Hub</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Command center for Cursive client operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Activity size={15} className="text-zinc-400" />
            <h2 className="text-[14px] font-medium text-zinc-900">Live Activity</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-zinc-400 text-sm">Loading...</div>
          ) : !data?.activity_feed?.length ? (
            <div className="p-8 text-center text-zinc-400 text-sm">No recent activity</div>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {data.activity_feed.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-start gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.type === 'booking' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                  }`}>
                    {item.type === 'booking' ? <Calendar size={13} /> : <Users size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-zinc-800">{item.label}</div>
                    {item.sub && <div className="text-[12px] text-zinc-400">{item.sub}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(item.type, item.status)}
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-medium text-zinc-500 uppercase tracking-wide">Quick Access</h2>
          <QuickLink
            href="/admin/ops/pipeline"
            icon={Kanban}
            title="Pipeline Kanban"
            description="Track every client from Booked to Active"
            accent="bg-blue-50 text-blue-600"
          />
          <QuickLink
            href="/admin/ops/calls"
            icon={Calendar}
            title="Booking Log"
            description="Full Cal.com booking history + conversion rate"
            accent="bg-amber-50 text-amber-600"
          />
          <QuickLink
            href="/admin/ops/visitors"
            icon={Eye}
            title="Prospecting Feed"
            description="meetcursive.com pixel visitors ready to outreach"
            accent="bg-violet-50 text-violet-600"
          />
          <QuickLink
            href="/admin/accounts"
            icon={Users}
            title="All Accounts"
            description="Full accounts table with suspend + impersonate"
            accent="bg-zinc-100 text-zinc-600"
          />
        </div>
      </div>
    </div>
  )
}
