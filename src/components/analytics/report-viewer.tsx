'use client'

/**
 * Report Viewer Components
 * OpenInfo Platform
 *
 * Components for viewing and exporting analytics reports.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/design-system'
import {
  BarChart,
  DonutChart,
  AreaChart,
  MetricTrend,
  ChartCard,
  type ChartDataPoint,
} from './charts'
import {
  type TrendData,
  type FunnelStep,
} from '@/lib/analytics/metrics'
import {
  type TableData,
  type LineChartData,
  type PieChartData,
  type BarChartData,
  exportToCSV,
  exportToJSON,
  generateReportFilename,
} from '@/lib/analytics/reports'
import {
  type DateRange,
  type DateRangePreset,
  useDateRange,
  useTimeInterval,
} from '@/lib/analytics/hooks'

// ============================================
// DATE RANGE PICKER
// ============================================

interface DateRangePickerProps {
  dateRange: DateRange
  onPresetChange: (preset: DateRangePreset) => void
  onCustomRangeChange: (start: Date, end: Date) => void
  className?: string
}

export function DateRangePicker({
  dateRange,
  onPresetChange,
  onCustomRangeChange,
  className,
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = React.useState(false)

  const presets: Array<{ value: DateRangePreset; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'lastQuarter', label: 'Last Quarter' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        value={dateRange.preset || 'custom'}
        onChange={(e) => {
          const preset = e.target.value as DateRangePreset
          if (preset === 'custom') {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            onPresetChange(preset)
          }
        }}
        className="w-40"
      >
        {presets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </Select>

      {showCustom && (
        <>
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) =>
              onCustomRangeChange(new Date(e.target.value), dateRange.end)
            }
            className="px-3 py-2 border border-input rounded-md text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) =>
              onCustomRangeChange(dateRange.start, new Date(e.target.value))
            }
            className="px-3 py-2 border border-input rounded-md text-sm"
          />
        </>
      )}

      <span className="text-sm text-muted-foreground">
        {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
      </span>
    </div>
  )
}

// ============================================
// FUNNEL CHART
// ============================================

interface FunnelChartProps {
  steps: FunnelStep[]
  className?: string
  loading?: boolean
}

export function FunnelChart({ steps, className, loading }: FunnelChartProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  const maxCount = steps[0]?.count || 1

  return (
    <div className={cn('space-y-2', className)}>
      {steps.map((step, index) => (
        <div key={index} className="relative">
          <div
            className="h-12 rounded-lg flex items-center justify-between px-4 transition-all"
            style={{
              width: `${Math.max((step.count / maxCount) * 100, 20)}%`,
              backgroundColor: `hsl(var(--primary) / ${1 - index * 0.2})`,
            }}
          >
            <span className="text-sm font-medium text-primary-foreground">
              {step.name}
            </span>
            <span className="text-sm font-bold text-primary-foreground">
              {formatNumber(step.count)}
            </span>
          </div>
          {index > 0 && (
            <div className="absolute -top-1 right-0 text-xs text-muted-foreground">
              -{formatPercentage(step.dropoffPercentage / 100, 1)} drop
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================
// DATA TABLE VIEWER
// ============================================

interface DataTableViewerProps {
  data: TableData
  title?: string
  className?: string
  loading?: boolean
  onExport?: (format: 'csv' | 'json') => void
}

export function DataTableViewer({
  data,
  title,
  className,
  loading,
  onExport,
}: DataTableViewerProps) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {(title || onExport) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
          {onExport && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('json')}>
                Export JSON
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {data.headers.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide',
                    header.align === 'right' && 'text-right',
                    header.align === 'center' && 'text-center'
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border last:border-0 hover:bg-muted/50"
              >
                {data.headers.map((header) => (
                  <td
                    key={header.key}
                    className={cn(
                      'px-4 py-3 text-sm',
                      header.align === 'right' && 'text-right',
                      header.align === 'center' && 'text-center'
                    )}
                  >
                    {String(row[header.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {data.summary && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                {data.headers.map((header) => (
                  <td
                    key={header.key}
                    className={cn(
                      'px-4 py-3 text-sm font-medium',
                      header.align === 'right' && 'text-right',
                      header.align === 'center' && 'text-center'
                    )}
                  >
                    {data.summary![header.key] !== null
                      ? String(data.summary![header.key])
                      : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

// ============================================
// TREND BADGE
// ============================================

interface TrendBadgeProps {
  trend: TrendData
  showValue?: boolean
  className?: string
}

export function TrendBadge({ trend, showValue = true, className }: TrendBadgeProps) {
  return (
    <Badge
      variant={
        trend.trend === 'up'
          ? 'success'
          : trend.trend === 'down'
          ? 'destructive'
          : 'secondary'
      }
      className={cn('gap-1', className)}
    >
      {trend.trend === 'up' && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )}
      {trend.trend === 'down' && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {showValue && `${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`}
    </Badge>
  )
}

// ============================================
// REPORT HEADER
// ============================================

interface ReportHeaderProps {
  title: string
  description?: string
  dateRange: DateRange
  onDateRangeChange: (preset: DateRangePreset) => void
  onCustomDateChange: (start: Date, end: Date) => void
  onExport?: (format: 'csv' | 'json' | 'pdf') => void
  loading?: boolean
  className?: string
}

export function ReportHeader({
  title,
  description,
  dateRange,
  onDateRangeChange,
  onCustomDateChange,
  onExport,
  loading,
  className,
}: ReportHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {onExport && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('csv')}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </Button>
          </div>
        )}
      </div>
      <DateRangePicker
        dateRange={dateRange}
        onPresetChange={onDateRangeChange}
        onCustomRangeChange={onCustomDateChange}
      />
    </div>
  )
}

// ============================================
// KEY METRICS GRID
// ============================================

interface KeyMetric {
  label: string
  value: number | string
  format?: 'number' | 'currency' | 'percentage'
  trend?: TrendData
  sparkline?: number[]
}

interface KeyMetricsGridProps {
  metrics: KeyMetric[]
  columns?: 2 | 3 | 4
  className?: string
  loading?: boolean
}

export function KeyMetricsGrid({
  metrics,
  columns = 4,
  className,
  loading,
}: KeyMetricsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  if (loading) {
    return (
      <div className={cn('grid gap-4', gridCols[columns], className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatValue = (metric: KeyMetric): string => {
    if (typeof metric.value === 'string') return metric.value
    switch (metric.format) {
      case 'currency':
        return formatCurrency(metric.value)
      case 'percentage':
        return formatPercentage(metric.value / 100)
      default:
        return formatNumber(metric.value)
    }
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <MetricTrend
              label={metric.label}
              value={formatValue(metric)}
              trend={
                metric.trend
                  ? { value: metric.trend.changePercent, direction: metric.trend.trend }
                  : undefined
              }
              sparklineData={metric.sparkline}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================
// REPORT PAGE WRAPPER
// ============================================

interface ReportPageProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ReportPage({ title, description, children, className }: ReportPageProps) {
  const { dateRange, setPreset, setCustomRange } = useDateRange('last30days')
  const { interval, setInterval } = useTimeInterval(dateRange)

  return (
    <div className={cn('space-y-6', className)}>
      <ReportHeader
        title={title}
        description={description}
        dateRange={dateRange}
        onDateRangeChange={setPreset}
        onCustomDateChange={setCustomRange}
      />
      <ReportContext.Provider value={{ dateRange, interval, setInterval }}>
        {children}
      </ReportContext.Provider>
    </div>
  )
}

// Report context for child components
interface ReportContextValue {
  dateRange: DateRange
  interval: import('@/lib/analytics/metrics').TimeInterval
  setInterval: (interval: import('@/lib/analytics/metrics').TimeInterval) => void
}

const ReportContext = React.createContext<ReportContextValue | null>(null)

export function useReportContext() {
  const context = React.useContext(ReportContext)
  if (!context) {
    throw new Error('useReportContext must be used within a ReportPage')
  }
  return context
}

// ============================================
// EXPORT BUTTON
// ============================================

interface ExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  className?: string
}

export function ExportButton({ data, filename, className }: ExportButtonProps) {
  const [exporting, setExporting] = React.useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)

    try {
      const content =
        format === 'csv'
          ? exportToCSV(data, { filename, includeHeaders: true })
          : exportToJSON(data, { filename })

      const blob = new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={exporting}
      >
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('json')}
        disabled={exporting}
      >
        JSON
      </Button>
    </div>
  )
}
