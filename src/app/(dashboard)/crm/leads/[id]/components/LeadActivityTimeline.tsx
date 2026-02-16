'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Tag,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Activity {
  id: string
  lead_id: string
  workspace_id: string
  activity_type: string
  title: string
  description: string | null
  metadata: Record<string, unknown>
  performed_by: string | null
  performed_by_user?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
  created_at: string
}

interface StatusChange {
  id: string
  lead_id: string
  from_status: string | null
  to_status: string
  changed_by: string
  change_note: string | null
  changed_by_user?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
  created_at: string
}

interface LeadActivityTimelineProps {
  leadId: string
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  email_sent: Mail,
  email_opened: Mail,
  email_clicked: Mail,
  email_replied: Mail,
  call: Phone,
  meeting: Calendar,
  note: MessageSquare,
  status_change: TrendingUp,
  tag_added: Tag,
  tag_removed: Tag,
  assigned: UserCheck,
}

const ACTIVITY_COLORS: Record<string, string> = {
  email_sent: 'bg-blue-100 text-blue-600',
  email_opened: 'bg-green-100 text-green-600',
  email_clicked: 'bg-emerald-100 text-emerald-600',
  email_replied: 'bg-purple-100 text-purple-600',
  call: 'bg-amber-100 text-amber-600',
  meeting: 'bg-indigo-100 text-indigo-600',
  note: 'bg-gray-100 text-gray-600',
  status_change: 'bg-orange-100 text-orange-600',
  tag_added: 'bg-teal-100 text-teal-600',
  tag_removed: 'bg-red-100 text-red-600',
  assigned: 'bg-cyan-100 text-cyan-600',
}

export function LeadActivityTimeline({ leadId }: LeadActivityTimelineProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/activities?limit=50`)
      if (!res.ok) throw new Error('Failed to fetch activities')
      const json = await res.json()
      return json.data.activities as Activity[]
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load activities</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const activities = data || []

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">No activity yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Activities will appear here as you interact with this lead
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.activity_type] || Calendar
          const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-100 text-gray-600'

          return (
            <div key={activity.id} className="relative flex gap-3 pl-1">
              {/* Icon */}
              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Performer */}
                {activity.performed_by_user && (
                  <p className="text-xs text-gray-400 mt-1">
                    by {activity.performed_by_user.full_name}
                  </p>
                )}

                {/* Activity type badge */}
                <Badge variant="outline" className="mt-1.5 text-[10px] font-normal">
                  {activity.activity_type.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
