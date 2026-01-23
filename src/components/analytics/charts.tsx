'use client'

/**
 * Chart Components
 * OpenInfo Platform
 *
 * Reusable chart components for analytics visualization.
 * These components render data in various chart formats.
 */

import * as React from 'react'
import { cn } from '@/lib/design-system'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatPercentage } from '@/lib/design-system'

// ============================================
// TYPES
// ============================================

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface LineChartDataset {
  label: string
  data: number[]
  color?: string
}

// ============================================
// SIMPLE BAR CHART
// ============================================

interface BarChartProps {
  data: ChartDataPoint[]
  height?: number
  showValues?: boolean
  horizontal?: boolean
  className?: string
  loading?: boolean
}

export function BarChart({
  data,
  height = 200,
  showValues = true,
  horizontal = false,
  className,
  loading,
}: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  if (loading) {
    return (
      <div className={cn('space-y-2', className)} style={{ height }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    )
  }

  if (horizontal) {
    return (
      <div className={cn('space-y-3', className)}>
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{item.label}</span>
              {showValues && (
                <span className="text-muted-foreground font-medium">
                  {formatNumber(item.value)}
                </span>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || 'hsl(var(--primary))',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-end gap-2', className)}
      style={{ height }}
    >
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 flex flex-col items-center gap-1"
        >
          {showValues && (
            <span className="text-xs text-muted-foreground font-medium">
              {formatNumber(item.value)}
            </span>
          )}
          <div
            className="w-full rounded-t transition-all duration-500 hover:opacity-80"
            style={{
              height: `${(item.value / maxValue) * (height - 40)}px`,
              backgroundColor: item.color || 'hsl(var(--primary))',
              minHeight: item.value > 0 ? '4px' : '0',
            }}
          />
          <span className="text-xs text-muted-foreground truncate max-w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// SIMPLE LINE CHART (CSS-based)
// ============================================

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  showDots?: boolean
  className?: string
}

export function Sparkline({
  data,
  color = 'hsl(var(--primary))',
  height = 40,
  width = 120,
  showDots = false,
  className,
}: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }))

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    return `${acc} L ${point.x} ${point.y}`
  }, '')

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={color}
        />
      ))}
    </svg>
  )
}

// ============================================
// AREA CHART (CSS-based)
// ============================================

interface AreaChartProps {
  data: ChartDataPoint[]
  color?: string
  height?: number
  showLabels?: boolean
  showGrid?: boolean
  className?: string
  loading?: boolean
}

export function AreaChart({
  data,
  color = 'hsl(var(--primary))',
  height = 200,
  showLabels = true,
  showGrid = true,
  className,
  loading,
}: AreaChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 400, height })

  React.useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        })
      }
    })

    if (svgRef.current?.parentElement) {
      observer.observe(svgRef.current.parentElement)
    }

    return () => observer.disconnect()
  }, [height])

  if (loading) {
    return <Skeleton className={cn('w-full', className)} style={{ height }} />
  }

  if (data.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ height }}
      >
        Not enough data points
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.value))
  const min = 0
  const range = max - min || 1

  const padding = { top: 20, right: 20, bottom: showLabels ? 40 : 20, left: 40 }
  const chartWidth = dimensions.width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
    label: d.label,
    value: d.value,
  }))

  const linePath = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`
    return `${acc} L ${point.x} ${point.y}`
  }, '')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  // Grid lines
  const gridLines = 5
  const gridYPositions = Array.from({ length: gridLines }, (_, i) =>
    padding.top + (i / (gridLines - 1)) * chartHeight
  )
  const gridYValues = Array.from({ length: gridLines }, (_, i) =>
    max - (i / (gridLines - 1)) * range
  )

  return (
    <svg
      ref={svgRef}
      className={cn('w-full', className)}
      height={height}
      viewBox={`0 0 ${dimensions.width} ${height}`}
    >
      {/* Grid */}
      {showGrid && gridYPositions.map((y, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={y}
            x2={dimensions.width - padding.right}
            y2={y}
            stroke="hsl(var(--border))"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground text-xs"
          >
            {formatNumber(Math.round(gridYValues[i]))}
          </text>
        </g>
      ))}

      {/* Area */}
      <path
        d={areaPath}
        fill={color}
        fillOpacity="0.1"
      />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="hsl(var(--background))"
          stroke={color}
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {showLabels && points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((point, i) => (
        <text
          key={i}
          x={point.x}
          y={height - 10}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          {point.label}
        </text>
      ))}
    </svg>
  )
}

// ============================================
// DONUT CHART
// ============================================

interface DonutChartProps {
  data: ChartDataPoint[]
  size?: number
  thickness?: number
  showLegend?: boolean
  showTotal?: boolean
  totalLabel?: string
  className?: string
  loading?: boolean
}

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--info))',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
]

export function DonutChart({
  data,
  size = 160,
  thickness = 24,
  showLegend = true,
  showTotal = true,
  totalLabel = 'Total',
  className,
  loading,
}: DonutChartProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <Skeleton className="rounded-full" style={{ width: size, height: size }} />
        {showLegend && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
        )}
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = size / 2
  const innerRadius = radius - thickness

  let cumulativeAngle = -90 // Start from top

  const segments = data.map((d, i) => {
    const angle = total > 0 ? (d.value / total) * 360 : 0
    const startAngle = cumulativeAngle
    cumulativeAngle += angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = ((startAngle + angle) * Math.PI) / 180

    const x1 = radius + radius * Math.cos(startRad)
    const y1 = radius + radius * Math.sin(startRad)
    const x2 = radius + radius * Math.cos(endRad)
    const y2 = radius + radius * Math.sin(endRad)

    const ix1 = radius + innerRadius * Math.cos(startRad)
    const iy1 = radius + innerRadius * Math.sin(startRad)
    const ix2 = radius + innerRadius * Math.cos(endRad)
    const iy2 = radius + innerRadius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const pathD = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ')

    return {
      ...d,
      color: d.color || DONUT_COLORS[i % DONUT_COLORS.length],
      pathD,
      percentage: total > 0 ? (d.value / total) * 100 : 0,
    }
  })

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((segment, i) => (
            <path
              key={i}
              d={segment.pathD}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            />
          ))}
        </svg>
        {showTotal && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ padding: thickness }}
          >
            <span className="text-2xl font-bold text-foreground">
              {formatNumber(total)}
            </span>
            <span className="text-xs text-muted-foreground">{totalLabel}</span>
          </div>
        )}
      </div>

      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-foreground">{segment.label}</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {formatPercentage(segment.percentage / 100, 1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// PROGRESS RING
// ============================================

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  showValue?: boolean
  label?: string
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = 'hsl(var(--primary))',
  showValue = true,
  label,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(value / max, 1)
  const offset = circumference - percentage * circumference

  return (
    <div className={cn('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-foreground">
            {formatPercentage(percentage, 0)}
          </span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// METRIC TREND
// ============================================

interface MetricTrendProps {
  label: string
  value: number | string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'stable'
  }
  sparklineData?: number[]
  className?: string
}

export function MetricTrend({
  label,
  value,
  trend,
  sparklineData,
  className,
}: MetricTrendProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium flex items-center gap-0.5',
              trend.direction === 'up' && 'text-success',
              trend.direction === 'down' && 'text-destructive',
              trend.direction === 'stable' && 'text-muted-foreground'
            )}
          >
            {trend.direction === 'up' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {formatPercentage(Math.abs(trend.value) / 100, 1)}
          </span>
        )}
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <Sparkline
          data={sparklineData}
          color={
            trend?.direction === 'up'
              ? 'hsl(var(--success))'
              : trend?.direction === 'down'
              ? 'hsl(var(--destructive))'
              : 'hsl(var(--primary))'
          }
          width={100}
          height={24}
        />
      )}
    </div>
  )
}

// ============================================
// CHART CARD WRAPPER
// ============================================

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
