/**
 * Shared types and helpers for Website Visitors dashboard components.
 */

// ─── Types ─────────────────────────────────────────────────

export interface VisitorLead {
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
  intent_score_calculated: number | null
  enrichment_status: string | null
  created_at: string
  source: string | null
  linkedin_url: string | null
}

export interface VisitorStats {
  total: number
  this_week: number
  enriched: number
  avg_score: number
  match_rate: number
}

export interface PixelInfo {
  pixel_id: string
  domain: string
  trial_status: string | null
  trial_ends_at: string | null
  is_active: boolean
}

export interface VisitorsResponse {
  visitors: VisitorLead[]
  pagination: { total: number; page: number; limit: number; pages: number }
  stats: VisitorStats
  pixel: PixelInfo | null
}

// ─── Constants ─────────────────────────────────────────────

export const DATE_RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
]

export const ENRICHMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Enriched', value: 'enriched' },
  { label: 'Unenriched', value: 'unenriched' },
]

// ─── Helpers ───────────────────────────────────────────────

export function getIntentColor(score: number | null): string {
  if (!score) return 'text-gray-400'
  if (score >= 70) return 'text-emerald-700'
  if (score >= 40) return 'text-amber-600'
  return 'text-slate-600'
}

export function getIntentBg(score: number | null): string {
  if (!score) return 'bg-gray-100'
  if (score >= 70) return 'bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-slate-100 border-slate-200'
}

export function getInitials(lead: VisitorLead): string {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
  ]
  const idx = id.charCodeAt(0) % colors.length
  return colors[idx]
}

// ─── CSV Export ────────────────────────────────────────────

export function exportVisitorsCSV(visitors: VisitorLead[], dateRange: string) {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'City', 'State', 'Intent Score', 'Enrichment', 'Visited']
  const rows = visitors.map((v) => [
    v.full_name || [v.first_name, v.last_name].filter(Boolean).join(' ') || '',
    v.email || '',
    v.phone || '',
    v.company_name || '',
    v.job_title || '',
    v.city || '',
    v.state || '',
    v.intent_score_calculated ?? '',
    v.enrichment_status || '',
    v.created_at ? new Date(v.created_at).toLocaleDateString() : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cursive-visitors-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
