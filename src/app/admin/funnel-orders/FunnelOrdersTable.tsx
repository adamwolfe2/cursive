'use client'

import { useState } from 'react'
import type { FunnelOrder } from '@/lib/funnel/order.service'
import { buildAudienceBuilderPrompt } from '@/lib/funnel/al-taxonomy'

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
        <td className="max-w-xl px-4 py-3 text-xs text-gray-700">
          {order.audience_submitted_at ? (
            <details>
              <summary className="cursor-pointer text-blue-600 hover:underline">
                View ICP + AL builder values
              </summary>
              <ICPDetailPanel order={order} />
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

// ─── ICP detail panel — raw input + audience-builder CTA ──────────────────

function ICPDetailPanel({ order }: { order: FunnelOrder }) {
  const prompt = buildAudienceBuilderPrompt({
    solution: order.audience_solution,
    icp_description: order.audience_icp_description,
    titles: order.audience_titles,
    industries: order.audience_industries,
    employee_range: order.audience_employee_range,
    locations: order.audience_locations,
  })

  const audienceBuilderUrl = `/audience-builder?prompt=${encodeURIComponent(prompt)}`

  return (
    <div className="mt-3 space-y-4">
      {/* Primary action: open the live audience-builder copilot pre-loaded
          with the buyer's ICP. The copilot returns TRUE verified data
          against the live AL taxonomy — segments, industries, seniority,
          job titles, intent topics — instead of regex guesses. */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-1 text-sm font-semibold text-gray-900">
          Build this audience with the live Cursive copilot
        </p>
        <p className="mb-3 text-xs text-gray-600">
          Opens the audience builder with the buyer&apos;s ICP pre-filled.
          The copilot returns verified AL segments, taxonomies, and job
          titles — no guessing.
        </p>
        <a
          href={audienceBuilderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Build in Audience Builder
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </a>
      </div>

      {/* Raw input from buyer — kept visible for reference + as a fallback
          if the copilot needs context that didn't fit in the prompt. */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
            Raw buyer input
          </p>
          <CopyButton
            value={prompt}
            label="Copy prompt"
            confirmedLabel="Prompt copied"
          />
        </div>
        <div className="space-y-1 text-[11px] leading-relaxed text-gray-800">
          <p><span className="font-semibold">Sells:</span> {order.audience_solution}</p>
          <p><span className="font-semibold">ICP:</span> {order.audience_icp_description}</p>
          <p><span className="font-semibold">Titles:</span> {(order.audience_titles ?? []).join(', ')}</p>
          <p><span className="font-semibold">Industries:</span> {(order.audience_industries ?? []).join(', ') || '—'}</p>
          <p><span className="font-semibold">Size:</span> {order.audience_employee_range || '—'}</p>
          <p><span className="font-semibold">Locations:</span> {(order.audience_locations ?? []).join(', ') || '—'}</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-500">
        Workflow: click <span className="font-medium">Build in Audience Builder</span> →
        copilot returns verified segments → export to a Google Sheet →
        drop the Sheet URL into the &quot;Mark delivered&quot; field on
        the right.
      </p>
    </div>
  )
}

function CopyButton({
  value,
  label,
  confirmedLabel,
}: {
  value: string
  label: string
  confirmedLabel: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
    >
      {copied ? confirmedLabel : label}
    </button>
  )
}
