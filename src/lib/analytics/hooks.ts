/**
 * Analytics Hooks
 * OpenInfo Platform
 *
 * React hooks for analytics data fetching and state management.
 */

'use client'

import * as React from 'react'
import {
  TimeInterval,
  DataPoint,
  TrendData,
  aggregateMetrics,
  calculateTrend,
  aggregateTimeSeries,
  fillMissingDataPoints,
  calculateMovingAverage,
  AggregatedMetric,
} from './metrics'
import {
  ReportConfig,
  generateLeadsReport,
  generateQueriesReport,
  generateUsageReport,
  LeadsReport,
  QueriesReport,
  UsageReport,
} from './reports'

// ============================================
// DATE RANGE HOOK
// ============================================

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom'

export interface DateRange {
  start: Date
  end: Date
  preset?: DateRangePreset
}

function getPresetDateRange(preset: DateRangePreset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        preset,
      }
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return {
        start: yesterday,
        end: new Date(today.getTime() - 1),
        preset,
      }
    case 'last7days':
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
        preset,
      }
    case 'last30days':
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
        preset,
      }
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
        preset,
      }
    case 'lastMonth':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return {
        start: lastMonth,
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        preset,
      }
    case 'thisQuarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      return {
        start: new Date(now.getFullYear(), quarterStart, 1),
        end: now,
        preset,
      }
    case 'lastQuarter':
      const lastQuarterEnd = Math.floor(now.getMonth() / 3) * 3 - 1
      const lastQuarterStart = lastQuarterEnd - 2
      return {
        start: new Date(now.getFullYear(), lastQuarterStart, 1),
        end: new Date(now.getFullYear(), lastQuarterEnd + 1, 0, 23, 59, 59, 999),
        preset,
      }
    case 'thisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
        preset,
      }
    case 'lastYear':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
        preset,
      }
    default:
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
        preset: 'custom',
      }
  }
}

export function useDateRange(initialPreset: DateRangePreset = 'last30days') {
  const [dateRange, setDateRange] = React.useState<DateRange>(() =>
    getPresetDateRange(initialPreset)
  )

  const setPreset = React.useCallback((preset: DateRangePreset) => {
    setDateRange(getPresetDateRange(preset))
  }, [])

  const setCustomRange = React.useCallback((start: Date, end: Date) => {
    setDateRange({ start, end, preset: 'custom' })
  }, [])

  const previousPeriod = React.useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime()
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.start.getTime() - 1),
    }
  }, [dateRange])

  return {
    dateRange,
    previousPeriod,
    setPreset,
    setCustomRange,
    setDateRange,
  }
}

// ============================================
// INTERVAL HOOK
// ============================================

export function useTimeInterval(dateRange: DateRange) {
  const [interval, setInterval] = React.useState<TimeInterval>('day')

  // Auto-select appropriate interval based on date range
  React.useEffect(() => {
    const durationDays =
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)

    if (durationDays <= 1) {
      setInterval('hour')
    } else if (durationDays <= 14) {
      setInterval('day')
    } else if (durationDays <= 90) {
      setInterval('week')
    } else if (durationDays <= 365) {
      setInterval('month')
    } else {
      setInterval('quarter')
    }
  }, [dateRange])

  return { interval, setInterval }
}

// ============================================
// METRICS HOOK
// ============================================

export interface UseMetricsOptions {
  data: DataPoint[]
  dateRange: DateRange
  interval: TimeInterval
  previousPeriodData?: DataPoint[]
}

export interface UseMetricsResult {
  aggregated: AggregatedMetric
  timeSeries: DataPoint[]
  trend?: TrendData
  movingAverage: number[]
  isLoading: boolean
}

export function useMetrics({
  data,
  dateRange,
  interval,
  previousPeriodData,
}: UseMetricsOptions): UseMetricsResult {
  const result = React.useMemo(() => {
    // Filter data within date range
    const filteredData = data.filter(
      p => p.timestamp >= dateRange.start && p.timestamp <= dateRange.end
    )

    // Aggregate metrics
    const values = filteredData.map(p => p.value)
    const aggregated = aggregateMetrics(values)

    // Time series
    const aggregatedSeries = aggregateTimeSeries(filteredData, interval, 'sum')
    const timeSeries = fillMissingDataPoints(
      aggregatedSeries,
      dateRange.start,
      dateRange.end,
      interval
    )

    // Moving average (5-period)
    const movingAverage = calculateMovingAverage(timeSeries.map(p => p.value), 5)

    // Trend
    let trend: TrendData | undefined
    if (previousPeriodData) {
      const previousValues = previousPeriodData.map(p => p.value)
      const previousSum = previousValues.reduce((sum, v) => sum + v, 0)
      trend = calculateTrend(aggregated.sum, previousSum)
    }

    return {
      aggregated,
      timeSeries,
      trend,
      movingAverage,
      isLoading: false,
    }
  }, [data, dateRange, interval, previousPeriodData])

  return result
}

// ============================================
// COMPARISON HOOK
// ============================================

export interface ComparisonData {
  current: number
  previous: number
  trend: TrendData
  percentOfPrevious: number
}

export function useComparison(
  currentValue: number,
  previousValue: number
): ComparisonData {
  return React.useMemo(() => ({
    current: currentValue,
    previous: previousValue,
    trend: calculateTrend(currentValue, previousValue),
    percentOfPrevious: previousValue !== 0
      ? (currentValue / previousValue) * 100
      : currentValue !== 0 ? Infinity : 100,
  }), [currentValue, previousValue])
}

// ============================================
// REPORT HOOKS
// ============================================

export interface UseReportOptions<T> {
  data: T[]
  previousData?: T[]
  config: ReportConfig
  enabled?: boolean
}

export function useLeadsReport(options: UseReportOptions<{
  id: string
  name: string
  company: string
  source: string
  status: string
  intentScore: number
  createdAt: Date
  value?: number
}>) {
  const { data, previousData, config, enabled = true } = options

  const [report, setReport] = React.useState<LeadsReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return

    setIsLoading(true)

    // Simulate async report generation
    const timeoutId = setTimeout(() => {
      const generated = generateLeadsReport(data, config, previousData)
      setReport(generated)
      setIsLoading(false)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [data, previousData, config, enabled])

  return { report, isLoading }
}

export function useQueriesReport(options: UseReportOptions<{
  id: string
  name: string
  status: string
  resultCount: number
  creditsUsed: number
  createdAt: Date
  completedAt?: Date
}>) {
  const { data, previousData, config, enabled = true } = options

  const [report, setReport] = React.useState<QueriesReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return

    setIsLoading(true)

    const timeoutId = setTimeout(() => {
      const generated = generateQueriesReport(data, config, previousData)
      setReport(generated)
      setIsLoading(false)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [data, previousData, config, enabled])

  return { report, isLoading }
}

export function useUsageReport(options: UseReportOptions<{
  date: Date
  feature: string
  creditsUsed: number
}> & { totalCredits: number }) {
  const { data, previousData, config, totalCredits, enabled = true } = options

  const [report, setReport] = React.useState<UsageReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return

    setIsLoading(true)

    const timeoutId = setTimeout(() => {
      const generated = generateUsageReport(data, totalCredits, config, previousData)
      setReport(generated)
      setIsLoading(false)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [data, previousData, config, totalCredits, enabled])

  return { report, isLoading }
}

// ============================================
// REAL-TIME METRICS HOOK
// ============================================

export interface RealtimeMetric {
  id: string
  value: number
  timestamp: Date
  change?: number
}

export function useRealtimeMetrics(
  metricIds: string[],
  fetchFn: (ids: string[]) => Promise<RealtimeMetric[]>,
  intervalMs: number = 30000
) {
  const [metrics, setMetrics] = React.useState<Map<string, RealtimeMetric>>(new Map())
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      const newMetrics = await fetchFn(metricIds)
      setMetrics(prev => {
        const updated = new Map(prev)
        for (const metric of newMetrics) {
          const existing = updated.get(metric.id)
          updated.set(metric.id, {
            ...metric,
            change: existing ? metric.value - existing.value : undefined,
          })
        }
        return updated
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'))
    } finally {
      setIsLoading(false)
    }
  }, [metricIds, fetchFn])

  React.useEffect(() => {
    refresh()

    const intervalId = setInterval(refresh, intervalMs)
    return () => clearInterval(intervalId)
  }, [refresh, intervalMs])

  return {
    metrics: Array.from(metrics.values()),
    getMetric: (id: string) => metrics.get(id),
    isLoading,
    error,
    refresh,
  }
}

// ============================================
// DASHBOARD ANALYTICS HOOK
// ============================================

export interface DashboardAnalytics {
  totalLeads: number
  totalQueries: number
  creditsUsed: number
  activeUsers: number
  leadsTrend: TrendData
  queriesTrend: TrendData
  creditsTrend: TrendData
  usersTrend: TrendData
}

export function useDashboardAnalytics(
  fetchFn: () => Promise<{
    current: DashboardAnalytics
    previous: Omit<DashboardAnalytics, 'leadsTrend' | 'queriesTrend' | 'creditsTrend' | 'usersTrend'>
  }>,
  deps: React.DependencyList = []
) {
  const [analytics, setAnalytics] = React.useState<DashboardAnalytics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setIsLoading(true)
        const { current, previous } = await fetchFn()

        if (mounted) {
          setAnalytics({
            ...current,
            leadsTrend: calculateTrend(current.totalLeads, previous.totalLeads),
            queriesTrend: calculateTrend(current.totalQueries, previous.totalQueries),
            creditsTrend: calculateTrend(current.creditsUsed, previous.creditsUsed),
            usersTrend: calculateTrend(current.activeUsers, previous.activeUsers),
          })
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch analytics'))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetch()

    return () => {
      mounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { analytics, isLoading, error }
}
