/**
 * GHL Marketplace App — Settings page.
 * `/integrations/ghl`
 *
 * Lists all GHL installs (locations) connected to this workspace, shows
 * pixel deployment state per location, and lets the user toggle the
 * visitor → GHL contact sync per install.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Install {
  id: string
  external_id: string
  external_name: string | null
  pixel_id: string | null
  pixel_deployment_status: 'not_deployed' | 'pending' | 'active' | 'manual_required' | 'error'
  sync_visitors_enabled: boolean
  last_visitor_sync_at: string | null
  visitor_sync_count: number
  status: string
  installed_at: string
}

const STATUS_LABEL: Record<Install['pixel_deployment_status'], { label: string; tone: string }> = {
  not_deployed: { label: 'Setup needed', tone: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Awaiting first event', tone: 'bg-amber-100 text-amber-800' },
  active: { label: 'Live', tone: 'bg-emerald-100 text-emerald-800' },
  manual_required: { label: 'Re-embed needed', tone: 'bg-orange-100 text-orange-800' },
  error: { label: 'Error', tone: 'bg-red-100 text-red-800' },
}

export default function GhlIntegrationsPage() {
  const [installs, setInstalls] = useState<Install[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingToggle, setPendingToggle] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      const res = await fetch('/api/integrations/ghl-app/installs')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load installs')
        return
      }
      setInstalls(json.installs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
  }

  async function toggleSync(installId: string, current: boolean) {
    setPendingToggle(installId)
    try {
      await fetch('/api/integrations/ghl-app/sync-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ install_id: installId, enabled: !current }),
      })
      await refresh()
    } finally {
      setPendingToggle(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-2 text-sm text-gray-500">Integrations</div>
      <h1 className="text-2xl font-semibold">GoHighLevel</h1>
      <p className="mt-1 text-sm text-gray-600">
        Cursive is connected to your GoHighLevel locations. Identified visitors
        can be auto-synced to your GHL contacts with intent tags.
      </p>

      {!installs ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          {error ? <span className="text-red-600">{error}</span> : 'Loading…'}
        </div>
      ) : installs.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-700">No GoHighLevel locations connected yet.</p>
          <p className="mt-2 text-xs text-gray-500">
            Install Cursive from the GoHighLevel marketplace to connect your sub-accounts.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {installs.map((install) => {
            const status = STATUS_LABEL[install.pixel_deployment_status] ?? STATUS_LABEL.not_deployed
            return (
              <div key={install.id} className="rounded-lg border bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {install.external_name ?? install.external_id}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-500">
                      Location {install.external_id}
                    </div>
                  </div>

                  {install.pixel_deployment_status !== 'active' ? (
                    <Link
                      href={`/integrations/ghl/embed/${install.id}`}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Complete setup
                    </Link>
                  ) : (
                    <Link
                      href={`/integrations/ghl/embed/${install.id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      View setup
                    </Link>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Sync visitors → GHL contacts</div>
                    <div className="mt-1 flex items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={install.sync_visitors_enabled}
                          onChange={() => toggleSync(install.id, install.sync_visitors_enabled)}
                          disabled={pendingToggle === install.id}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="ml-2 text-gray-700">
                          {install.sync_visitors_enabled ? 'On' : 'Off'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Last sync</div>
                    <div className="mt-1 text-gray-700">
                      {install.last_visitor_sync_at
                        ? new Date(install.last_visitor_sync_at).toLocaleString()
                        : 'Not yet'}
                      {install.visitor_sync_count > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({install.visitor_sync_count.toLocaleString()} contacts synced)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
