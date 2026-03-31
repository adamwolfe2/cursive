'use client'

/**
 * /admin/audiencelab/segments — Segment Catalog
 * Upload the 20k CSV, search segments, browse by category/type.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { Upload, RefreshCw, Search, X } from 'lucide-react'
import { safeError } from '@/lib/utils/log-sanitizer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Segment {
  segment_id: string
  name: string
  category: string
  sub_category: string | null
  description: string | null
  keywords: string | null
  type: string
}

interface Stats {
  total: number
  b2b: number
  b2c: number
  categories: number
}

// ── Simple CSV parser (handles quoted fields) ───────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const fields: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else { inQuote = !inQuote }
      } else if (ch === ',' && !inQuote) {
        fields.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur)
    return fields
  }

  const headers = parseRow(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = parseRow(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim() })
    return obj
  })
}

// Map CSV headers → table columns (handles original headers OR already-renamed)
function mapRow(row: Record<string, string>) {
  return {
    segment_id:   row['segment_id']   || row['Segment ID']   || '',
    category:     row['category']     || row['Category']     || '',
    sub_category: row['sub_category'] || row['Sub Category'] || null,
    name:         row['name']         || row['Premade']      || '',
    description:  row['description']  || row['Premade Description'] || null,
    keywords:     row['keywords']     || row['Premade Keywords']    || null,
    type:         row['type']         || row['Type']         || 'B2C',
  }
}

const BATCH = 200

export default function SegmentCatalogPage() {
  const supabase = createClient()
  const { isAdmin, authChecked } = useAdminAuth()

  // Stats + segments
  const [stats, setStats] = useState<Stats | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  // Search / filters
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [types, setTypes] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Import state
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Selected segment detail
  const [selected, setSelected] = useState<Segment | null>(null)

  useEffect(() => {
    if (authChecked && isAdmin) {
      loadStats()
    }
  }, [authChecked, isAdmin])

  // ── Stats: use API route (service role) for accurate counts ─────────────────
  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/audiencelab/segments/stats')
      if (!res.ok) return
      const data = await res.json()
      setStats({ total: data.total, b2b: data.b2b, b2c: data.b2c, categories: data.categories })
      setTypes(data.types ?? [])
      setCategories(data.categoryList ?? [])
    } catch {}
  }

  const loadSegments = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('al_segment_catalog')
      .select('segment_id, name, category, sub_category, description, keywords, type')
      .limit(100)
      .order('name')

    if (typeFilter !== 'all') q = q.eq('type', typeFilter)
    if (categoryFilter !== 'all') q = q.eq('category', categoryFilter)
    if (query.trim()) q = q.textSearch('search_tsv', query.trim(), { type: 'websearch' })

    const { data } = await q
    setSegments(data ?? [])
    setLoading(false)
  }, [supabase, query, typeFilter, categoryFilter])

  useEffect(() => {
    if (authChecked && isAdmin) loadSegments()
  }, [loadSegments, authChecked, isAdmin])

  // ── CSV Import: write directly to Supabase (no Vercel, no rate limits) ──────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setImportProgress(null)

    const text = await file.text()
    const rows = parseCSV(text).map(mapRow).filter(r => r.segment_id && r.name)

    let done = 0
    let total_inserted = 0
    let errors = 0
    const total = rows.length

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      try {
        const { error } = await supabase
          .from('al_segment_catalog')
          .upsert(
            batch.map(r => ({
              segment_id:   String(r.segment_id).trim(),
              category:     r.category?.trim() ?? '',
              sub_category: r.sub_category?.trim() ?? null,
              name:         r.name?.trim() ?? '',
              description:  r.description?.trim() ?? null,
              keywords:     r.keywords?.trim() ?? null,
              type:         r.type?.trim() ?? 'B2C',
            })),
            { onConflict: 'segment_id' }
          )
        if (error) throw error
        total_inserted += batch.length
      } catch (err: unknown) {
        errors++
        safeError(`Batch ${Math.floor(i / BATCH) + 1} failed:`, err instanceof Error ? err.message : err)
      }
      done += batch.length
      setImportProgress({ done, total })
    }

    setImporting(false)
    setImportResult(
      errors > 0
        ? `Imported ${total_inserted.toLocaleString()} of ${total.toLocaleString()} rows (${errors} batches failed — try again)`
        : `Imported ${total_inserted.toLocaleString()} of ${total.toLocaleString()} rows successfully`
    )
    loadStats()
    loadSegments()
    if (fileRef.current) fileRef.current.value = ''
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">Checking access...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Segment Catalog</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            {stats ? `${stats.total.toLocaleString()} segments` : 'Loading...'} — searchable by keyword, filterable by type and category
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadStats(); loadSegments() }} disabled={loading}>
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} disabled={importing} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload size={14} className="mr-1.5" />
            {importing
              ? `Importing… ${importProgress?.done?.toLocaleString() ?? 0} / ${importProgress?.total?.toLocaleString() ?? '?'}`
              : 'Upload CSV'}
          </Button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="mb-4 flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-700">
          <span>{importResult}</span>
          <button onClick={() => setImportResult(null)}><X size={14} className="text-zinc-400" /></button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Segments', value: stats.total.toLocaleString() },
            { label: 'B2B', value: stats.b2b.toLocaleString() },
            { label: 'B2C / Other', value: stats.b2c.toLocaleString() },
            { label: 'Categories', value: stats.categories.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500">{s.label}</div>
              <div className="text-2xl font-semibold text-zinc-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, keyword, description…"
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 bg-white min-w-[110px]"
        >
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 bg-white min-w-[180px] max-w-[260px]"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Segment Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Segment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-400 text-sm">Loading...</td></tr>
            ) : segments.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-400 text-sm">
                {stats?.total === 0 ? 'No segments yet — upload the CSV to get started' : 'No segments match your search'}
              </td></tr>
            ) : (
              segments.map(seg => (
                <tr
                  key={seg.segment_id}
                  className="hover:bg-zinc-50 cursor-pointer"
                  onClick={() => setSelected(seg)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{seg.name}</div>
                    <div className="text-xs text-zinc-400">{[seg.category, seg.sub_category].filter(Boolean).join(' › ')}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{seg.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">{seg.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{seg.segment_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {segments.length === 100 && (
          <div className="px-4 py-3 border-t border-zinc-100 text-xs text-zinc-400 text-center">
            Showing first 100 results — refine your search to narrow down
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-zinc-900">{selected.name}</h3>
              <button onClick={() => setSelected(null)}><X size={16} className="text-zinc-400" /></button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">#{selected.segment_id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">{selected.type}</span>
            </div>
            {selected.description && (
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Description</div>
                <p className="text-sm text-zinc-700">{selected.description}</p>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1">Full Path</div>
              <p className="text-sm text-zinc-700">{[selected.category, selected.sub_category, selected.name].filter(Boolean).join(' › ')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Category</div>
                <p className="text-sm text-zinc-700">{selected.category}</p>
              </div>
              {selected.sub_category && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 mb-1">Subcategory</div>
                  <p className="text-sm text-zinc-700">{selected.sub_category}</p>
                </div>
              )}
            </div>
            {selected.keywords && (
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Keywords</div>
                <p className="text-sm text-zinc-600">{selected.keywords}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
