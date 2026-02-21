'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { SlackIntegration } from '@/components/integrations/slack-integration'
import { ZapierIntegration } from '@/components/integrations/zapier-integration'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Integration logo configuration - using uploaded files from public folder
const INTEGRATION_LOGOS: Record<string, { src: string; alt: string }> = {
  slack: { src: '/Slack_icon_2019.svg.png', alt: 'Slack' },
  zapier: { src: '/zapier-logo-png-transparent.png', alt: 'Zapier' },
  salesforce: { src: '/Salesforce.com_logo.svg.png', alt: 'Salesforce' },
  hubspot: { src: '/free-hubspot-logo-icon-svg-download-png-2944939.webp', alt: 'HubSpot' },
  pipedrive: { src: '/Pipedrive_Monogram_Green background.png', alt: 'Pipedrive' },
  'google-sheets': { src: '/Google_Sheets_Logo_512px.png', alt: 'Google Sheets' },
  'microsoft-teams': { src: '/Microsoft_Teams.png', alt: 'Microsoft Teams' },
  discord: { src: '/concours-discord-cartes-voeux-fortnite-france-6.png', alt: 'Discord' },
}

// Fallback icon component when logo is not available
function FallbackIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    salesforce: 'bg-blue-500',
    hubspot: 'bg-orange-500',
    pipedrive: 'bg-green-600',
    'google-sheets': 'bg-green-500',
    'microsoft-teams': 'bg-indigo-500',
    discord: 'bg-indigo-600',
  }

  const labels: Record<string, string> = {
    salesforce: 'SF',
    hubspot: 'HS',
    pipedrive: 'PD',
    'google-sheets': 'GS',
    'microsoft-teams': 'MT',
    discord: 'DC',
  }

  return (
    <div className={`w-10 h-10 rounded-lg ${icons[name] || 'bg-zinc-400'} flex items-center justify-center text-white text-xs font-bold`}>
      {labels[name] || name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// Integration logo component with fallback
function IntegrationLogo({ name }: { name: string }) {
  const [hasError, setHasError] = useState(false)
  const logo = INTEGRATION_LOGOS[name]

  if (!logo || hasError) {
    return <FallbackIcon name={name} />
  }

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={40}
      height={40}
      className="object-contain"
      onError={() => setHasError(true)}
    />
  )
}

// Integration Card Component
function IntegrationCard({ integration, toast }: { integration: { name: string; key: string; description: string; premium: boolean }; toast: ReturnType<typeof useToast> }) {
  const [requesting, setRequesting] = useState(false)

  const handleRequestIntegration = async () => {
    setRequesting(true)
    try {
      const response = await fetch('/api/features/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_type: 'custom_integration',
          request_title: `${integration.name} Integration Request`,
          request_description: `Please set up ${integration.name} integration to sync leads automatically.`,
          request_data: {
            integration_name: integration.name,
            integration_key: integration.key,
          },
          priority: 'normal',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit request')
      }

      toast.success(`${integration.name} integration requested! Our team will contact you shortly.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <IntegrationLogo name={integration.key} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">{integration.name}</h3>
            {integration.premium && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                Coming Soon
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{integration.description}</p>
        </div>
      </div>
      <div className="mt-4">
        {integration.premium ? (
          <button
            onClick={handleRequestIntegration}
            disabled={requesting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requesting ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Requesting...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Request Integration
              </>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Coming Soon - Free
          </span>
        )}
      </div>
    </div>
  )
}

// Webhook event types supported by the platform
const WEBHOOK_EVENTS = [
  { key: 'lead.created', label: 'Lead Created', description: 'When a new lead is identified' },
  { key: 'lead.updated', label: 'Lead Updated', description: 'When lead data changes' },
  { key: 'lead.exported', label: 'Lead Exported', description: 'When a lead is exported to a CRM' },
  { key: 'lead.scored', label: 'Lead Scored', description: 'When intent score changes' },
] as const

// Webhook settings response type
interface WebhookSettings {
  webhook_url: string | null
  webhook_secret: string | null
  webhook_enabled: boolean
  webhook_events: string[]
}

function ExportButton({ format, label }: { format: 'csv' | 'xlsx'; label: string }) {
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/crm/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(err.error || 'Export failed')
      }
      // Download the file
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `crm-leads-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx.json'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${label} exported successfully!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <>
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export {label}
        </>
      )}
    </button>
  )
}

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

function WebhookSubscriptions() {
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
        const err = await res.json()
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
        const err = await res.json()
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
        const err = await res.json()
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

// ---------------------------------------------------------------------------

export default function IntegrationsClient() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [customWebhookUrl, setCustomWebhookUrl] = useState('')
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['lead.created'])
  const [showSecret, setShowSecret] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [webhookSettingsLoaded, setWebhookSettingsLoaded] = useState(false)
  const [confirmRegenerateSecret, setConfirmRegenerateSecret] = useState(false)
  const [confirmRegenerateApiKey, setConfirmRegenerateApiKey] = useState(false)

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  // Generate API key mutation
  const generateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/api-key', {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate API key')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('API key generated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate API key')
    },
  })

  // Fetch webhook settings
  const { data: webhookData } = useQuery<WebhookSettings>({
    queryKey: ['webhook', 'settings'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/webhook')
      if (!response.ok) throw new Error('Failed to fetch webhook settings')
      return response.json()
    },
    enabled: !!user,
  })

  // Sync webhook settings into local state when data loads
  useEffect(() => {
    if (webhookData && !webhookSettingsLoaded) {
      setCustomWebhookUrl(webhookData.webhook_url || '')
      setWebhookEnabled(webhookData.webhook_enabled)
      setWebhookEvents(webhookData.webhook_events || ['lead.created'])
      setWebhookSettingsLoaded(true)
    }
  }, [webhookData, webhookSettingsLoaded])

  // Update webhook settings mutation (POST)
  const updateWebhookMutation = useMutation({
    mutationFn: async (payload: {
      webhook_url?: string | null
      webhook_enabled?: boolean
      webhook_events?: string[]
    }) => {
      const response = await fetch('/api/integrations/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update webhook settings')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhook', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      // If a new secret was generated, reveal it
      if (data.webhook_secret && data.webhook_secret !== '••••••••') {
        setRevealedSecret(data.webhook_secret)
        setShowSecret(true)
      }
      toast.success('Webhook settings saved successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update webhook settings')
    },
  })

  // Test webhook mutation (PUT)
  const testWebhookMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/integrations/webhook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to test webhook')
      }
      return response.json()
    },
    onSuccess: (data) => {
      setTestResult({ success: data.success, message: data.message })
    },
    onError: (error: Error) => {
      setTestResult({ success: false, message: error.message || 'Failed to test webhook' })
    },
  })

  // Regenerate webhook secret mutation (DELETE)
  const regenerateSecretMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/webhook', {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate secret')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhook', 'settings'] })
      if (data.webhook_secret) {
        setRevealedSecret(data.webhook_secret)
        setShowSecret(true)
      }
      toast.success('Webhook secret regenerated. Save it now!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to regenerate secret')
    },
  })

  const handleSaveWebhookSettings = () => {
    if (customWebhookUrl) {
      try {
        new URL(customWebhookUrl)
      } catch {
        toast.error('Please enter a valid URL')
        return
      }
    }

    updateWebhookMutation.mutate({
      webhook_url: customWebhookUrl || null,
      webhook_enabled: webhookEnabled,
      webhook_events: webhookEvents,
    })
  }

  const handleTestWebhook = () => {
    const url = customWebhookUrl || webhookData?.webhook_url
    if (!url) {
      toast.error('Please enter a webhook URL first')
      return
    }
    try {
      new URL(url)
      setTestResult(null)
      testWebhookMutation.mutate(url)
    } catch {
      toast.error('Please enter a valid URL')
    }
  }

  const handleRegenerateSecret = () => {
    setConfirmRegenerateSecret(true)
  }

  const handleToggleEvent = (eventKey: string) => {
    setWebhookEvents((prev) =>
      prev.includes(eventKey)
        ? prev.filter((e) => e !== eventKey)
        : [...prev, eventKey]
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-96 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  const isPro = user?.plan === 'pro'

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">
              Multi-Channel Lead Delivery
            </h3>
            <p className="mt-2 text-sm text-primary/90">
              Connect Slack, Zapier, or custom webhooks to receive leads in real-time
              across multiple channels. Pro plan required for integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications & Automation */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Notifications & Automation</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <SlackIntegration user={user} isPro={isPro} />
          <ZapierIntegration user={user} isPro={isPro} />
        </div>
      </div>

      {/* Custom Webhooks */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900">Custom Webhooks</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Send lead data to any endpoint via HTTP POST. Perfect for custom
              integrations and internal tools.
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {!isPro && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
                Pro
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Webhook Delivery
              </label>
              <p className="text-xs text-zinc-500 mt-0.5">
                {webhookEnabled ? 'Webhooks are active and delivering events' : 'Webhooks are paused'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={webhookEnabled}
              disabled={!isPro}
              onClick={() => setWebhookEnabled(!webhookEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                webhookEnabled ? 'bg-primary' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  webhookEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-domain.com/webhook"
              className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-zinc-50 disabled:cursor-not-allowed"
              value={customWebhookUrl}
              onChange={(e) => setCustomWebhookUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isPro) { e.preventDefault(); handleSaveWebhookSettings() } }}
              disabled={!isPro}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Receives POST requests with JSON lead data, signed with your HMAC secret
            </p>
          </div>

          {/* Webhook Secret */}
          {isPro && (webhookData?.webhook_secret || revealedSecret) && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Signing Secret
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type={showSecret && revealedSecret ? 'text' : 'password'}
                    value={revealedSecret || webhookData?.webhook_secret || ''}
                    readOnly
                    className="block w-full rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm font-mono pr-16"
                  />
                  {revealedSecret && (
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-zinc-500 hover:text-zinc-700 font-medium"
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (revealedSecret) {
                      navigator.clipboard.writeText(revealedSecret)
                      toast.success('Secret copied to clipboard!')
                    } else {
                      toast.error('Secret is masked. Regenerate to see the full value.')
                    }
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={handleRegenerateSecret}
                  disabled={regenerateSecretMutation.isPending}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {regenerateSecretMutation.isPending ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Used to verify webhook signatures. Sent in the <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">X-Cursive-Signature</code> header.
              </p>
              {revealedSecret && (
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                  <p className="text-xs text-amber-800 font-medium">
                    Save this secret now. It will be masked once you leave this page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Webhook Events
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              Select which events trigger webhook delivery.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((event) => {
                const isChecked = webhookEvents.includes(event.key)
                return (
                  <label
                    key={event.key}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    } ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleEvent(event.key)}
                      disabled={!isPro}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-zinc-900">
                        {event.label}
                      </span>
                      <span className="block text-xs text-zinc-500 mt-0.5">
                        {event.description}
                      </span>
                      <code className="text-xs text-zinc-400 font-mono mt-1 block">
                        {event.key}
                      </code>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSaveWebhookSettings}
              disabled={!isPro || updateWebhookMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {updateWebhookMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>

            <button
              onClick={handleTestWebhook}
              disabled={!isPro || testWebhookMutation.isPending || !customWebhookUrl}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testWebhookMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Testing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Send Test
                </span>
              )}
            </button>
          </div>

          {/* Test Result Feedback */}
          {testResult && (
            <div
              className={`rounded-lg border p-3 ${
                testResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {!isPro && (
            <p className="text-sm text-zinc-500">
              <Link
                href="/settings/billing"
                className="text-primary hover:text-primary/90 font-medium"
              >
                Upgrade to Pro
              </Link>{' '}
              to use custom webhooks
            </p>
          )}
        </div>

        {/* Webhook Payload Example */}
        {(customWebhookUrl || webhookData?.webhook_url) && isPro && (
          <div className="mt-6 pt-6 border-t border-zinc-200">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">Example Payload</h3>
            <pre className="text-xs bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(
                {
                  event: 'lead.created',
                  lead_id: 'uuid',
                  company: {
                    name: 'Acme Corp',
                    domain: 'acme.com',
                    industry: 'Technology',
                    employee_count: 250,
                  },
                  contact: {
                    name: 'John Smith',
                    email: 'john@acme.com',
                    title: 'VP of Engineering',
                  },
                  intent_score: 'hot',
                  query_id: 'uuid',
                  created_at: '2026-01-23T10:00:00Z',
                },
                null,
                2
              )}
            </pre>
            <div className="mt-3 rounded-lg bg-zinc-50 border border-zinc-200 p-3">
              <h4 className="text-xs font-semibold text-zinc-700 mb-1">Signature Verification</h4>
              <p className="text-xs text-zinc-500">
                Each request includes an <code className="bg-zinc-100 px-1 py-0.5 rounded">X-Cursive-Signature</code> header
                in the format <code className="bg-zinc-100 px-1 py-0.5 rounded">t=timestamp,v1=signature</code>.
                Compute <code className="bg-zinc-100 px-1 py-0.5 rounded">HMAC-SHA256(secret, &quot;timestamp.body&quot;)</code> and
                compare with the <code className="bg-zinc-100 px-1 py-0.5 rounded">v1</code> value to verify authenticity.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Subscriptions (multi-endpoint outbound webhooks) */}
      <WebhookSubscriptions />

      {/* API Keys */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900">API Keys</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Generate API keys to access Cursive programmatically via our REST API.
            </p>
          </div>
          {!isPro && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary ml-4">
              Pro
            </span>
          )}
        </div>

        {user?.api_key && isPro ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Your API Key
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={user.api_key}
                  readOnly
                  className="block flex-1 rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.api_key)
                    toast.success('API key copied to clipboard!')
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => setConfirmRegenerateApiKey(true)}
              disabled={generateApiKeyMutation.isPending}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {generateApiKeyMutation.isPending ? 'Regenerating...' : 'Regenerate API Key'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => generateApiKeyMutation.mutate()}
              disabled={!isPro || generateApiKeyMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {generateApiKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}
            </button>

            {!isPro && (
              <p className="text-sm text-zinc-500 mt-3">
                <Link
                  href="/settings/billing"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  Upgrade to Pro
                </Link>{' '}
                to generate API keys
              </p>
            )}
          </div>
        )}

        {user?.api_key && isPro && (
          <div className="mt-6 pt-6 border-t border-zinc-200">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">Example Usage</h3>
            <pre className="text-xs bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
              {`curl -X GET "https://api.meetcursive.com/v1/leads" \\
  -H "Authorization: Bearer ${user.api_key}" \\
  -H "Content-Type: application/json"`}
            </pre>
            <p className="text-sm text-zinc-500 mt-3">
              Need help? Contact <a
                href="mailto:hello@meetcursive.com"
                className="text-primary hover:text-primary/90 font-medium"
              >
                hello@meetcursive.com
              </a> for integration assistance.
            </p>
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900">Lead Export</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Export your CRM leads to CSV, XLSX, or sync them to your favorite tools.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* CSV Export */}
          <div className="rounded-xl border border-zinc-200 p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900">CSV Export</h3>
                <p className="mt-1 text-xs text-zinc-500">Download all leads as a CSV file</p>
              </div>
            </div>
            <div className="mt-4">
              <ExportButton format="csv" label="CSV" />
            </div>
          </div>

          {/* XLSX Export */}
          <div className="rounded-xl border border-zinc-200 p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900">Excel Export</h3>
                <p className="mt-1 text-xs text-zinc-500">Download all leads as an XLSX spreadsheet</p>
              </div>
            </div>
            <div className="mt-4">
              <ExportButton format="xlsx" label="XLSX" />
            </div>
          </div>

          {/* Google Sheets */}
          <div className="rounded-xl border border-zinc-200 p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <IntegrationLogo name="google-sheets" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900">Google Sheets</h3>
                <p className="mt-1 text-xs text-zinc-500">Sync leads to a Google Sheets spreadsheet</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                Coming Soon - Free
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium CRM Integrations */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">Premium CRM Integrations</h3>
            <p className="text-sm text-zinc-600">
              Connect your favorite CRM and sync leads automatically. Our team will set up bi-directional sync, custom field mapping, and automation workflows tailored to your needs.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">CRM & Other Integrations</h2>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            Coming Soon
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: 'Salesforce',
              key: 'salesforce',
              description: 'Sync leads directly to your Salesforce CRM',
              premium: true,
            },
            {
              name: 'HubSpot',
              key: 'hubspot',
              description: 'Push leads into HubSpot contacts and deals',
              premium: true,
            },
            {
              name: 'Google Sheets',
              key: 'google-sheets',
              description: 'Export leads automatically to Google Sheets',
              premium: false,
            },
            {
              name: 'Pipedrive',
              key: 'pipedrive',
              description: 'Create deals in Pipedrive automatically',
              premium: true,
            },
            {
              name: 'Microsoft Teams',
              key: 'microsoft-teams',
              description: 'Receive lead notifications in Teams',
              premium: true,
            },
            {
              name: 'Discord',
              key: 'discord',
              description: 'Get lead alerts in Discord channels',
              premium: false,
            },
          ].map((integration) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              toast={toast}
            />
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/90 p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Unlock All Integrations</h2>
              <p className="text-white/80">
                Upgrade to Pro to connect Slack, Zapier, custom webhooks, and access our API.
                CRM integrations coming soon. Automate your entire lead workflow.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/settings/billing"
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors shadow-md"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </div>
        </div>
      )}


      {/* Regenerate Webhook Secret Confirmation Dialog */}
      <Dialog open={confirmRegenerateSecret} onOpenChange={setConfirmRegenerateSecret}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Webhook Secret</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate your webhook secret? The old secret will
              stop working immediately. You must update your webhook consumer with the new secret.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRegenerateSecret(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                regenerateSecretMutation.mutate()
                setConfirmRegenerateSecret(false)
              }}
              disabled={regenerateSecretMutation.isPending}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate API Key Confirmation Dialog */}
      <Dialog open={confirmRegenerateApiKey} onOpenChange={setConfirmRegenerateApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to regenerate your API key? The old key will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRegenerateApiKey(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                generateApiKeyMutation.mutate()
                setConfirmRegenerateApiKey(false)
              }}
              disabled={generateApiKeyMutation.isPending}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
