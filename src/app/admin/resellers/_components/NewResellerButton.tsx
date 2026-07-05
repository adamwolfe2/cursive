'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Copy, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function NewResellerButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minted, setMinted] = useState<{ api_key: string; reseller_id: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [name, setName] = useState('')
  const [periodKind, setPeriodKind] = useState<'month' | 'day'>('month')
  const [defaultCap, setDefaultCap] = useState('')
  const [defaultThrottle, setDefaultThrottle] = useState(false)

  async function create() {
    if (!name.trim()) {
      setError('Enter a reseller name')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reseller/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          period_kind: periodKind,
          default_lead_cap_per_period: defaultCap.trim() === '' ? null : Math.max(0, parseInt(defaultCap, 10) || 0),
          default_throttle_mode: defaultThrottle,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`)
      setMinted({ api_key: j.api_key as string, reseller_id: j.reseller_id as string })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create reseller')
    } finally {
      setBusy(false)
    }
  }

  function close() {
    setOpen(false)
    setMinted(null)
    setError(null)
    setName('')
    setDefaultCap('')
    setDefaultThrottle(false)
    setPeriodKind('month')
  }

  function copyKey() {
    if (!minted) return
    navigator.clipboard?.writeText(minted.api_key).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        <span className="ml-1">New reseller</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={close}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">New reseller</h3>
              <Button variant="ghost" size="icon-xs" onClick={close} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!minted ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Partner"
                    inputSize="sm"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-zinc-500">Period</label>
                    <Select
                      value={periodKind}
                      onChange={(e) => setPeriodKind(e.target.value as 'month' | 'day')}
                      selectSize="sm"
                      className="mt-1"
                      options={[
                        { value: 'month', label: 'Monthly' },
                        { value: 'day', label: 'Daily' },
                      ]}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-zinc-500">Default pixel cap</label>
                    <Input
                      type="number"
                      min={0}
                      value={defaultCap}
                      onChange={(e) => setDefaultCap(e.target.value)}
                      placeholder="unlimited"
                      inputSize="sm"
                      className="mt-1"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" checked={defaultThrottle} onChange={(e) => setDefaultThrottle(e.target.checked)} />
                  Throttle deliveries by default (reduced payload)
                </label>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={create} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create + mint key'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="rounded-lg border border-warning/40 bg-warning-muted/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
                    Copy now — shown once, never retrievable
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-zinc-800 ring-1 ring-zinc-200">
                      {minted.api_key}
                    </code>
                    <Button variant="outline" size="xs" onClick={copyKey}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={close}>
                    Done
                  </Button>
                  <Button size="sm" onClick={() => router.push(`/admin/resellers/${minted.reseller_id}`)}>
                    Open reseller
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
