'use client'

/**
 * Webhooks Settings Page
 * Allows workspace owners/admins to manage outbound webhook endpoints
 * for real-time event delivery to external systems.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookDelivery {
  id: string
  status: string
  response_status: number | null
  created_at: string
}

interface WebhookEndpoint {
  id: string
  name: string | null
  url: string
  events: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  recent_deliveries: WebhookDelivery[]
}

interface CreateForm {
  name: string
  url: string
  events: string[]
}

interface EditForm {
  name: string
  url: string
  events: string[]
  is_active: boolean
}

const ALLOWED_EVENTS = [
  { key: 'lead.received', label: 'Lead Received', description: 'Fired when a new lead is delivered to your workspace' },
  { key: 'lead.enriched', label: 'Lead Enriched', description: 'Fired when enrichment data is added to a lead' },
  { key: 'lead.purchased', label: 'Lead Purchased', description: 'Fired when you purchase a lead from the marketplace' },
  { key: 'credit.purchased', label: 'Credits Purchased', description: 'Fired when your workspace purchases credits' },
] as const

const DEFAULT_CREATE_FORM: CreateForm = { name: '', url: '', events: ['lead.received'] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deliveryStatusIcon(delivery: WebhookDelivery) {
  const ok = delivery.status === 'success' || (delivery.response_status != null && delivery.response_status < 300)
  return ok
    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
    : <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
}

function overallHealth(webhook: WebhookEndpoint): 'healthy' | 'degraded' | 'failing' | 'unknown' {
  const deliveries = webhook.recent_deliveries
  if (!deliveries.length) return 'unknown'
  const failures = deliveries.filter(
    (d) => d.status !== 'success' && (d.response_status == null || d.response_status >= 300)
  ).length
  const rate = failures / deliveries.length
  if (rate === 0) return 'healthy'
  if (rate < 0.5) return 'degraded'
  return 'failing'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editWebhook, setEditWebhook] = useState<WebhookEndpoint | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(DEFAULT_CREATE_FORM)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', url: '', events: [], is_active: true })

  // ── Fetch ──
  const { data, isLoading } = useQuery({
    queryKey: ['workspace', 'webhooks'],
    queryFn: async () => {
      const res = await fetch('/api/webhooks/outbound')
      if (!res.ok) throw new Error('Failed to fetch webhooks')
      return res.json() as Promise<{ data: WebhookEndpoint[] }>
    },
  })

  const webhooks = data?.data ?? []

  // ── Create ──
  const createMutation = useMutation({
    mutationFn: async (form: CreateForm) => {
      const res = await fetch('/api/webhooks/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name || undefined, url: form.url, events: form.events }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create webhook')
      }
      return res.json()
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'webhooks'] })
      setNewSecret(result.data.secret)
      setCreateForm(DEFAULT_CREATE_FORM)
      setShowCreateDialog(false)
      toast({ type: 'success', message: 'Webhook created. Save your signing secret — it won\'t be shown again.' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
  })

  // ── Update ──
  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: EditForm }) => {
      const res = await fetch(`/api/webhooks/outbound/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          url: form.url,
          events: form.events,
          is_active: form.is_active,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update webhook')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'webhooks'] })
      setEditWebhook(null)
      toast({ type: 'success', message: 'Webhook updated' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
  })

  // ── Toggle active ──
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/webhooks/outbound/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      })
      if (!res.ok) throw new Error('Failed to update webhook')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'webhooks'] })
    },
    onError: () => {
      toast({ type: 'error', message: 'Failed to update webhook status' })
    },
  })

  // ── Delete ──
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/webhooks/outbound/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete webhook')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'webhooks'] })
      setDeleteConfirmId(null)
      toast({ type: 'success', message: 'Webhook deleted' })
    },
    onError: () => {
      toast({ type: 'error', message: 'Failed to delete webhook' })
    },
  })

  // ── Helpers ──
  const handleCopySecret = async () => {
    if (!newSecret) return
    await navigator.clipboard.writeText(newSecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const toggleCreateEvent = (event: string) => {
    setCreateForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const toggleEditEvent = (event: string) => {
    setEditForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const openEdit = (webhook: WebhookEndpoint) => {
    setEditForm({
      name: webhook.name ?? '',
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
    })
    setEditWebhook(webhook)
  }

  const healthBadge = (webhook: WebhookEndpoint) => {
    if (!webhook.is_active) return <Badge variant="muted" className="text-xs">Paused</Badge>
    const h = overallHealth(webhook)
    if (h === 'healthy') return <Badge className="text-xs bg-green-100 text-green-700 border-0">Healthy</Badge>
    if (h === 'degraded') return <Badge className="text-xs bg-amber-100 text-amber-700 border-0">Degraded</Badge>
    if (h === 'failing') return <Badge className="text-xs bg-red-100 text-red-700 border-0">Failing</Badge>
    return <Badge variant="muted" className="text-xs">No data</Badge>
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Webhooks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Receive real-time HTTP notifications when events happen in your workspace.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* New secret banner */}
      {newSecret && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Save your webhook signing secret — it won&apos;t be shown again
              </p>
              <p className="text-xs text-amber-700 mb-2">
                Use this secret to verify that incoming webhook requests are from Cursive. Compare it against the
                <code className="mx-1 bg-amber-100 px-1 rounded">X-Cursive-Signature</code>
                header on each delivery.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 min-w-0 rounded bg-white border border-amber-200 px-3 py-2 text-xs font-mono text-amber-900 overflow-x-auto">
                  {newSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  className="flex-shrink-0 border-amber-300 hover:bg-amber-100"
                >
                  {copiedSecret ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-amber-700" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewSecret(null)}
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 text-xs"
            >
              I&apos;ve saved it, dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Configured Endpoints
          </CardTitle>
          <CardDescription>
            Each endpoint receives HTTP POST requests for the events you subscribe to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="py-12 text-center">
              <Webhook className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No webhooks configured</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                Add an endpoint to start receiving real-time event notifications in your systems.
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add your first webhook
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name + status */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {webhook.name || 'Unnamed endpoint'}
                      </span>
                      {healthBadge(webhook)}
                    </div>
                    {/* URL */}
                    <code className="text-xs text-muted-foreground font-mono break-all">
                      {webhook.url}
                    </code>
                    {/* Events */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {webhook.events.map((e) => (
                        <Badge key={e} variant="muted" className="text-xs font-mono">
                          {e}
                        </Badge>
                      ))}
                    </div>
                    {/* Delivery history */}
                    {webhook.recent_deliveries.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Recent:</span>
                        <div className="flex items-center gap-1">
                          {webhook.recent_deliveries.slice(0, 5).map((d) => (
                            <span key={d.id} title={`${d.status} — ${formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}`}>
                              {deliveryStatusIcon(d)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Created at */}
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Added {formatDistanceToNow(new Date(webhook.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: webhook.id, is_active: checked })
                      }
                      aria-label={webhook.is_active ? 'Pause webhook' : 'Resume webhook'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(webhook)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(webhook.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payload format info */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Payload format</h3>
          <p className="text-sm text-muted-foreground">
            Cursive sends a signed <code className="bg-muted px-1 rounded text-xs">POST</code> request with a JSON body to your endpoint:
          </p>
          <code className="block bg-muted rounded-lg p-3 text-xs font-mono text-foreground whitespace-pre">
{`{
  "event": "lead.received",
  "workspace_id": "ws_...",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": { ... }
}`}
          </code>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Signature verification</p>
            <p className="text-xs text-muted-foreground">
              Each request includes an <code className="bg-muted px-1 rounded">X-Cursive-Signature</code> header
              containing an HMAC-SHA256 digest of the raw body signed with your webhook secret.
              Always verify this signature before processing the payload.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Retries</p>
            <p className="text-xs text-muted-foreground">
              Failed deliveries (non-2xx responses or timeouts) are retried up to 3 times with exponential backoff.
              Your endpoint must respond within 10 seconds.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Create Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setCreateForm(DEFAULT_CREATE_FORM) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Enter the URL of your endpoint and select which events to subscribe to.
              Your signing secret will be shown once after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Name" description="Optional label to identify this endpoint">
              <Input
                placeholder="e.g. CRM sync, Zapier, Slack alerts"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>

            <FormField label="Endpoint URL" required>
              <Input
                type="url"
                placeholder="https://your-server.com/webhooks/cursive"
                value={createForm.url}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, url: e.target.value }))}
              />
            </FormField>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Events <span className="text-muted-foreground font-normal">(select at least one)</span>
              </label>
              <div className="space-y-2.5">
                {ALLOWED_EVENTS.map((event) => (
                  <label key={event.key} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                      checked={createForm.events.includes(event.key)}
                      onChange={() => toggleCreateEvent(event.key)}
                    />
                    <span className="text-sm">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mr-1.5">
                        {event.key}
                      </code>
                      <span className="text-muted-foreground">{event.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setCreateForm(DEFAULT_CREATE_FORM) }}>
              Cancel
            </Button>
            <Button
              disabled={!createForm.url.trim() || createForm.events.length === 0 || createMutation.isPending}
              onClick={() => createMutation.mutate(createForm)}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editWebhook} onOpenChange={(open) => !open && setEditWebhook(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>
              Update the endpoint URL, name, or event subscriptions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Name" description="Optional label to identify this endpoint">
              <Input
                placeholder="e.g. CRM sync, Zapier, Slack alerts"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>

            <FormField label="Endpoint URL" required>
              <Input
                type="url"
                placeholder="https://your-server.com/webhooks/cursive"
                value={editForm.url}
                onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
              />
            </FormField>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Events <span className="text-muted-foreground font-normal">(select at least one)</span>
              </label>
              <div className="space-y-2.5">
                {ALLOWED_EVENTS.map((event) => (
                  <label key={event.key} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                      checked={editForm.events.includes(event.key)}
                      onChange={() => toggleEditEvent(event.key)}
                    />
                    <span className="text-sm">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mr-1.5">
                        {event.key}
                      </code>
                      <span className="text-muted-foreground">{event.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Pause to stop receiving deliveries without deleting</p>
              </div>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWebhook(null)}>
              Cancel
            </Button>
            <Button
              disabled={!editForm.url.trim() || editForm.events.length === 0 || updateMutation.isPending}
              onClick={() => editWebhook && updateMutation.mutate({ id: editWebhook.id, form: editForm })}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Webhook?</DialogTitle>
            <DialogDescription>
              This will permanently remove the endpoint and stop all future deliveries. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
