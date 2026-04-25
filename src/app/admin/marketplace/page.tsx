/**
 * Admin — Marketplace overview.
 * `/admin/marketplace`
 *
 * Cross-workspace view of GHL + Shopify install state. Used by Cursive
 * ops to monitor install health, recent failures, and sync volume.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SourceSummary {
  total: number
  active: number
  uninstalled: number
  pixel_active: number
  pixel_pending: number
  sync_enabled: number
}

interface OverviewData {
  summary: { ghl: SourceSummary; shopify: SourceSummary }
  installs: Array<{
    id: string
    source: 'ghl' | 'shopify'
    status: string
    pixel_deployment_status: string
    plan_tier: string | null
    sync_visitors_enabled: boolean
    external_name: string | null
    external_id: string
    workspace_id: string
    installed_at: string
    last_visitor_sync_at: string | null
    visitor_sync_count: number
  }>
  recent_failures: Array<{
    source: string
    topic: string
    status: string
    error_message: string | null
    created_at: string
    install_id: string | null
  }>
  recent_syncs: Array<{
    id: string
    source: string
    job_type: string
    status: string
    visitors_synced: number
    visitors_failed: number
    error_message: string | null
    started_at: string
    completed_at: string | null
    install_id: string
  }>
}

export default function MarketplaceOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'ghl' | 'shopify'>('all')

  useEffect(() => {
    fetch('/api/admin/marketplace/overview')
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error)
        else setData(j)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Network error'))
  }, [])

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      </div>
    )
  }
  if (!data) return <div className="p-8 text-sm text-gray-500">Loading…</div>

  const installs = filter === 'all' ? data.installs : data.installs.filter((i) => i.source === filter)

  return (
    <div className="mx-auto max-w-7xl p-8">
      <h1 className="text-2xl font-semibold">Marketplace Overview</h1>
      <p className="mt-1 text-sm text-gray-600">
        Cross-workspace install state for GHL + Shopify marketplace apps.
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SourceCard label="GoHighLevel" data={data.summary.ghl} />
        <SourceCard label="Shopify" data={data.summary.shopify} />
      </div>

      {/* Filter */}
      <div className="mt-8 flex gap-2">
        {(['all', 'ghl', 'shopify'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              filter === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All sources' : f === 'ghl' ? 'GHL' : 'Shopify'}
          </button>
        ))}
      </div>

      {/* Installs table */}
      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Source</th>
              <th className="px-4 py-2 text-left">External name / ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Pixel</th>
              <th className="px-4 py-2 text-left">Plan</th>
              <th className="px-4 py-2 text-left">Synced</th>
              <th className="px-4 py-2 text-left">Last sync</th>
              <th className="px-4 py-2 text-left">Installed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {installs.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{i.source}</td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{i.external_name ?? '—'}</div>
                  <div className="font-mono text-xs text-gray-500">{i.external_id}</div>
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    i.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    i.status === 'uninstalled' ? 'bg-gray-100 text-gray-700' :
                    'bg-amber-100 text-amber-800'
                  }`}>{i.status}</span>
                </td>
                <td className="px-4 py-2 text-gray-700">{i.pixel_deployment_status}</td>
                <td className="px-4 py-2 text-gray-700">{i.plan_tier ?? 'trial'}</td>
                <td className="px-4 py-2 text-gray-700">{i.visitor_sync_count.toLocaleString()}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {i.last_visitor_sync_at
                    ? new Date(i.last_visitor_sync_at).toLocaleString()
                    : 'Never'}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(i.installed_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {installs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No installs in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent failures */}
      <h2 className="mt-10 text-lg font-semibold">Recent webhook failures</h2>
      {data.recent_failures.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No webhook failures.</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Topic</th>
                <th className="px-4 py-2 text-left">Error</th>
                <th className="px-4 py-2 text-left">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recent_failures.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{f.source}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">{f.topic}</td>
                  <td className="px-4 py-2 text-xs text-red-700">{f.error_message ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(f.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent syncs */}
      <h2 className="mt-10 text-lg font-semibold">Recent sync runs</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Source</th>
              <th className="px-4 py-2 text-left">Job</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Synced</th>
              <th className="px-4 py-2 text-left">Failed</th>
              <th className="px-4 py-2 text-left">Started</th>
              <th className="px-4 py-2 text-left">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.recent_syncs.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{s.source}</td>
                <td className="px-4 py-2 text-gray-700">{s.job_type}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    s.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                    s.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                    s.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>{s.status}</span>
                </td>
                <td className="px-4 py-2 text-gray-700">{s.visitors_synced ?? 0}</td>
                <td className="px-4 py-2 text-gray-700">{s.visitors_failed ?? 0}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {new Date(s.started_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {s.completed_at ? new Date(s.completed_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-xs text-gray-500">
        <Link href="/admin/install-demo" className="text-blue-600 hover:underline">
          Open install demo →
        </Link>
      </p>
    </div>
  )
}

function SourceCard({ label, data }: { label: string; data: SourceSummary }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-base font-semibold text-gray-900">{label}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Active" value={data.active} tone="emerald" />
        <Stat label="Pixel live" value={data.pixel_active} tone="emerald" />
        <Stat label="Pending" value={data.pixel_pending} tone="amber" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Sync on" value={data.sync_enabled} tone="blue" />
        <Stat label="Uninstalled" value={data.uninstalled} tone="gray" />
        <Stat label="Total" value={data.total} tone="gray" />
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'blue' | 'gray' }) {
  const colorMap = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    gray: 'text-gray-700',
  }
  return (
    <div className="rounded-md bg-gray-50 p-2">
      <div className={`text-xl font-semibold ${colorMap[tone]}`}>{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  )
}
