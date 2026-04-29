'use client'

// Inline create-workspace flow for the onboarding picker. Admin has
// already set up the EmailBison sub-account/senders in EB's UI; this
// modal lets them name a Cursive workspace and tick which EB senders
// belong to it. On submit, we create the workspaces row + email_accounts
// rows so subsequent campaign pushes attach only those senders.

import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw, AlertTriangle } from 'lucide-react'

interface Sender {
  id: string
  email: string
  warmup_enabled: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  defaultName?: string
  onCreated: (workspace: { id: string; name: string; slug: string }) => void
}

export default function CreateWorkspaceModal({ open, onClose, defaultName, onCreated }: Props) {
  const [name, setName] = useState(defaultName ?? '')
  const [senders, setSenders] = useState<Sender[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadingSenders, setLoadingSenders] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSenders = useCallback(async () => {
    setLoadingSenders(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/emailbison/senders', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load senders (HTTP ${res.status})`)
      const json = (await res.json()) as { senders?: Sender[] }
      setSenders(json.senders ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load senders')
    } finally {
      setLoadingSenders(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setName(defaultName ?? '')
      setSelected(new Set())
      setError(null)
      loadSenders()
    }
  }, [open, defaultName, loadSenders])

  function toggleSender(email: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(email)) {
        next.delete(email)
      } else {
        next.add(email)
      }
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(senders.map((s) => s.email.toLowerCase())))
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Workspace name is required')
      return
    }
    if (selected.size === 0) {
      setError('Pick at least one sender to attach')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/workspaces/create-with-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sender_emails: Array.from(selected),
        }),
      })
      const json = (await res.json()) as {
        success?: boolean
        workspace?: { id: string; name: string; slug: string }
        error?: string
      }
      if (!res.ok || !json.success || !json.workspace) {
        throw new Error(json.error ?? `Create failed (HTTP ${res.status})`)
      }
      onCreated(json.workspace)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a Cursive workspace for this client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Workspace name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cursor Outbound"
              maxLength={100}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              A short label so you can find this workspace in the picker later.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                EmailBison senders to attach
              </label>
              <div className="flex items-center gap-2">
                {senders.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[11px] font-medium text-blue-700 hover:underline"
                  >
                    Select all
                  </button>
                )}
                <button
                  type="button"
                  onClick={loadSenders}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingSenders ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {loadingSenders ? (
              <p className="text-xs text-muted-foreground">Loading senders from EmailBison&hellip;</p>
            ) : senders.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900">
                  <p className="font-medium">No connected senders found in EmailBison.</p>
                  <p className="mt-1">
                    Set up the senders in the EmailBison UI first, then click Refresh.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border max-h-64 overflow-y-auto divide-y divide-border/60">
                {senders.map((s) => {
                  const key = s.email.toLowerCase()
                  const checked = selected.has(key)
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSender(key)}
                        className="h-4 w-4 rounded border-border accent-blue-600"
                      />
                      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground flex-1 truncate">{s.email}</span>
                      {s.warmup_enabled && (
                        <span className="text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                          warmup
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
            {senders.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {selected.size} of {senders.length} selected
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!name.trim() || selected.size === 0}
            >
              Create workspace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
