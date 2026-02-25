'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/lib/hooks/use-toast'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Loader2,
  FlaskConical,
  Clock,
  Code2,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useState } from 'react'

interface Delivery {
  id: string
  event_type: string
  status: string
  response_status: number | null
  response_body: string | null
  attempt_count: number
  delivered_at: string
  payload?: Record<string, unknown>
}

interface WebhookWithDeliveries {
  id: string
  name: string | null
  url: string
  events: string[]
  is_active: boolean
  recent_deliveries: Delivery[]
}

function DeliveryRow({ delivery }: { delivery: Delivery }) {
  const [expanded, setExpanded] = useState(false)
  const ok = delivery.status === 'success' || (delivery.response_status != null && delivery.response_status < 300)

  return (
    <div className="border-b border-border last:border-0">
      <div
        className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 px-1 rounded transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono text-foreground">{delivery.event_type}</code>
            {delivery.response_status != null && (
              <Badge
                className={`text-xs border-0 ${
                  delivery.response_status < 300
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {delivery.response_status}
              </Badge>
            )}
            {delivery.attempt_count > 1 && (
              <Badge variant="muted" className="text-xs">
                {delivery.attempt_count} attempts
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(delivery.delivered_at), { addSuffix: true })}
            {' · '}
            {format(new Date(delivery.delivered_at), 'MMM d, h:mm:ss a')}
          </p>
        </div>
        <Code2 className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="pb-3 px-1 space-y-2">
          {delivery.response_body && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Response body</p>
              <pre className="bg-zinc-950 text-zinc-200 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-32">
                {delivery.response_body}
              </pre>
            </div>
          )}
          {delivery.payload && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Payload sent</p>
              <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-48">
                {JSON.stringify(delivery.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WebhookDeliveriesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['webhook-deliveries', id],
    queryFn: async () => {
      const res = await fetch(`/api/webhooks/outbound/${id}/deliveries`)
      if (!res.ok) throw new Error('Failed to load deliveries')
      return res.json() as Promise<{ data: WebhookWithDeliveries }>
    },
    refetchInterval: 30_000,
    staleTime: 30_000,
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/webhooks/outbound/${id}/test`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Test delivery failed')
      }
      return res.json()
    },
    onSuccess: (result) => {
      refetch()
      if (result.success) {
        toast({ type: 'success', message: `Test delivered — got ${result.response_status} response` })
      } else {
        toast({ type: 'error', message: `Test failed — got ${result.response_status || 'no'} response: ${result.response_body?.slice(0, 80) ?? 'connection error'}` })
      }
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
  })

  const webhook = data?.data
  const deliveries = webhook?.recent_deliveries ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings/webhooks')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webhooks
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : webhook ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {webhook.name || 'Delivery Log'}
              </h2>
              <code className="text-sm text-muted-foreground font-mono break-all">
                {webhook.url}
              </code>
            </div>
            <Button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || !webhook.is_active}
              variant="outline"
              className="flex-shrink-0 gap-2"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              {testMutation.isPending ? 'Sending\u2026' : 'Send test'}
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Delivery History
                </CardTitle>
                <CardDescription>
                  {deliveries.length === 0
                    ? 'No deliveries yet'
                    : `${deliveries.length} delivery record${deliveries.length === 1 ? '' : 's'} \u00b7 click any row to expand`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1.5 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No deliveries yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send a test delivery or wait for a real event to arrive.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Send first test
                  </Button>
                </div>
              ) : (
                <div>
                  {deliveries.map((d) => (
                    <DeliveryRow key={d.id} delivery={d} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Webhook not found</p>
        </div>
      )}
    </div>
  )
}
