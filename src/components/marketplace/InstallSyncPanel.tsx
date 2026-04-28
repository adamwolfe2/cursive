/**
 * Per-install sync panel: re-sync button + sync history log.
 * Used inside the GHL + Shopify integration settings pages.
 */

'use client'

import { useEffect, useState } from 'react'

interface SyncLog {
  id: string
  source: string
  job_type: string
  status: 'pending' | 'success' | 'partial' | 'failed'
  visitors_processed: number
  visitors_synced: number
  visitors_failed: number
  error_message: string | null
  metadata: Record<string, unknown> | null
  started_at: string
  completed_at: string | null
}

const STATUS_TONE: Record<SyncLog['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  success: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
}

export function InstallSyncPanel({ installId }: { installId: string }) {
  const [logs, setLogs] = useState<SyncLog[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resyncing, setResyncing] = useState(false)
  const [resyncMessage, setResyncMessage] = useState<string | null>(null)

  async function refresh() {
    try {
      const res = await fetch(`/api/integrations/sync-log?install_id=${installId}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load sync history')
        return
      }
      setLogs(json.logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
  }

  useEffect(() => {
    refresh()
  }, [installId])

  async function handleResync() {
    setResyncing(true)
    setResyncMessage(null)
    try {
      const res = await fetch('/api/integrations/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ install_id: installId, lookback_hours: 24 }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResyncMessage(`Error: ${json.error ?? 'unknown'}`)
      } else {
        setResyncMessage(json.message ?? 'Re-sync queued.')
      }
      await refresh()
    } finally {
      setResyncing(false)
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">Sync history</div>
          <div className="mt-0.5 text-xs text-gray-500">
            Last 50 sync runs. Sync runs every 6 hours automatically.
          </div>
        </div>
        <button
          onClick={handleResync}
          disabled={resyncing}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {resyncing ? 'Queueing…' : 'Re-sync now'}
        </button>
      </div>

      {resyncMessage && (
        <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
          {resyncMessage}
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-900">
          {error}
        </div>
      )}

      {logs && logs.length > 0 ? (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Job</th>
                <th className="px-3 py-1.5 text-left font-medium">Status</th>
                <th className="px-3 py-1.5 text-left font-medium">Synced / Failed</th>
                <th className="px-3 py-1.5 text-left font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-1.5 text-gray-700">{log.job_type}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 ${STATUS_TONE[log.status]}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">
                    {log.visitors_synced ?? 0}
                    {log.visitors_failed > 0 && (
                      <span className="ml-1 text-red-600">/{log.visitors_failed}</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-gray-500">
                    {new Date(log.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : logs && logs.length === 0 ? (
        <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
          No sync runs yet. The first run happens on the 6-hour cron.
        </div>
      ) : null}
    </div>
  )
}
