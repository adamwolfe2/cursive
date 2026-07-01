'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Copy, Check, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface KeyRow {
  id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  last_used_at: string | null
  revoked: boolean
  created_at: string
}

export default function KeyManager({ resellerId, keys }: { resellerId: string; keys: KeyRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minted, setMinted] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [keyName, setKeyName] = useState('')

  async function mint() {
    setBusy(true)
    setError(null)
    setMinted(null)
    try {
      const res = await fetch('/api/reseller/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reseller_id: resellerId, ...(keyName.trim() ? { key_name: keyName.trim() } : {}) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error ?? `Request failed (${res.status})`)
      setMinted(j.api_key as string)
      setKeyName('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mint key')
    } finally {
      setBusy(false)
    }
  }

  async function revoke(keyId: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reseller/keys/${keyId}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Request failed (${res.status})`)
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke key')
    } finally {
      setBusy(false)
    }
  }

  function copyKey() {
    if (!minted) return
    navigator.clipboard?.writeText(minted).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-zinc-500">New key label (optional)</label>
          <input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
            placeholder="e.g. Partner production key"
          />
        </div>
        <Button size="sm" onClick={mint} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          <span className="ml-1.5">Mint key</span>
        </Button>
      </div>

      {minted && (
        <div className="mt-3 rounded-lg border border-warning/40 bg-warning-muted/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
            Copy now — shown once, never retrievable
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-zinc-800 ring-1 ring-zinc-200">
              {minted}
            </code>
            <Button variant="outline" size="xs" onClick={copyKey}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-4 space-y-1.5">
        {keys.length === 0 && <p className="text-sm text-zinc-500">No API keys yet.</p>}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <code className="text-xs text-zinc-800">{k.key_prefix}…</code>
                {k.name && <span className="truncate text-xs text-zinc-500">{k.name}</span>}
                {k.revoked ? (
                  <Badge variant="destructive" size="sm">
                    revoked
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    active
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {k.scopes?.length ? k.scopes.join(', ') : 'no scopes'} · last used{' '}
                {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'never'}
              </p>
            </div>
            {!k.revoked && (
              <Button variant="ghost" size="xs" onClick={() => revoke(k.id)} disabled={busy} title="Revoke key">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
