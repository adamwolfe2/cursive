'use client'

import { useState } from 'react'
import type { FunnelOrder } from '@/lib/funnel/order.service'

interface Props {
  orders: FunnelOrder[]
  kind: 'pending' | 'all'
}

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Pending', tone: 'bg-gray-100 text-gray-700' },
  paid: { label: 'Paid', tone: 'bg-blue-100 text-blue-700' },
  awaiting_pixel: { label: 'Awaiting Pixel', tone: 'bg-amber-100 text-amber-800' },
  awaiting_audience: { label: 'Awaiting Audience', tone: 'bg-amber-100 text-amber-800' },
  awaiting_delivery: { label: 'Awaiting Delivery', tone: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', tone: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelled', tone: 'bg-red-100 text-red-700' },
}

export function FunnelOrdersTable({ orders, kind }: Props) {
  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        {kind === 'pending' ? 'No orders waiting on delivery.' : 'No orders yet.'}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Offer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Audience</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrderRow({ order }: { order: FunnelOrder }) {
  const status = STATUS_LABELS[order.status] ?? { label: order.status, tone: 'bg-gray-100' }
  const isPending = order.status === 'awaiting_delivery'

  return (
    <>
      <tr>
        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
          {new Date(order.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">
            {order.customer_name ?? order.customer_email}
          </p>
          <p className="text-xs text-gray-500">{order.customer_email}</p>
        </td>
        <td className="px-4 py-3 text-xs text-gray-700">{order.offer_slug}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.tone}`}>
            {status.label}
          </span>
        </td>
        <td className="max-w-xs px-4 py-3 text-xs text-gray-700">
          {order.audience_submitted_at ? (
            <details>
              <summary className="cursor-pointer text-blue-600 hover:underline">
                View ICP
              </summary>
              <div className="mt-2 space-y-1 rounded bg-gray-50 p-2 text-[11px] leading-relaxed">
                <p><span className="font-semibold">Sells:</span> {order.audience_solution}</p>
                <p><span className="font-semibold">ICP:</span> {order.audience_icp_description}</p>
                <p><span className="font-semibold">Titles:</span> {(order.audience_titles ?? []).join(', ')}</p>
                <p><span className="font-semibold">Industries:</span> {(order.audience_industries ?? []).join(', ') || '—'}</p>
                <p><span className="font-semibold">Size:</span> {order.audience_employee_range || '—'}</p>
                <p><span className="font-semibold">Locations:</span> {(order.audience_locations ?? []).join(', ') || '—'}</p>
              </div>
            </details>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          {isPending ? (
            <DeliverActionInline orderId={order.id} />
          ) : order.audience_sheet_url ? (
            <a
              href={order.audience_sheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View sheet
            </a>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
      </tr>
    </>
  )
}

function DeliverActionInline({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDeliver() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/funnel-orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_url: sheetUrl }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(json.error || `Failed (HTTP ${res.status})`)
      }
      // Hard refresh to re-render list
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not deliver.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
      >
        Mark delivered
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        type="url"
        value={sheetUrl}
        onChange={(e) => setSheetUrl(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/..."
        disabled={submitting}
        className="w-72 rounded-md border border-gray-300 px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setSheetUrl('')
            setError(null)
          }}
          disabled={submitting}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDeliver}
          disabled={submitting || !sheetUrl}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send + mark delivered'}
        </button>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
