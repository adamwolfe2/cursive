'use client'

/**
 * /admin/ops/visitors — Platform Pixel Prospecting
 * meetcursive.com visitor feed for outreach
 */

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Eye, Mail, Phone, Linkedin, Copy, Check, ExternalLink,
  Building2, MapPin, SlidersHorizontal, AlertCircle, ChevronLeft, Search,
} from 'lucide-react'

interface Visitor {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  company_domain: string | null
  job_title: string | null
  city: string | null
  state: string | null
  intent_score_calculated: number | null
  enrichment_status: string | null
  created_at: string
  linkedin_url: string | null
}

interface VisitorsData {
  visitors: Visitor[]
  pagination: { total: number; page: number; limit: number; pages: number }
  setup_required?: boolean
  message?: string
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation()
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-zinc-400 hover:text-zinc-600 transition-colors"
      title={`Copy ${value}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

function IntentBadge({ score }: { score: number | null }) {
  if (!score) return null
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {score} intent
    </span>
  )
}

function VisitorCard({ v }: { v: Visitor }) {
  const displayName = v.full_name || [v.first_name, v.last_name].filter(Boolean).join(' ') || 'Unknown'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[12px] font-semibold text-violet-700">{initials || '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-zinc-900">{displayName}</span>
            <IntentBadge score={v.intent_score_calculated} />
          </div>
          {v.job_title && <div className="text-[12px] text-zinc-500">{v.job_title}</div>}
        </div>
      </div>

      {/* Company */}
      {v.company_name && (
        <div className="flex items-center gap-1.5 text-[12px] text-zinc-600 mb-1.5">
          <Building2 size={11} className="text-zinc-400 flex-shrink-0" />
          <span>{v.company_name}</span>
          {v.company_domain && (
            <a href={`https://${v.company_domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={10} className="text-zinc-400 hover:text-zinc-600" />
            </a>
          )}
        </div>
      )}

      {/* Location */}
      {(v.city || v.state) && (
        <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mb-2">
          <MapPin size={11} className="text-zinc-400 flex-shrink-0" />
          <span>{[v.city, v.state].filter(Boolean).join(', ')}</span>
        </div>
      )}

      {/* Contact row */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
        {v.email && (
          <div className="flex items-center gap-1">
            <a href={`mailto:${v.email}`} className="flex items-center gap-1 text-[12px] text-primary hover:text-primary/80">
              <Mail size={12} />
              <span className="max-w-[140px] truncate">{v.email}</span>
            </a>
            <CopyBtn value={v.email} />
          </div>
        )}
        {v.phone && (
          <div className="flex items-center gap-1">
            <a href={`tel:${v.phone}`} className="flex items-center gap-1 text-[12px] text-zinc-600 hover:text-zinc-900">
              <Phone size={12} />
              <span>{v.phone}</span>
            </a>
            <CopyBtn value={v.phone} />
          </div>
        )}
        {v.linkedin_url && (
          <a
            href={v.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Linkedin size={12} />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

export default function VisitorsPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [days, setDays] = useState('30')
  const [minScore, setMinScore] = useState(0)
  const [enrichmentFilter, setEnrichmentFilter] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const supabase = createClient()

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

  const { data, isLoading } = useQuery<VisitorsData>({
    queryKey: ['admin', 'ops', 'visitors', days, minScore, enrichmentFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ days, min_score: String(minScore), page: String(page) })
      if (enrichmentFilter) params.set('enrichment', enrichmentFilter)
      const res = await fetch(`/api/admin/ops/visitors?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: authChecked && isAdmin,
  })

  const filteredVisitors = useMemo(() => {
    const vs = data?.visitors || []
    const q = search.trim().toLowerCase()
    if (!q) return vs
    return vs.filter(
      (v) =>
        (v.full_name || '').toLowerCase().includes(q) ||
        (v.first_name || '').toLowerCase().includes(q) ||
        (v.last_name || '').toLowerCase().includes(q) ||
        (v.company_name || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q)
    )
  }, [data?.visitors, search])

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/ops" className="inline-flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-600 mb-1 transition-colors">
          <ChevronLeft size={13} />
          Ops Hub
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Prospecting Feed</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          meetcursive.com pixel visitors — identified prospects ready for outreach
        </p>
      </div>

      {/* Setup required banner */}
      {data?.setup_required && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-medium text-amber-800">Setup Required</div>
            <div className="text-[12px] text-amber-700 mt-0.5">{data.message}</div>
            <div className="mt-2 text-[12px] text-amber-700 font-mono bg-amber-100 px-2 py-1 rounded inline-block">
              PLATFORM_WORKSPACE_ID=&lt;your-workspace-uuid&gt;
            </div>
            <div className="text-[12px] text-amber-600 mt-1">
              Add this to <code>.env.local</code> and Vercel environment variables, then redeploy.
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!data?.setup_required && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-zinc-400" />
              <span className="text-[12px] text-zinc-500 font-medium">Filters</span>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or company..."
                className="h-9 pl-8 pr-3 text-[13px] bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 w-48"
              />
            </div>
            <div>
              <select
                value={days}
                onChange={(e) => { setDays(e.target.value); setPage(1) }}
                className="h-9 px-3 text-[13px] bg-white border border-zinc-200 rounded-lg focus:outline-none"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <div>
              <select
                value={enrichmentFilter}
                onChange={(e) => { setEnrichmentFilter(e.target.value); setPage(1) }}
                className="h-9 px-3 text-[13px] bg-white border border-zinc-200 rounded-lg focus:outline-none"
              >
                <option value="">All Enrichment</option>
                <option value="enriched">Enriched Only</option>
                <option value="unenriched">Not Enriched</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-zinc-500 whitespace-nowrap">Min Intent: {minScore}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={minScore}
                onChange={(e) => { setMinScore(Number(e.target.value)); setPage(1) }}
                className="w-24"
              />
            </div>
            <div className="ml-auto text-[12px] text-zinc-400">
              {data?.pagination?.total ?? 0} visitors
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Eye size={24} className="mr-3 animate-pulse" />
          Loading visitor feed...
        </div>
      ) : data?.setup_required ? (
        <div className="text-center py-20">
          <Eye size={48} className="mx-auto text-zinc-200 mb-4" />
          <p className="text-zinc-400 text-sm">Set up the platform workspace ID to see visitors</p>
        </div>
      ) : !data?.visitors.length ? (
        <div className="text-center py-20">
          <Eye size={48} className="mx-auto text-zinc-200 mb-4" />
          <p className="text-zinc-500">No pixel visitors match your filters</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting the date range or intent score</p>
        </div>
      ) : !filteredVisitors.length ? (
        <div className="text-center py-20">
          <Search size={32} className="mx-auto text-zinc-200 mb-4" />
          <p className="text-zinc-500">No visitors match your search</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVisitors.map((v) => (
              <VisitorCard key={v.id} v={v} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200">
              <span className="text-[12px] text-zinc-500">
                Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} total
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
        </>
      )}
    </div>
  )
}
