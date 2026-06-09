'use client'

import { useState } from 'react'
import type { FunnelOrder } from '@/lib/funnel/order.service'
import { buildAudienceBuilderPrompt } from '@/lib/funnel/al-taxonomy'
import { isPixelV3, isPixelV4 } from '@/lib/funnel/website-url'

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
  const [expanded, setExpanded] = useState(false)
  const hasICP = !!order.audience_submitted_at

  return (
    <>
      <tr>
        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-gray-500">
          {new Date(order.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3 align-top">
          <p className="font-medium text-gray-900">
            {order.customer_name ?? order.customer_email}
          </p>
          <p className="text-xs text-gray-500">{order.customer_email}</p>
        </td>
        <td className="px-4 py-3 align-top text-xs text-gray-700">
          <p>{order.offer_slug}</p>
          {order.pixel_install_url && <PixelVersionBadge installUrl={order.pixel_install_url} />}
        </td>
        <td className="px-4 py-3 align-top">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.tone}`}>
            {status.label}
          </span>
        </td>
        <td className="px-4 py-3 align-top text-xs text-gray-700">
          {hasICP ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              <svg
                className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              {expanded ? 'Hide' : 'View'} ICP + AL builder values
            </button>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 align-top text-right">
          <div className="flex items-center justify-end gap-3">
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
            <DeleteOrderButton order={order} />
          </div>
        </td>
      </tr>
      {expanded && hasICP && (
        <tr className="bg-gray-50/60">
          <td colSpan={6} className="px-4 pb-5 pt-1">
            <ICPDetailPanel order={order} />
          </td>
        </tr>
      )}
    </>
  )
}

function DeleteOrderButton({ order }: { order: FunnelOrder }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const ok = window.confirm(
      `Delete this test order for ${order.customer_email}?\n\nThis removes the order, its pixel, and any auto-provisioned workspace. Real workspaces are not affected. This cannot be undone.`
    )
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/funnel-orders/${order.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error || `Failed (HTTP ${res.status})`)
      }
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete order.')
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      title="Delete order"
      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
    </button>
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

// ─── Sync a Studio-built audience straight into the buyer's dashboard ─────

function SyncAudienceInline({ orderId }: { orderId: string }) {
  const [audienceId, setAudienceId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSync() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/funnel-orders/${orderId}/sync-audience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience_id: audienceId.trim() }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || `Failed (HTTP ${res.status})`)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        Sync started. Verified leads will land in the buyer&apos;s dashboard shortly.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="mb-1 text-sm font-semibold text-gray-900">
        Sync the built audience to their dashboard
      </p>
      <p className="mb-3 text-xs text-gray-600">
        Paste the AudienceLab audience ID you built in the copilot. We validate it,
        pull verified leads (auto-enriched), and sync them to the buyer&apos;s dashboard
        plus the weekly refresh. No Google Sheet needed.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={audienceId}
          onChange={(e) => setAudienceId(e.target.value)}
          placeholder="audience ID (UUID from the builder)"
          disabled={submitting}
          className="w-80 rounded-md border border-gray-300 px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={handleSync}
          disabled={submitting || audienceId.trim().length < 8}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Syncing…' : 'Sync to dashboard'}
        </button>
      </div>
      {error && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-600">
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

      {/* Sync the built audience straight to the buyer's dashboard (no Sheet). */}
      <SyncAudienceInline orderId={order.id} />

      {/* Workspace ID for reference (the buyer's dashboard target). */}
      {order.workspace_id && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Workspace ID
          </span>
          <div className="flex items-center gap-2">
            <code className="text-[11px] text-gray-700">{order.workspace_id}</code>
            <CopyButton value={order.workspace_id} label="Copy" confirmedLabel="Copied" />
          </div>
        </div>
      )}

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
        copilot returns verified segments → copy the audience ID →
        paste it into <span className="font-medium">Sync to dashboard</span> above.
        Leads land in the buyer&apos;s dashboard automatically (verified +
        enriched), and the audience is registered for the weekly refresh. (The
        &quot;Mark delivered&quot; + Sheet path on the right remains as a fallback.)
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

function PixelVersionBadge({ installUrl }: { installUrl: string }) {
  if (isPixelV4(installUrl)) {
    return (
      <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        V4
      </span>
    )
  }
  if (isPixelV3(installUrl)) {
    return (
      <span
        className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700"
        title="Pixel was provisioned as V3 — AL may have regressed our account. Check Slack for the critical alert."
      >
        V3 (regression!)
      </span>
    )
  }
  return (
    <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
      pixel
    </span>
  )
}
