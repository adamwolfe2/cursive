'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, PowerOff, SlidersHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ResellerControlsProps {
  reseller: {
    id: string
    name: string
    status: 'active' | 'suspended'
    lead_cap_per_period: number | null
    default_lead_cap_per_period: number | null
    default_throttle_mode: boolean
  }
}

/**
 * Platform-admin controls for one reseller: the kill switch (suspend/reactivate)
 * plus the account-level cap editor. PATCHes /api/reseller/admin/resellers/{id}.
 *
 * Suspending a reseller is the ONLY action that halts outbound PII delivery to a
 * churned/rogue partner (key revocation alone does not), so suspend is confirmed.
 */
export default function ResellerControls({ reseller }: ResellerControlsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cap, setCap] = useState<string>(
    reseller.lead_cap_per_period == null ? '' : String(reseller.lead_cap_per_period),
  )
  const [defaultCap, setDefaultCap] = useState<string>(
    reseller.default_lead_cap_per_period == null ? '' : String(reseller.default_lead_cap_per_period),
  )
  const [defaultThrottle, setDefaultThrottle] = useState<boolean>(reseller.default_throttle_mode)

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/reseller/admin/resellers/${reseller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Request failed (${res.status})`)
      }
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  function toggleStatus() {
    if (reseller.status === 'active') {
      const ok = window.confirm(
        `Suspend "${reseller.name}"? This immediately STOPS all outbound lead/PII delivery to this partner. Existing API keys keep working for read access, but no leads are delivered until you reactivate.`,
      )
      if (!ok) return
      void patch({ status: 'suspended' })
    } else {
      void patch({ status: 'active' })
    }
  }

  const parseCap = (v: string): number | null => (v.trim() === '' ? null : Math.max(0, parseInt(v, 10) || 0))

  const saveCaps = () =>
    patch({
      lead_cap_per_period: parseCap(cap),
      default_lead_cap_per_period: parseCap(defaultCap),
      default_throttle_mode: defaultThrottle,
    })

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">Account status</span>
          <Badge variant={reseller.status === 'active' ? 'success' : 'destructive'} size="sm" dot>
            {reseller.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={reseller.status === 'active' ? 'destructive' : 'success'}
            size="xs"
            onClick={toggleStatus}
            disabled={busy}
            title={reseller.status === 'active' ? 'Suspend reseller (stops PII delivery)' : 'Reactivate reseller'}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : reseller.status === 'active' ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            <span className="ml-1">{reseller.status === 'active' ? 'Suspend' : 'Reactivate'}</span>
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setEditing((v) => !v)} disabled={busy} title="Edit caps">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="ml-1">Edit caps</span>
          </Button>
        </div>
      </div>

      {reseller.status !== 'active' && (
        <p className="mt-2 text-[11px] text-destructive">
          Suspended — no outbound lead/PII delivery to this partner until reactivated.
        </p>
      )}

      {editing && (
        <div className="mt-4 grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500">Reseller cap / period (blank = ∞)</label>
            <input
              type="number"
              min={0}
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
              placeholder="unlimited"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500">Default pixel cap (blank = ∞)</label>
            <input
              type="number"
              min={0}
              value={defaultCap}
              onChange={(e) => setDefaultCap(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
              placeholder="unlimited"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={defaultThrottle}
                onChange={(e) => setDefaultThrottle(e.target.checked)}
              />
              Default throttle (reduced payload)
            </label>
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <Button variant="ghost" size="xs" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="xs" onClick={saveCaps} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save caps'}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
    </div>
  )
}
