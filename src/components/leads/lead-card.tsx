'use client'

import { useState, memo, useCallback } from 'react'
import {
  Zap, Mail, Phone, MapPin, CheckCircle2,
  ChevronRight, Square, CheckSquare, PhoneCall,
} from 'lucide-react'
import { cn } from '@/lib/design-system'
import { formatDistanceToNow } from 'date-fns'
import { IntentScoreBadge } from './IntentScoreBadge'

// ─── Quick Status ───────────────────────────────────────────

type QuickStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost'

const VALID_QUICK_STATUSES: readonly QuickStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'] as const

const QUICK_STATUS_OPTIONS: { value: QuickStatus; label: string; color: string }[] = [
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { value: 'qualified', label: 'Qualified', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { value: 'won', label: 'Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { value: 'lost', label: 'Not interested', color: 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' },
]

function QuickStatusPill({
  leadId,
  initialStatus,
}: {
  leadId: string
  initialStatus: string | null
}) {
  const [status, setStatus] = useState<QuickStatus>(
    initialStatus && (VALID_QUICK_STATUSES as readonly string[]).includes(initialStatus)
      ? (initialStatus as QuickStatus)
      : 'new'
  )
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSelect = useCallback(async (next: QuickStatus) => {
    if (next === status) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    try {
      await fetch(`/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      setStatus(next)
    } catch {
      // silent fail — status reverts on next load
    } finally {
      setSaving(false)
    }
  }, [leadId, status])

  if (status === 'won') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
        <CheckCircle2 className="h-2.5 w-2.5" /> Won
      </span>
    )
  }

  if (status === 'lost') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 text-[10px] bg-gray-50 text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 font-medium hover:bg-gray-100 transition-colors relative"
      >
        Not interested
        {open && (
          <div className="absolute bottom-6 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[130px]" onClick={e => e.stopPropagation()}>
            {QUICK_STATUS_OPTIONS.filter(o => o.value !== 'lost').map(opt => (
              <button key={opt.value} onClick={() => handleSelect(opt.value)} className={cn('w-full text-left text-[10px] font-medium px-2 py-1.5 rounded-md transition-colors', opt.color)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </button>
    )
  }

  const current = QUICK_STATUS_OPTIONS.find(o => o.value === status)

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 font-medium transition-colors',
          status === 'new'
            ? 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
            : current?.color ?? '',
        )}
      >
        {saving ? '...' : status === 'new' ? '+ Status' : current?.label}
      </button>
      {open && (
        <div className="absolute bottom-6 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[130px]">
          {QUICK_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn('w-full text-left text-[10px] font-medium px-2 py-1.5 rounded-md transition-colors', opt.color, opt.value === status && 'ring-1 ring-current')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────

export interface Lead {
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
  country: string | null
  delivered_at: string | null
  intent_score_calculated: number | null
  freshness_score: number | null
  enrichment_status: string | null
  verification_status: string | null
  status: string | null
  tags: string[] | null
  source: string | null
}

// ─── Helpers ───────────────────────────────────────────────

export function intentColor(score: number | null) {
  if (!score) return { bg: 'bg-gray-100', text: 'text-gray-500' }
  if (score >= 70) return { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' }
  if (score >= 40) return { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' }
  return { bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-600' }
}

export function intentLabel(score: number | null) {
  if (!score) return null
  if (score >= 70) return 'Hot'
  if (score >= 40) return 'Warm'
  return 'Cold'
}

export function getInitials(lead: Lead) {
  const n = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  return n.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

export function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

export function sourceLabel(source: string | null): { label: string; className: string } | null {
  if (!source) return null
  if (source === 'superpixel' || source.includes('superpixel')) {
    return { label: 'Pixel', className: 'bg-sky-50 text-sky-600 border-sky-200' }
  }
  if (source.startsWith('audience_labs') || source.startsWith('audiencelab')) {
    return { label: 'Daily', className: 'bg-blue-50 text-blue-600 border-blue-200' }
  }
  if (source === 'partner') {
    return { label: 'Partner', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
  }
  if (source === 'marketplace') {
    return { label: 'Marketplace', className: 'bg-purple-50 text-purple-600 border-purple-200' }
  }
  if (source === 'query' || source === 'auto_match') {
    return { label: 'Auto-Match', className: 'bg-indigo-50 text-indigo-600 border-indigo-200' }
  }
  if (source === 'import') {
    return { label: 'Import', className: 'bg-gray-50 text-gray-600 border-gray-200' }
  }
  if (source === 'manual') {
    return { label: 'Manual', className: 'bg-amber-50 text-amber-600 border-amber-200' }
  }
  return null
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
  return phone // return as-is if not standard US format
}

// ─── CSV Export ────────────────────────────────────────────

export function exportToCSV(leads: Lead[], filename: string) {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'City', 'State', 'Intent Score', 'Enrichment', 'Delivered']
  const rows = leads.map((l) => [
    l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ') || '',
    l.email || '',
    l.phone || '',
    l.company_name || '',
    l.job_title || '',
    l.city || '',
    l.state || '',
    l.intent_score_calculated ?? '',
    l.enrichment_status || '',
    l.delivered_at ? new Date(l.delivered_at).toLocaleDateString() : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Copy Button ───────────────────────────────────────────

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

// ─── Lead Card ─────────────────────────────────────────────

export const LeadCard = memo(function LeadCard({
  lead,
  onEnrich,
  onView,
  selectionMode,
  isSelected,
  onToggleSelect,
  creditsRemaining = 0,
}: {
  lead: Lead
  onEnrich: (lead: Lead) => void
  onView: (id: string) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  creditsRemaining?: number
}) {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Lead'
  const isEnriched = lead.enrichment_status === 'enriched'

  return (
    <div
      className={cn(
        'group bg-white rounded-xl border p-5 hover:shadow-sm transition-all cursor-pointer',
        isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-gray-200 hover:border-gray-300',
      )}
      onClick={selectionMode ? () => onToggleSelect?.(lead.id) : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Avatar or checkbox */}
        {selectionMode ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(lead.id) }}
            className="h-9 w-9 flex items-center justify-center shrink-0"
          >
            {isSelected
              ? <CheckSquare className="h-5 w-5 text-primary" />
              : <Square className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
            }
          </button>
        ) : (
          <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0', avatarColor(lead.id))}>
            {getInitials(lead)}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="min-w-0">
              <button
                onClick={() => onView(lead.id)}
                className="font-semibold text-gray-900 hover:text-primary transition-colors text-sm text-left block truncate"
              >
                {name}
              </button>
              {(lead.job_title || lead.company_name) && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {[lead.job_title, lead.company_name].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Intent badge */}
            {lead.intent_score_calculated !== null && (
              <div className="shrink-0">
                <IntentScoreBadge score={lead.intent_score_calculated} />
              </div>
            )}
          </div>

          {/* Contact + location */}
          <div className="mt-2 space-y-1">
            {lead.email && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="truncate flex-1">{lead.email}</span>
                {lead.verification_status === 'valid' && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                )}
                <CopyButton value={lead.email} />
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="flex-1">{formatPhone(lead.phone)}</span>
                <CopyButton value={lead.phone} />
              </div>
            )}
            {(lead.city || lead.state) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {[lead.city, lead.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{t}</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isEnriched && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                  <Zap className="h-2.5 w-2.5" /> Enriched
                </span>
              )}
              {(() => {
                const src = sourceLabel(lead.source)
                return src ? (
                  <span className={cn('inline-flex items-center text-[10px] border rounded-full px-2 py-0.5 font-medium', src.className)}>
                    {src.label}
                  </span>
                ) : null
              })()}
              {!isEnriched && !sourceLabel(lead.source) && (
                <span className="text-[10px] text-gray-400">
                  {lead.delivered_at ? formatDistanceToNow(new Date(lead.delivered_at), { addSuffix: true }) : ''}
                </span>
              )}
              {/* Quick status pill — inline workflow tracker */}
              {!selectionMode && (
                <QuickStatusPill leadId={lead.id} initialStatus={lead.status} />
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEnriched && lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 hover:border-primary hover:text-primary transition-colors"
                  title={`Email ${lead.email}`}
                >
                  <Mail className="h-3 w-3" />
                </a>
              )}
              {isEnriched && lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 hover:border-primary hover:text-primary transition-colors"
                  title={`Call ${lead.phone}`}
                >
                  <PhoneCall className="h-3 w-3" />
                </a>
              )}
              {!isEnriched && creditsRemaining === 0 && (
                <a
                  href="/settings/billing"
                  className="inline-flex items-center gap-1 text-xs bg-gray-400 text-white rounded-full px-2.5 py-1 font-medium hover:bg-gray-500 transition-colors"
                >
                  <Zap className="h-2.5 w-2.5" /> Buy Credits
                </a>
              )}
              {!isEnriched && creditsRemaining > 0 && (
                <button
                  onClick={() => onEnrich(lead)}
                  className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-blue-500 to-primary text-white rounded-full px-2.5 py-1 font-medium hover:opacity-90 transition-opacity"
                >
                  <Zap className="h-2.5 w-2.5" /> Enrich
                  {creditsRemaining <= 5 && (
                    <span className="ml-0.5 text-[9px] opacity-80">{creditsRemaining} left</span>
                  )}
                </button>
              )}
              <button
                onClick={() => onView(lead.id)}
                className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-full px-2.5 py-1 hover:border-primary hover:text-primary transition-colors"
              >
                View <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
