'use client'

/**
 * /admin/ops/pipeline — Kanban Board
 * Columns: Booked (pre-signup) | New | Trial | Active | At Risk | Churned
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Globe, Mail, Copy, Check, ExternalLink, RefreshCw, AlertTriangle,
  Circle, CheckCircle2, Users, ChevronLeft, ArrowRight, Search,
} from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineWorkspace {
  id: string
  name: string
  industry_vertical: string | null
  ops_stage: string
  website_url: string | null
  created_at: string
  owner_email: string | null
  owner_name: string | null
  pixel_status: 'live' | 'inactive' | 'none'
  trial_status: string | null
  trial_days_remaining: number | null
  leads_this_week: number
}

interface ProspectBooking {
  id: string
  booking_uid: string
  attendee_name: string
  attendee_email: string
  start_time: string
  end_time: string
  status: string
}

interface PipelineData {
  workspaces: PipelineWorkspace[]
  prospects: ProspectBooking[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'booked', label: 'Booked', color: 'border-t-blue-400', badge: 'bg-blue-100 text-blue-700', description: 'Pre-signup prospects' },
  { id: 'new', label: 'New', color: 'border-t-zinc-400', badge: 'bg-zinc-100 text-zinc-700', description: 'Signed up, not yet in trial' },
  { id: 'trial', label: 'Trial', color: 'border-t-amber-400', badge: 'bg-amber-100 text-amber-700', description: 'Active 14-day trial' },
  { id: 'active', label: 'Active', color: 'border-t-green-500', badge: 'bg-green-100 text-green-700', description: 'Paying client' },
  { id: 'at_risk', label: 'At Risk', color: 'border-t-red-400', badge: 'bg-red-100 text-red-700', description: 'Trial expiring ≤3 days' },
  { id: 'churned', label: 'Churned', color: 'border-t-zinc-300', badge: 'bg-zinc-100 text-zinc-500', description: 'Lost' },
] as const

const STAGE_OPTIONS = ['new', 'booked', 'trial', 'active', 'at_risk', 'churned'] as const

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="ml-1 text-zinc-400 hover:text-zinc-600 transition-colors" title="Copy">
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

function PixelDot({ status }: { status: 'live' | 'inactive' | 'none' }) {
  if (status === 'live') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Pixel live" />
  if (status === 'inactive') return <span className="inline-block w-2 h-2 rounded-full bg-amber-400" title="Pixel inactive" />
  return <span className="inline-block w-2 h-2 rounded-full bg-zinc-300" title="No pixel" />
}

function WorkspaceCard({
  w,
  onStageChange,
  onImpersonate,
  isUpdating,
}: {
  w: PipelineWorkspace
  onStageChange: (id: string, stage: string) => void
  onImpersonate: (id: string, name: string) => void
  isUpdating: boolean
}) {
  const [stageOpen, setStageOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stageOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStageOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [stageOpen])

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Name row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-medium text-[13px] text-zinc-900 leading-tight truncate">{w.name}</div>
        <PixelDot status={w.pixel_status} />
      </div>

      {/* Industry + leads */}
      <div className="flex items-center gap-2 mb-2">
        {w.industry_vertical && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">{w.industry_vertical}</span>
        )}
        {w.leads_this_week > 0 && (
          <span className="text-[11px] text-zinc-500">{w.leads_this_week} leads this week</span>
        )}
      </div>

      {/* Email */}
      {w.owner_email && (
        <div className="flex items-center text-[12px] text-zinc-500 mb-1">
          <Mail size={11} className="mr-1 flex-shrink-0" />
          <span className="truncate">{w.owner_email}</span>
          <CopyBtn value={w.owner_email} />
        </div>
      )}

      {/* Website */}
      {w.website_url && (
        <div className="flex items-center text-[12px] text-zinc-500 mb-2">
          <Globe size={11} className="mr-1 flex-shrink-0" />
          <a href={w.website_url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary">
            {w.website_url.replace(/^https?:\/\//, '')}
          </a>
          <ExternalLink size={10} className="ml-1 flex-shrink-0" />
        </div>
      )}

      {/* Trial days */}
      {w.trial_days_remaining !== null && w.trial_status === 'trial' && (
        <div className={`text-[11px] mb-2 font-medium ${w.trial_days_remaining <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
          {w.trial_days_remaining === 0 ? 'Expires today' : `${w.trial_days_remaining}d left in trial`}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100">
        <button
          onClick={() => onImpersonate(w.id, w.name)}
          className="text-[11px] text-primary hover:text-primary/80 font-medium"
        >
          Switch Into
        </button>
        {w.owner_email && (
          <>
            <span className="text-zinc-200">·</span>
            <a
              href={`mailto:${w.owner_email}?subject=${encodeURIComponent(`Your Cursive account — ${w.name}`)}`}
              className="text-[11px] text-zinc-500 hover:text-primary font-medium"
              title={`Email ${w.owner_email}`}
            >
              Email
            </a>
          </>
        )}
        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            onClick={() => setStageOpen(!stageOpen)}
            disabled={isUpdating}
            className="text-[11px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded px-2 py-1 flex items-center gap-1"
          >
            Move to...
          </button>
          {stageOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 w-36 py-1">
              {STAGE_OPTIONS.filter((s) => s !== w.ops_stage).map((s) => (
                <button
                  key={s}
                  onClick={() => { onStageChange(w.id, s); setStageOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-zinc-700 hover:bg-zinc-50 capitalize"
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProspectCard({ booking }: { booking: ProspectBooking }) {
  const meetingTime = new Date(booking.start_time)
  const isPast = meetingTime < new Date()
  const mailtoSubject = encodeURIComponent('Following up from our Cursive demo')
  const mailtoBody = encodeURIComponent(
    `Hi ${booking.attendee_name.split(' ')[0]},\n\nGreat connecting with you${isPast ? '' : ' — looking forward to our call'}. Wanted to follow up on getting Cursive set up for you.\n\nBest,\nDarren`
  )

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
      <div className="font-medium text-[13px] text-zinc-900 mb-1">{booking.attendee_name}</div>
      <div className="flex items-center text-[12px] text-zinc-500 mb-1">
        <Mail size={11} className="mr-1 flex-shrink-0" />
        <span className="truncate">{booking.attendee_email}</span>
        <CopyBtn value={booking.attendee_email} />
      </div>
      <div className={`flex items-center gap-1 text-[11px] font-medium mb-2 ${isPast ? 'text-zinc-400' : 'text-blue-600'}`}>
        {isPast ? <CheckCircle2 size={11} /> : <ArrowRight size={11} />}
        {meetingTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
        {meetingTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
        <a
          href={`mailto:${booking.attendee_email}?subject=${mailtoSubject}&body=${mailtoBody}`}
          className="text-[11px] text-primary hover:text-primary/80 font-medium"
        >
          Email
        </a>
        <span className="text-zinc-200">·</span>
        <span className={`text-[11px] ${booking.status === 'upcoming' ? 'text-blue-500' : 'text-zinc-400'}`}>
          {booking.status}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState('')
  const [impersonateId, setImpersonateId] = useState<string | null>(null)
  const [impersonateName, setImpersonateName] = useState('')
  const [impersonateReason, setImpersonateReason] = useState('')
  const [impersonating, setImpersonating] = useState(false)

  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightStage = searchParams.get('stage')
  const { toast } = useToast()

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

  const { data, isLoading, refetch } = useQuery<PipelineData>({
    queryKey: ['admin', 'ops', 'pipeline'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ops/pipeline')
      if (!res.ok) throw new Error('Failed to load pipeline')
      return res.json()
    },
    enabled: authChecked && isAdmin,
  })

  const stageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/admin/ops/pipeline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ops_stage: stage }),
      })
      if (!res.ok) throw new Error('Failed to update stage')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops', 'pipeline'] })
      toast({ type: 'success', message: 'Stage updated' })
    },
    onError: () => toast({ type: 'error', message: 'Failed to update stage' }),
  })

  const handleImpersonate = async () => {
    if (!impersonateId) return
    setImpersonating(true)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: impersonateId, reason: impersonateReason }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/dashboard')
    } catch {
      toast({ type: 'error', message: 'Failed to switch into account' })
    } finally {
      setImpersonating(false)
    }
  }

  const q = search.trim().toLowerCase()
  const workspaces = useMemo(() => {
    const all = data?.workspaces || []
    if (!q) return all
    return all.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.owner_email || '').toLowerCase().includes(q) ||
        (w.industry_vertical || '').toLowerCase().includes(q)
    )
  }, [data?.workspaces, q])
  const prospects = useMemo(() => {
    const all = data?.prospects || []
    if (!q) return all
    return all.filter(
      (p) =>
        p.attendee_name.toLowerCase().includes(q) ||
        p.attendee_email.toLowerCase().includes(q)
    )
  }, [data?.prospects, q])

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

  const getColumnWorkspaces = (stageId: string) =>
    workspaces.filter((w) => w.ops_stage === stageId)

  return (
    <div className="px-4 py-6 min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/ops" className="inline-flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-600 mb-1 transition-colors">
            <ChevronLeft size={13} />
            Ops Hub
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Pipeline</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {(data?.workspaces || []).length} accounts · {(data?.prospects || []).length} prospects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or email..."
              className="h-9 pl-8 pr-3 text-[13px] bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-52"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg px-3 py-1.5 bg-white whitespace-nowrap"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">Loading pipeline...</div>
      ) : (
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map((col) => {
            const items = col.id === 'booked' ? [] : getColumnWorkspaces(col.id)
            const columnProspects = col.id === 'booked' ? prospects : []
            const total = items.length + columnProspects.length

            return (
              <div key={col.id} className={`flex flex-col border-t-2 ${col.color} rounded-lg${highlightStage === col.id ? ' ring-2 ring-offset-1 ring-zinc-400' : ''}`}>
                {/* Column header */}
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-zinc-700">{col.label}</span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${col.badge}`}>{total}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{col.description}</p>
                </div>

                {/* Cards */}
                <div className="flex-1 px-2 pb-3 space-y-2">
                  {columnProspects.map((p) => (
                    <ProspectCard key={p.id} booking={p} />
                  ))}
                  {items.map((w) => (
                    <WorkspaceCard
                      key={w.id}
                      w={w}
                      onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
                      onImpersonate={(id, name) => {
                        setImpersonateId(id)
                        setImpersonateName(name)
                        setImpersonateReason('')
                      }}
                      isUpdating={stageMutation.isPending}
                    />
                  ))}
                  {total === 0 && (
                    <div className="text-center py-6 text-[12px] text-zinc-300">Empty</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Impersonation Modal */}
      {impersonateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setImpersonateId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Switch Into Account</h3>
            <p className="text-sm text-zinc-600 mb-4">
              You&apos;re about to view <strong>{impersonateName}</strong>&apos;s account. All actions will be logged.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="e.g., Client support request"
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setImpersonateId(null)} className="px-4 py-2 text-sm text-zinc-600">Cancel</button>
              <button
                onClick={handleImpersonate}
                disabled={impersonating}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg disabled:opacity-50"
              >
                {impersonating ? 'Switching...' : 'Switch Into Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
