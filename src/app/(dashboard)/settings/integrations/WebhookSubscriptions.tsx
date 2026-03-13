'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Outbound Webhook Subscriptions — multi-endpoint system
// ---------------------------------------------------------------------------

const OUTBOUND_EVENTS = [
  { key: 'lead.received', label: 'Lead Received', description: 'New lead arrives in your workspace' },
  { key: 'lead.enriched', label: 'Lead Enriched', description: 'Lead data is enriched with additional info' },
  { key: 'lead.purchased', label: 'Lead Purchased', description: 'Lead purchased from the marketplace' },
  { key: 'credit.purchased', label: 'Credits Purchased', description: 'Credit package purchase completed' },
] as const

type OutboundEventKey = typeof OUTBOUND_EVENTS[number]['key']

interface OutboundWebhook {
  id: string
  name: string | null
  url: string
  events: OutboundEventKey[]
  is_active: boolean
  created_at: string
  updated_at: string
  recent_deliveries: Array<{
    id: string
    status: string
    response_status: number | null
    created_at: string
  }>
}

export function WebhookSubscriptions() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [newEvents, setNewEvents] = useState<OutboundEventKey[]>(['lead.received'])
  const [revealedSecret, setRevealedSecret] = useState<{ id: string; secret: string } | null>(null)
  const [confirmDeleteWebhookId, setConfirmDeleteWebhookId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ data: OutboundWebhook[] }>({
    queryKey: ['webhooks', 'outbound'],
    queryFn: async () => {
      const res = await fetch('/api/webhooks/outbound')
      if (!res.ok) throw new Error('Failed to fetch webhooks')
      return res.json()
    },
  })

  const webhooks = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/webhooks/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: newEvents, name: newName || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create webhook')
      }
      return res.json()
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'outbound'] })
      setShowModal(false)
      setNewUrl('')
      setNewName('')
      setNewEvents(['lead.received'])
      if (result.data?.secret) {
        setRevealedSecret({ id: result.data.id, secret: result.data.secret })
      }
      toast.success('Webhook created! Copy your signing secret below.')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/webhooks/outbound/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete webhook')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'outbound'] })
      toast.success('Webhook deleted.')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/webhooks/outbound/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update webhook')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'outbound'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleToggleEvent = (eventKey: OutboundEventKey) => {
    setNewEvents((prev) =>
      prev.includes(eventKey) ? prev.filter((e) => e !== eventKey) : [...prev, eventKey]
    )
  }

  const handleCreate = () => {
    try {
      new URL(newUrl)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }
    if (newEvents.length === 0) {
      toast.error('Select at least one event')
      return
    }
    createMutation.mutate()
  }

  const handleDelete = (id: string) => {
    setConfirmDeleteWebhookId(id)
  }

  const lastDeliveryStatus = (deliveries: OutboundWebhook['recent_deliveries']) => {
    if (!deliveries || deliveries.length === 0) return null
    const sorted = [...deliveries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return sorted[0]
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-zinc-900">Webhook Subscriptions</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Subscribe multiple endpoints to lead and credit events. Each webhook has its own signing secret.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="ml-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Webhook
        </button>
      </div>

      {/* Revealed secret banner */}
      {revealedSecret && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            Save your signing secret now — it will never be shown again.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-xs font-mono bg-white border border-amber-200 rounded px-3 py-2 break-all">
              {revealedSecret.secret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(revealedSecret.secret)
                toast.success('Secret copied!')
              }}
              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 whitespace-nowrap"
            >
              Copy
            </button>
            <button
              onClick={() => setRevealedSecret(null)}
              className="text-amber-600 hover:text-amber-800"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
          <svg className="mx-auto h-10 w-10 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm font-medium text-zinc-600">No webhook endpoints configured</p>
          <p className="text-xs text-zinc-500 mt-1">Click &quot;Add Webhook&quot; to subscribe an endpoint to lead events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => {
            const last = lastDeliveryStatus(wh.recent_deliveries)
            return (
              <div key={wh.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {wh.name && (
                        <span className="text-sm font-semibold text-zinc-900">{wh.name}</span>
                      )}
                      <code className="text-xs text-zinc-500 font-mono truncate max-w-xs">{wh.url}</code>
                      {/* Active/inactive badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          wh.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                        }`}
                      >
                        {wh.is_active ? 'Active' : 'Paused'}
                      </span>
                      {/* Last delivery status */}
                      {last && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            last.status === 'success'
                              ? 'bg-green-50 text-green-700'
                              : last.status === 'failed'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          Last: {last.status} {last.response_status ? `(${last.response_status})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(wh.events as string[]).map((ev) => (
                        <span
                          key={ev}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono bg-zinc-100 text-zinc-600"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle active */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wh.is_active}
                      onClick={() => toggleMutation.mutate({ id: wh.id, is_active: !wh.is_active })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        wh.is_active ? 'bg-primary' : 'bg-zinc-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          wh.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="rounded-lg border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Delete webhook"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-900">Add Webhook Endpoint</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Name <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production CRM"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Endpoint URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-app.com/webhooks/cursive"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                />
              </div>

              {/* Events */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Events to subscribe <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {OUTBOUND_EVENTS.map((ev) => {
                    const checked = newEvents.includes(ev.key)
                    return (
                      <label
                        key={ev.key}
                        className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                          checked ? 'border-primary/30 bg-primary/5' : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleEvent(ev.key)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="block text-xs font-medium text-zinc-900">{ev.label}</span>
                          <span className="block text-xs text-zinc-500">{ev.description}</span>
                          <code className="text-xs text-zinc-400 font-mono">{ev.key}</code>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Webhook Confirmation Dialog */}
      <Dialog
        open={confirmDeleteWebhookId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteWebhookId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Delete this webhook? Deliveries will stop immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteWebhookId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteWebhookId) {
                  deleteMutation.mutate(confirmDeleteWebhookId)
                  setConfirmDeleteWebhookId(null)
                }
              }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
