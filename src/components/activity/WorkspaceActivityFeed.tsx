'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Download,
  ShoppingCart,
  Mail,
  CreditCard,
  UserPlus,
  Key,
  Webhook,
  Link2,
  Activity,
  Users,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface ActivityEvent {
  id: string
  action: string
  description: string
  actor_name: string
  created_at: string
}

function actionIcon(action: string): LucideIcon {
  if (action.includes('export')) return Download
  if (action.includes('purchase') && action.includes('lead')) return ShoppingCart
  if (action.includes('campaign')) return Mail
  if (action.includes('credit')) return CreditCard
  if (action.includes('member') || action.includes('invite')) return UserPlus
  if (action.includes('api_key')) return Key
  if (action.includes('webhook')) return Webhook
  if (action.includes('integration')) return Link2
  if (action.includes('contact')) return Users
  return Activity
}

function actionColor(action: string): string {
  if (action.includes('export')) return 'bg-blue-100 text-blue-600'
  if (action.includes('purchase')) return 'bg-emerald-100 text-emerald-600'
  if (action.includes('campaign')) return 'bg-violet-100 text-violet-600'
  if (action.includes('credit')) return 'bg-amber-100 text-amber-600'
  if (action.includes('member') || action.includes('invite')) return 'bg-pink-100 text-pink-600'
  if (action.includes('api_key') || action.includes('webhook')) return 'bg-zinc-100 text-zinc-600'
  if (action.includes('integration')) return 'bg-indigo-100 text-indigo-600'
  return 'bg-slate-100 text-slate-600'
}

export function WorkspaceActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['workspace', 'activity'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/activity?limit=10')
      if (!res.ok) throw new Error('Failed to load activity')
      return res.json() as Promise<{ data: ActivityEvent[] }>
    },
    refetchInterval: 60_000,
  })

  const events = data?.data ?? []

  return (
    <div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center">
          <Activity className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => {
            const Icon = actionIcon(event.action)
            const color = actionColor(event.action)
            return (
              <div key={event.id} className="flex items-start gap-3 py-2">
                <div className={`p-1.5 rounded-full shrink-0 ${color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
