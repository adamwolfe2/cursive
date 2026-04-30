'use client'

// Create-workspace modal for the onboarding EB workspace picker.
//
// This creates a NEW EmailBison child workspace via the super-admin API.
// Sender accounts are NOT assigned here — connect them in EmailBison's UI
// after workspace creation, then come back and push.

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  defaultName?: string
  onCreated: (workspace: { id: number; name: string }) => void
}

export default function CreateWorkspaceModal({ open, onClose, defaultName, onCreated }: Props) {
  const [name, setName] = useState(defaultName ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(defaultName ?? '')
      setError(null)
    }
  }, [open, defaultName])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) {
      setError('Workspace name must be at least 2 characters')
      return
    }
    if (trimmed.length > 100) {
      setError('Workspace name must be at most 100 characters')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/emailbison/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = (await res.json()) as {
        workspace?: { id: number; name: string }
        error?: string
      }
      if (!res.ok || !json.workspace) {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new EmailBison workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Workspace name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cursive Outbound"
              maxLength={100}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              A short label to identify this workspace in the picker.
            </p>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              After creating, go to{' '}
              <span className="font-medium">EmailBison&apos;s UI</span> to connect sender accounts
              to this workspace before approving copy. The push will attach all connected senders
              from the selected workspace automatically.
            </p>
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
              disabled={!name.trim() || name.trim().length < 2}
            >
              Create workspace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
