'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

interface SyncStatus {
  integration: string
  display_name: string
  logo_src: string
  is_connected: boolean
  last_synced_at: string | null
  records_synced_today: number
  error_count_24h: number
  last_error: string | null
  sync_status: 'healthy' | 'degraded' | 'failing' | 'idle' | 'disconnected'
}

function SyncStatusBadge({ status }: { status: SyncStatus['sync_status'] }) {
  const configs = {
    healthy: { label: 'Healthy', cls: 'bg-green-100 text-green-700' },
    degraded: { label: 'Degraded', cls: 'bg-amber-100 text-amber-700' },
    failing: { label: 'Failing', cls: 'bg-red-100 text-red-700' },
    idle: { label: 'Idle', cls: 'bg-zinc-100 text-zinc-600' },
    disconnected: { label: 'Disconnected', cls: 'bg-zinc-100 text-zinc-500' },
  }
  const c = configs[status]
  return <Badge className={`text-xs border-0 ${c.cls}`}>{c.label}</Badge>
}

function SyncRow({ sync }: { sync: SyncStatus }) {
  const StatusIcon =
    sync.sync_status === 'healthy'
      ? CheckCircle2
      : sync.sync_status === 'failing'
      ? XCircle
      : sync.sync_status === 'degraded'
      ? AlertTriangle
      : Clock

  const iconCls =
    sync.sync_status === 'healthy'
      ? 'text-green-500'
      : sync.sync_status === 'failing'
      ? 'text-red-500'
      : sync.sync_status === 'degraded'
      ? 'text-amber-500'
      : 'text-zinc-400'

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      {/* Logo */}
      <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center bg-white overflow-hidden shrink-0">
        <Image src={sync.logo_src} alt={sync.display_name} width={28} height={28} className="object-contain" />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground">{sync.display_name}</span>
          <SyncStatusBadge status={sync.sync_status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {sync.last_synced_at ? (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Last synced {formatDistanceToNow(new Date(sync.last_synced_at), { addSuffix: true })}
            </span>
          ) : (
            <span>Never synced</span>
          )}
          {sync.records_synced_today > 0 && (
            <span>{sync.records_synced_today.toLocaleString()} records today</span>
          )}
          {sync.error_count_24h > 0 && (
            <span className="text-red-600">{sync.error_count_24h} error{sync.error_count_24h === 1 ? '' : 's'} in 24h</span>
          )}
        </div>
        {sync.last_error && (
          <p className="text-xs text-red-600 mt-0.5 truncate max-w-sm" title={sync.last_error}>
            {sync.last_error}
          </p>
        )}
      </div>

      <StatusIcon className={`h-5 w-5 shrink-0 ${iconCls}`} />
    </div>
  )
}

export function IntegrationSyncHealth({ connectedIntegrations }: { connectedIntegrations: string[] }) {
  const { data, isLoading } = useQuery({
    queryKey: ['integrations', 'sync-health'],
    queryFn: async () => {
      const res = await fetch('/api/integrations/sync-health')
      if (!res.ok) return { data: [] as SyncStatus[] }
      return res.json() as Promise<{ data: SyncStatus[] }>
    },
    refetchInterval: 60_000,
    enabled: connectedIntegrations.length > 0,
  })

  const syncStatuses = data?.data ?? []

  // Only show integrations that are in the passed list AND are actually connected
  const relevant = syncStatuses.filter(
    (s) => connectedIntegrations.includes(s.integration) && s.is_connected
  )

  if (relevant.length === 0 && !isLoading) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync Health
        </CardTitle>
        <CardDescription>
          Real-time status of your connected CRM integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : relevant.length > 0 ? (
          <div>
            {relevant.map((s) => (
              <SyncRow key={s.integration} sync={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Connect HubSpot or Salesforce to see sync health here.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
