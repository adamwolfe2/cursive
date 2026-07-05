'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, PowerOff, SlidersHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PixelActionsProps {
  pixel: {
    id: string
    status: 'active' | 'inactive'
    lead_cap_per_period: number | null
    throttle_mode: boolean | null
    destination_url: string | null
  }
}

export default function PixelActions({ pixel }: PixelActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cap, setCap] = useState<string>(pixel.lead_cap_per_period == null ? '' : String(pixel.lead_cap_per_period))
  const [throttle, setThrottle] = useState<boolean>(pixel.throttle_mode ?? false)
  const [destination, setDestination] = useState<string>(pixel.destination_url ?? '')

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reseller/pixels/${pixel.id}`, {
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

  const toggle = () => patch({ status: pixel.status === 'active' ? 'inactive' : 'active' })

  const saveLimits = () =>
    patch({
      lead_cap_per_period: cap.trim() === '' ? null : Math.max(0, parseInt(cap, 10) || 0),
      throttle_mode: throttle,
      // Always send destination_url so a blanked field explicitly clears it
      // (null). Omitting the key would silently keep a stale/compromised endpoint.
      destination_url: destination.trim() ? destination.trim() : null,
    })

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <Button
          variant={pixel.status === 'active' ? 'outline' : 'success'}
          size="xs"
          onClick={toggle}
          disabled={busy}
          title={pixel.status === 'active' ? 'Deactivate pixel' : 'Activate pixel'}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : pixel.status === 'active' ? (
            <PowerOff className="h-3.5 w-3.5" />
          ) : (
            <Power className="h-3.5 w-3.5" />
          )}
          <span className="ml-1">{pixel.status === 'active' ? 'Deactivate' : 'Activate'}</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={() => setEditing((v) => !v)} disabled={busy} title="Edit limits">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="ml-1">Limits</span>
        </Button>
      </div>

      {editing && (
        <div className="mt-1 w-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <label className="block text-[11px] font-medium text-zinc-500">Cap / period (blank = inherit)</label>
          <Input
            type="number"
            min={0}
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            inputSize="sm"
            className="mt-1"
            placeholder="inherit reseller default"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={throttle} onChange={(e) => setThrottle(e.target.checked)} />
            Throttle (reduced payload)
          </label>
          <label className="mt-2 block text-[11px] font-medium text-zinc-500">Destination URL (https)</label>
          <Input
            type="url"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            inputSize="sm"
            className="mt-1"
            placeholder="https://partner.example.com/hooks/cursive"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="xs" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="xs" onClick={saveLimits} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}
