'use client'

import { useQuery } from '@tanstack/react-query'
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils'
import type { LeadActivity, ActivityType } from '@/types'

interface LeadActivityTimelineProps {
  leadId: string
  className?: string
}

const activityIcons: Record<ActivityType, { icon: React.ReactNode; bg: string }> = {
  status_change: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    bg: 'bg-blue-100 text-blue-600',
  },
  note_added: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bg: 'bg-zinc-100 text-zinc-600',
  },
  email_sent: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    bg: 'bg-purple-100 text-purple-600',
  },
  email_opened: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
      </svg>
    ),
    bg: 'bg-green-100 text-green-600',
  },
  email_clicked: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    bg: 'bg-amber-100 text-amber-600',
  },
  email_replied: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
    bg: 'bg-emerald-100 text-emerald-600',
  },
  call_logged: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    bg: 'bg-cyan-100 text-cyan-600',
  },
  meeting_scheduled: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    bg: 'bg-orange-100 text-orange-600',
  },
  task_completed: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-emerald-100 text-emerald-600',
  },
  assigned: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    bg: 'bg-indigo-100 text-indigo-600',
  },
  enriched: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: 'bg-yellow-100 text-yellow-600',
  },
  created: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    bg: 'bg-zinc-100 text-zinc-600',
  },
}

async function fetchActivities(leadId: string): Promise<{ activities: LeadActivity[] }> {
  const res = await fetch(`/api/leads/${leadId}/activities`)
  if (!res.ok) throw new Error('Failed to fetch activities')
  return res.json()
}

export function LeadActivityTimeline({ leadId, className }: LeadActivityTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: () => fetchActivities(leadId),
  })

  const activities = data?.activities || []

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <svg className="h-5 w-5 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-sm text-zinc-500', className)}>
        No activity yet.
      </div>
    )
  }

  return (
    <div className={cn('flow-root', className)}>
      <ul className="-mb-8">
        {activities.map((activity: any, idx: number) => {
          const config = activityIcons[activity.activity_type as ActivityType] || activityIcons.created
          const isLast = idx === activities.length - 1

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white', config.bg)}>
                      {config.icon}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-zinc-900">
                        {activity.title}
                        {activity.performed_by_user && (
                          <span className="text-zinc-500">
                            {' '}by <span className="font-medium text-zinc-700">{activity.performed_by_user.full_name}</span>
                          </span>
                        )}
                      </p>
                      {activity.description && (
                        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-zinc-500">
                      <time dateTime={activity.created_at} title={formatDateTime(activity.created_at)}>
                        {formatRelativeTime(activity.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
