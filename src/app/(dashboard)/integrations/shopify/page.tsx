/**
 * Shopify Marketplace App — Settings page.
 * `/integrations/shopify`
 *
 * Lists all Shopify shops connected to this workspace, shows pixel
 * deployment state per shop, and toggles for visitor sync and metafield
 * writeback.
 */

'use client'

import { useEffect, useState } from 'react'
import { InstallSyncPanel } from '@/components/marketplace/InstallSyncPanel'

interface Install {
  id: string
  external_id: string
  external_name: string | null
  pixel_id: string | null
  pixel_deployment_status: 'not_deployed' | 'pending' | 'active' | 'manual_required' | 'error'
  sync_visitors_enabled: boolean
  sync_metafields_enabled: boolean
  last_visitor_sync_at: string | null
  visitor_sync_count: number
  status: string
  installed_at: string
  plan_tier: string | null
  trial_ends_at: string | null
}

const STATUS_LABEL: Record<Install['pixel_deployment_status'], { label: string; tone: string }> = {
  not_deployed: { label: 'Setup needed', tone: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Awaiting first event', tone: 'bg-amber-100 text-amber-800' },
  active: { label: 'Live', tone: 'bg-emerald-100 text-emerald-800' },
  manual_required: { label: 'Manual embed needed', tone: 'bg-orange-100 text-orange-800' },
  error: { label: 'Error', tone: 'bg-red-100 text-red-800' },
}

export default function ShopifyIntegrationsPage() {
  const [installs, setInstalls] = useState<Install[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      const res = await fetch('/api/integrations/shopify-app/installs')
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

  async function toggle(installId: string, field: 'sync_visitors_enabled' | 'sync_metafields_enabled', current: boolean) {
    setPendingId(installId + field)
    try {
      await fetch('/api/integrations/shopify-app/sync-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ install_id: installId, field, enabled: !current }),
      })
      await refresh()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-2 text-sm text-gray-500">Integrations</div>
      <h1 className="text-2xl font-semibold">Shopify</h1>
      <p className="mt-1 text-sm text-gray-600">
        Cursive is connected to your Shopify stores. The pixel auto-injects on
        every storefront page (zero theme edits) and identified visitors flow
        directly into your Cursive dashboard.
      </p>

      {!installs ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          {error ? <span className="text-red-600">{error}</span> : 'Loading…'}
        </div>
      ) : installs.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-700">No Shopify stores connected yet.</p>
          <p className="mt-2 text-xs text-gray-500">
            Install Cursive from the Shopify App Store to connect your store.
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
                      {install.plan_tier && install.plan_tier !== 'trial' && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {install.plan_tier}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-500">
                      {install.external_id}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Visitor sync</div>
                    <label className="mt-1 inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={install.sync_visitors_enabled}
                        onChange={() => toggle(install.id, 'sync_visitors_enabled', install.sync_visitors_enabled)}
                        disabled={pendingId === install.id + 'sync_visitors_enabled'}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">
                        {install.sync_visitors_enabled ? 'On' : 'Off'}
                      </span>
                    </label>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Customer metafield writeback</div>
                    <label className="mt-1 inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={install.sync_metafields_enabled}
                        onChange={() => toggle(install.id, 'sync_metafields_enabled', install.sync_metafields_enabled)}
                        disabled={pendingId === install.id + 'sync_metafields_enabled'}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">
                        {install.sync_metafields_enabled ? 'On' : 'Off'}
                      </span>
                    </label>
                    <div className="mt-1 text-xs text-gray-500">
                      Writes <code>cursive.intent_score</code> to matched customers
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Last sync</div>
                    <div className="mt-1 text-gray-700">
                      {install.last_visitor_sync_at
                        ? new Date(install.last_visitor_sync_at).toLocaleString()
                        : 'Not yet'}
                    </div>
                  </div>
                </div>

                <InstallSyncPanel installId={install.id} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
