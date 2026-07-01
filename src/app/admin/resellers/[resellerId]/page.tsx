/**
 * Admin — Reseller detail (platform-admin gated by the /admin layout).
 * Pixels, API keys, and the delivery log for one reseller. Service-role reads.
 */

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { getResellerDetail, type DeliveryRow } from '@/lib/reseller/admin.service'
import type { DeliveryOutcome } from '@/lib/reseller/types'
import PixelActions from '../_components/PixelActions'
import KeyManager from '../_components/KeyManager'

function fmt(n: number | null): string {
  return n == null ? '∞' : n.toLocaleString()
}

const OUTCOME_VARIANT: Record<DeliveryOutcome, 'success' | 'info' | 'warning' | 'muted' | 'destructive'> = {
  delivered: 'success',
  throttled: 'info',
  skipped_cap: 'warning',
  no_destination: 'muted',
  failed: 'destructive',
}

export default async function AdminResellerDetailPage({ params }: { params: Promise<{ resellerId: string }> }) {
  const { resellerId } = await params
  const detail = await getResellerDetail(resellerId)
  if (!detail) notFound()
  const { reseller, pixels, keys, deliveries } = detail

  return (
    <div>
      <PageHeader
        title={reseller.name}
        description="Pixels, API keys, caps, and delivery log for this reseller."
        backButton={{ href: '/admin/resellers', label: 'Resellers' }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Resellers', href: '/admin/resellers' }, { label: reseller.name }]}
        actions={
          <Badge variant={reseller.status === 'active' ? 'success' : 'destructive'} dot>
            {reseller.status}
          </Badge>
        }
      />

      <div className="space-y-8 px-6 py-6">
        {/* Reseller stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Reseller cap / period" value={fmt(reseller.lead_cap_per_period)} />
          <Stat label="Default pixel cap" value={fmt(reseller.default_lead_cap_per_period)} />
          <Stat label="Delivered (period)" value={reseller.leads_delivered_period.toLocaleString()} />
          <Stat label="Delivered (lifetime)" value={reseller.leads_delivered_lifetime.toLocaleString()} />
        </div>

        {/* API keys */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">API keys</h2>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <KeyManager resellerId={reseller.id} keys={keys} />
          </div>
        </section>

        {/* Pixels */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Pixels ({pixels.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-2.5 font-medium">Customer ref</th>
                  <th className="px-4 py-2.5 font-medium">Pixel / domain</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Destination</th>
                  <th className="px-4 py-2.5 font-medium">Throttle</th>
                  <th className="px-4 py-2.5 font-medium">Cap</th>
                  <th className="px-4 py-2.5 font-medium">Delivered (P/L)</th>
                  <th className="px-4 py-2.5 font-medium">Last</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {pixels.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                      No pixels yet.
                    </td>
                  </tr>
                )}
                {pixels.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-50 align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">{p.external_customer_ref}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-zinc-700">{p.pixel_id}</code>
                      <div className="text-[11px] text-zinc-400">{p.domain ?? p.website_url}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'active' ? 'success' : 'muted'} size="sm" dot>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {p.destination_url ? (
                        <span className="text-xs text-zinc-600">{new URL(p.destination_url).host}</span>
                      ) : (
                        <span className="text-xs text-zinc-400">none</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {p.throttle_mode == null ? <span className="text-zinc-400">inherit</span> : p.throttle_mode ? 'on' : 'off'}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{p.lead_cap_per_period == null ? <span className="text-zinc-400">inherit</span> : fmt(p.lead_cap_per_period)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {p.leads_delivered_period.toLocaleString()} / {p.leads_delivered_lifetime.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-zinc-400">
                      {p.last_delivered_at ? new Date(p.last_delivered_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PixelActions
                        pixel={{
                          id: p.id,
                          status: p.status,
                          lead_cap_per_period: p.lead_cap_per_period,
                          throttle_mode: p.throttle_mode,
                          destination_url: p.destination_url,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delivery log */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Delivery log (last {deliveries.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">HTTP</th>
                  <th className="px-4 py-2.5 font-medium">Throttled</th>
                  <th className="px-4 py-2.5 font-medium">Attempts</th>
                  <th className="px-4 py-2.5 font-medium">Lead</th>
                  <th className="px-4 py-2.5 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      No deliveries recorded yet.
                    </td>
                  </tr>
                )}
                {deliveries.map((d: DeliveryRow) => (
                  <tr key={d.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-4 py-2.5 text-[11px] text-zinc-500">{new Date(d.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={OUTCOME_VARIANT[d.status]} size="sm">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">{d.response_status ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{d.throttled ? 'yes' : 'no'}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{d.attempts}</td>
                    <td className="px-4 py-2.5">
                      <code className="text-[11px] text-zinc-500">{d.lead_id ? d.lead_id.slice(0, 8) : '—'}</code>
                    </td>
                    <td className="px-4 py-2.5 max-w-[220px] truncate text-[11px] text-zinc-500" title={d.error_message ?? ''}>
                      {d.error_message ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1.5 text-xl font-semibold text-zinc-900">{value}</div>
    </div>
  )
}
