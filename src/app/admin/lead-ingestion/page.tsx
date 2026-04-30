'use client'

/**
 * /admin/lead-ingestion — Pull Leads from AudienceLab
 * Admin tool for triggering segment-based lead ingestion into target workspaces.
 * Used for demos and client onboarding.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { RefreshCw, Search, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Segment {
  segment_id: string
  name: string
  category: string
  sub_category: string | null
  type: string
}

interface Workspace {
  id: string
  name: string
  slug: string
}

interface PreviewResult {
  success: boolean
  count: number
  sample_size: number
  sample: Record<string, unknown>[]
  field_coverage?: Record<string, number>
  segment_id?: string
}

interface IngestResult {
  success: boolean
  job_id: string | null
  audience_id: string
  available_count: number
  total_fetched: number
  total_processed: number
  leads_created: number
  duplicates_or_filtered: number
  quota_skipped: number
  failed: number
  message?: string
}

export default function LeadIngestionPage() {
  const { isAdmin, authChecked } = useAdminAuth()

  // Data
  const [segments, setSegments] = useState<Segment[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedSegmentId, setSelectedSegmentId] = useState('')
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [daysBack, setDaysBack] = useState(5)
  const [maxPages, setMaxPages] = useState(1)

  // Filters for segment search
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Operation state
  const [previewing, setPreviewing] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (categoryFilter) params.set('category', categoryFilter)

      const res = await fetch(`/api/admin/lead-ingestion?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to load data')
        return
      }
      const data = await res.json()
      setSegments(data.segments ?? [])
      setWorkspaces(data.workspaces ?? [])
      setCategories(data.categories ?? [])
    } catch {
      setError('Failed to load segments and workspaces')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter])

  useEffect(() => {
    if (authChecked && isAdmin) {
      loadData()
    }
  }, [authChecked, isAdmin, loadData])

  const selectedSegment = segments.find(s => s.segment_id === selectedSegmentId) ?? null
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId) ?? null

  const handlePreview = async () => {
    if (!selectedSegmentId) return
    setPreviewing(true)
    setPreviewResult(null)
    setIngestResult(null)
    setError(null)

    try {
      const params = new URLSearchParams({
        segment_id: selectedSegmentId,
        days_back: String(daysBack),
        limit: '5',
      })
      const res = await fetch(`/api/audiencelab/ingest?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Preview failed')
        return
      }

      setPreviewResult(data)
    } catch {
      setError('Preview request failed')
    } finally {
      setPreviewing(false)
    }
  }

  const handleIngest = async () => {
    if (!selectedSegmentId || !selectedWorkspaceId) return
    if (!confirm(
      `Pull leads from segment "${selectedSegment?.name}" into workspace "${selectedWorkspace?.name}"?\n\n` +
      `days_back: ${daysBack}, max_pages: ${maxPages}`
    )) return

    setIngesting(true)
    setIngestResult(null)
    setError(null)

    try {
      const res = await fetch('/api/audiencelab/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `admin_pull_${selectedSegment?.name?.replace(/\s+/g, '_').slice(0, 50) ?? selectedSegmentId}`,
          days_back: daysBack,
          segment_ids: [selectedSegmentId],
          max_pages: maxPages,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ingest failed')
        return
      }

      setIngestResult(data)
    } catch {
      setError('Ingest request failed')
    } finally {
      setIngesting(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">
        Checking access...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Pull Leads</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Trigger AudienceLab segment ingestion into a target workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/audiencelab/segments">
            <Button variant="outline" size="sm">
              Segment Catalog
            </Button>
          </Link>
          <Link href="/admin/audiencelab/pixels">
            <Button variant="outline" size="sm">
              Pixel Manager
            </Button>
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[15px] font-medium text-zinc-900">Ingestion Configuration</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Segment Search + Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Segment</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search segments..."
                  className="pl-9"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 bg-white min-w-[160px]"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-10">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </Button>
            </div>
            <select
              value={selectedSegmentId}
              onChange={e => {
                setSelectedSegmentId(e.target.value)
                setPreviewResult(null)
                setIngestResult(null)
              }}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 bg-white"
            >
              <option value="">Select a segment...</option>
              {segments.map(seg => (
                <option key={seg.segment_id} value={seg.segment_id}>
                  {seg.name} ({seg.category}{seg.sub_category ? ` > ${seg.sub_category}` : ''}) [{seg.type}]
                </option>
              ))}
            </select>
            {selectedSegment && (
              <div className="text-xs text-zinc-400 mt-1">
                ID: {selectedSegment.segment_id} | Type: {selectedSegment.type} | Category: {selectedSegment.category}
                {selectedSegment.sub_category ? ` > ${selectedSegment.sub_category}` : ''}
              </div>
            )}
          </div>

          {/* Target Workspace */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Target Workspace</label>
            <select
              value={selectedWorkspaceId}
              onChange={e => setSelectedWorkspaceId(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 bg-white"
            >
              <option value="">Select a workspace...</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} (/{ws.slug})
                </option>
              ))}
            </select>
          </div>

          {/* days_back + max_pages */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Days Back</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={daysBack}
                onChange={e => setDaysBack(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-zinc-400">How far back to look (1-10)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Max Pages</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={maxPages}
                onChange={e => setMaxPages(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-zinc-400">Pages to fetch (1-5, 500 leads/page)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!selectedSegmentId || previewing || ingesting}
            >
              {previewing ? (
                <>
                  <RefreshCw size={14} className="mr-1.5 animate-spin" />
                  Previewing...
                </>
              ) : (
                <>
                  <Eye size={14} className="mr-1.5" />
                  Preview
                </>
              )}
            </Button>
            <Button
              onClick={handleIngest}
              disabled={!selectedSegmentId || !selectedWorkspaceId || ingesting || previewing}
            >
              {ingesting ? (
                <>
                  <RefreshCw size={14} className="mr-1.5 animate-spin" />
                  Pulling Leads...
                </>
              ) : (
                <>
                  <Download size={14} className="mr-1.5" />
                  Pull Leads
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Preview Result */}
      {previewResult && (
        <div className="mt-4 bg-white border border-zinc-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-zinc-900">Preview Results</h2>
            <span className="text-sm text-zinc-500">
              {previewResult.count.toLocaleString()} leads available
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <div className="text-xs text-zinc-500">Available Leads</div>
                <div className="text-2xl font-semibold text-zinc-900 mt-1">
                  {previewResult.count.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <div className="text-xs text-zinc-500">Sample Size</div>
                <div className="text-2xl font-semibold text-zinc-900 mt-1">
                  {previewResult.sample_size}
                </div>
              </div>
            </div>

            {/* Field Coverage */}
            {previewResult.field_coverage && Object.keys(previewResult.field_coverage).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Field Coverage</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewResult.field_coverage)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 15)
                    .map(([field, pct]) => (
                      <span
                        key={field}
                        className="text-xs px-2 py-1 rounded bg-zinc-100 text-zinc-600"
                      >
                        {field}: {typeof pct === 'number' ? `${Math.round(pct)}%` : pct}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Sample Records */}
            {previewResult.sample.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Sample Records</h3>
                <div className="bg-zinc-900 text-emerald-400 p-4 rounded-lg font-mono text-[11px] overflow-auto max-h-64">
                  <pre>{JSON.stringify(previewResult.sample.slice(0, 3), null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingest Result */}
      {ingestResult && (
        <div className="mt-4 bg-white border border-zinc-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-[15px] font-medium text-zinc-900">
              {ingestResult.success ? 'Ingestion Complete' : 'Ingestion Failed'}
            </h2>
          </div>
          <div className="p-5">
            {ingestResult.message && (
              <p className="text-sm text-zinc-600 mb-4">{ingestResult.message}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ResultStat label="Available" value={ingestResult.available_count} />
              <ResultStat label="Fetched" value={ingestResult.total_fetched} />
              <ResultStat label="Processed" value={ingestResult.total_processed} />
              <ResultStat
                label="Leads Created"
                value={ingestResult.leads_created}
                color="text-emerald-600"
              />
              <ResultStat
                label="Duplicates / Filtered"
                value={ingestResult.duplicates_or_filtered}
                color="text-amber-600"
              />
              <ResultStat
                label="Quota Skipped"
                value={ingestResult.quota_skipped}
                color={ingestResult.quota_skipped > 0 ? 'text-red-600' : undefined}
              />
              <ResultStat
                label="Failed"
                value={ingestResult.failed}
                color={ingestResult.failed > 0 ? 'text-red-600' : undefined}
              />
              {ingestResult.job_id && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                  <div className="text-xs text-zinc-500">Job ID</div>
                  <div className="text-xs font-mono text-zinc-600 mt-1 break-all">
                    {ingestResult.job_id}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${color ?? 'text-zinc-900'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}
