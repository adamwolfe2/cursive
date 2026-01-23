'use client'

/**
 * Admin Statistics Components
 * OpenInfo Platform
 *
 * Dashboard statistics and metrics for administrators.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatCurrency } from '@/lib/design-system'

// ============================================
// TYPES
// ============================================

export interface AdminMetrics {
  users: {
    total: number
    active: number
    newThisMonth: number
    growth: number
  }
  workspaces: {
    total: number
    active: number
  }
  queries: {
    total: number
    completed: number
    failed: number
    pending: number
  }
  leads: {
    total: number
    thisMonth: number
    enriched: number
    delivered: number
  }
  revenue: {
    mrr: number
    arr: number
    growth: number
  }
  usage: {
    apiCalls: number
    creditsUsed: number
    storageGb: number
  }
}

// ============================================
// METRIC CARD
// ============================================

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          {icon && (
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {typeof value === 'number' ? formatNumber(value) : value}
          </span>
          {change !== undefined && (
            <Badge
              variant={change >= 0 ? 'success' : 'destructive'}
              size="sm"
            >
              {change >= 0 ? '+' : ''}
              {change}%
            </Badge>
          )}
        </div>
        {changeLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// ADMIN OVERVIEW GRID
// ============================================

interface AdminOverviewGridProps {
  metrics: AdminMetrics | null
  loading?: boolean
}

export function AdminOverviewGrid({ metrics, loading }: AdminOverviewGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Users"
        value={metrics?.users.total ?? 0}
        change={metrics?.users.growth}
        changeLabel={`${metrics?.users.newThisMonth ?? 0} new this month`}
        loading={loading}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
      <MetricCard
        title="Active Workspaces"
        value={metrics?.workspaces.active ?? 0}
        changeLabel={`${metrics?.workspaces.total ?? 0} total`}
        loading={loading}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />
      <MetricCard
        title="Total Leads"
        value={metrics?.leads.total ?? 0}
        changeLabel={`${metrics?.leads.thisMonth ?? 0} this month`}
        loading={loading}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
      <MetricCard
        title="Monthly Revenue"
        value={formatCurrency(metrics?.revenue.mrr ?? 0)}
        change={metrics?.revenue.growth}
        changeLabel="MRR"
        loading={loading}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  )
}

// ============================================
// SYSTEM STATUS
// ============================================

interface SystemService {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  latency?: number
  uptime?: number
}

interface SystemStatusProps {
  services: SystemService[]
  loading?: boolean
}

export function SystemStatus({ services, loading }: SystemStatusProps) {
  const statusColors = {
    operational: 'bg-success',
    degraded: 'bg-warning',
    outage: 'bg-destructive',
  }

  const statusLabels = {
    operational: 'Operational',
    degraded: 'Degraded',
    outage: 'Outage',
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const allOperational = services.every((s) => s.status === 'operational')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Status</CardTitle>
          <Badge variant={allOperational ? 'success' : 'warning'}>
            {allOperational ? 'All Systems Operational' : 'Issues Detected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    statusColors[service.status]
                  )}
                />
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                {service.latency !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {service.latency}ms
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {statusLabels[service.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// RECENT ACTIVITY
// ============================================

interface ActivityItem {
  id: string
  type: 'user_signup' | 'query_created' | 'subscription_changed' | 'export_completed' | 'error'
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface RecentActivityProps {
  activities: ActivityItem[]
  loading?: boolean
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  const activityIcons = {
    user_signup: (
      <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    query_created: (
      <svg className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    subscription_changed: (
      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    export_completed: (
      <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    error: (
      <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {activityIcons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
