/**
 * Analytics Metrics Utilities
 * OpenInfo Platform
 *
 * Core metrics calculation, aggregation, and time-series utilities.
 */

// ============================================
// TYPES
// ============================================

export interface DataPoint {
  timestamp: Date
  value: number
  label?: string
  metadata?: Record<string, unknown>
}

export interface TimeSeriesData {
  points: DataPoint[]
  startDate: Date
  endDate: Date
  interval: TimeInterval
}

export type TimeInterval = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface AggregatedMetric {
  sum: number
  avg: number
  min: number
  max: number
  count: number
  median: number
  standardDeviation: number
}

export interface TrendData {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface MetricComparison {
  metric: string
  currentPeriod: AggregatedMetric
  previousPeriod: AggregatedMetric
  trend: TrendData
}

export interface BucketedData {
  bucket: string
  count: number
  percentage: number
  values: number[]
}

// ============================================
// TIME UTILITIES
// ============================================

export function getStartOfPeriod(date: Date, interval: TimeInterval): Date {
  const result = new Date(date)

  switch (interval) {
    case 'hour':
      result.setMinutes(0, 0, 0)
      break
    case 'day':
      result.setHours(0, 0, 0, 0)
      break
    case 'week':
      const day = result.getDay()
      result.setDate(result.getDate() - day)
      result.setHours(0, 0, 0, 0)
      break
    case 'month':
      result.setDate(1)
      result.setHours(0, 0, 0, 0)
      break
    case 'quarter':
      const quarter = Math.floor(result.getMonth() / 3)
      result.setMonth(quarter * 3, 1)
      result.setHours(0, 0, 0, 0)
      break
    case 'year':
      result.setMonth(0, 1)
      result.setHours(0, 0, 0, 0)
      break
  }

  return result
}

export function getEndOfPeriod(date: Date, interval: TimeInterval): Date {
  const start = getStartOfPeriod(date, interval)
  const result = new Date(start)

  switch (interval) {
    case 'hour':
      result.setHours(result.getHours() + 1)
      break
    case 'day':
      result.setDate(result.getDate() + 1)
      break
    case 'week':
      result.setDate(result.getDate() + 7)
      break
    case 'month':
      result.setMonth(result.getMonth() + 1)
      break
    case 'quarter':
      result.setMonth(result.getMonth() + 3)
      break
    case 'year':
      result.setFullYear(result.getFullYear() + 1)
      break
  }

  result.setMilliseconds(result.getMilliseconds() - 1)
  return result
}

export function getPreviousPeriod(
  startDate: Date,
  endDate: Date
): { start: Date; end: Date } {
  const duration = endDate.getTime() - startDate.getTime()
  return {
    start: new Date(startDate.getTime() - duration),
    end: new Date(startDate.getTime() - 1),
  }
}

export function generateDateRange(
  startDate: Date,
  endDate: Date,
  interval: TimeInterval
): Date[] {
  const dates: Date[] = []
  let current = getStartOfPeriod(startDate, interval)

  while (current <= endDate) {
    dates.push(new Date(current))

    switch (interval) {
      case 'hour':
        current.setHours(current.getHours() + 1)
        break
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
      case 'quarter':
        current.setMonth(current.getMonth() + 3)
        break
      case 'year':
        current.setFullYear(current.getFullYear() + 1)
        break
    }
  }

  return dates
}

export function formatDateByInterval(date: Date, interval: TimeInterval): string {
  const options: Intl.DateTimeFormatOptions = {}

  switch (interval) {
    case 'hour':
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    case 'day':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    case 'week':
      const weekEnd = new Date(date)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    case 'month':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `Q${quarter} ${date.getFullYear()}`
    case 'year':
      return date.getFullYear().toString()
  }
}

// ============================================
// AGGREGATION FUNCTIONS
// ============================================

export function calculateSum(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0)
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return calculateSum(values) / values.length
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0

  const avg = calculateAverage(values)
  const squareDiffs = values.map(value => Math.pow(value - avg, 2))
  const avgSquareDiff = calculateAverage(squareDiffs)

  return Math.sqrt(avgSquareDiff)
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) return sorted[lower]

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

export function aggregateMetrics(values: number[]): AggregatedMetric {
  if (values.length === 0) {
    return {
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      count: 0,
      median: 0,
      standardDeviation: 0,
    }
  }

  return {
    sum: calculateSum(values),
    avg: calculateAverage(values),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    median: calculateMedian(values),
    standardDeviation: calculateStandardDeviation(values),
  }
}

// ============================================
// TREND ANALYSIS
// ============================================

export function calculateTrend(current: number, previous: number): TrendData {
  const change = current - previous
  const changePercent = previous !== 0
    ? (change / Math.abs(previous)) * 100
    : current !== 0 ? 100 : 0

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (Math.abs(changePercent) > 0.5) {
    trend = change > 0 ? 'up' : 'down'
  }

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  }
}

export function compareMetrics(
  metric: string,
  currentValues: number[],
  previousValues: number[]
): MetricComparison {
  const currentPeriod = aggregateMetrics(currentValues)
  const previousPeriod = aggregateMetrics(previousValues)

  return {
    metric,
    currentPeriod,
    previousPeriod,
    trend: calculateTrend(currentPeriod.sum, previousPeriod.sum),
  }
}

// ============================================
// TIME SERIES
// ============================================

export function groupByInterval(
  data: DataPoint[],
  interval: TimeInterval
): Map<string, DataPoint[]> {
  const groups = new Map<string, DataPoint[]>()

  for (const point of data) {
    const periodStart = getStartOfPeriod(point.timestamp, interval)
    const key = periodStart.toISOString()

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(point)
  }

  return groups
}

export function aggregateTimeSeries(
  data: DataPoint[],
  interval: TimeInterval,
  aggregator: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum'
): DataPoint[] {
  const groups = groupByInterval(data, interval)
  const result: DataPoint[] = []

  for (const [key, points] of Array.from(groups.entries())) {
    const values = points.map(p => p.value)
    let aggregatedValue: number

    switch (aggregator) {
      case 'sum':
        aggregatedValue = calculateSum(values)
        break
      case 'avg':
        aggregatedValue = calculateAverage(values)
        break
      case 'min':
        aggregatedValue = Math.min(...values)
        break
      case 'max':
        aggregatedValue = Math.max(...values)
        break
      case 'count':
        aggregatedValue = values.length
        break
    }

    result.push({
      timestamp: new Date(key),
      value: aggregatedValue,
      label: formatDateByInterval(new Date(key), interval),
    })
  }

  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function fillMissingDataPoints(
  data: DataPoint[],
  startDate: Date,
  endDate: Date,
  interval: TimeInterval,
  defaultValue: number = 0
): DataPoint[] {
  const dateRange = generateDateRange(startDate, endDate, interval)
  const dataMap = new Map(
    data.map(d => [getStartOfPeriod(d.timestamp, interval).toISOString(), d])
  )

  return dateRange.map(date => {
    const key = date.toISOString()
    const existing = dataMap.get(key)

    return existing || {
      timestamp: date,
      value: defaultValue,
      label: formatDateByInterval(date, interval),
    }
  })
}

// ============================================
// BUCKETING & DISTRIBUTION
// ============================================

export function bucketByRange(
  values: number[],
  ranges: Array<{ min: number; max: number; label: string }>
): BucketedData[] {
  const total = values.length

  return ranges.map(range => {
    const matching = values.filter(v => v >= range.min && v < range.max)
    return {
      bucket: range.label,
      count: matching.length,
      percentage: total > 0 ? (matching.length / total) * 100 : 0,
      values: matching,
    }
  })
}

export function bucketByValue<T>(
  items: T[],
  keyFn: (item: T) => string
): Map<string, T[]> {
  const buckets = new Map<string, T[]>()

  for (const item of items) {
    const key = keyFn(item)
    if (!buckets.has(key)) {
      buckets.set(key, [])
    }
    buckets.get(key)!.push(item)
  }

  return buckets
}

export function calculateDistribution(values: number[], bucketCount: number = 10): BucketedData[] {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const bucketSize = range / bucketCount

  const ranges = Array.from({ length: bucketCount }, (_, i) => ({
    min: min + i * bucketSize,
    max: min + (i + 1) * bucketSize,
    label: `${(min + i * bucketSize).toFixed(1)} - ${(min + (i + 1) * bucketSize).toFixed(1)}`,
  }))

  // Adjust last bucket to include max value
  ranges[ranges.length - 1].max = max + 1

  return bucketByRange(values, ranges)
}

// ============================================
// GROWTH METRICS
// ============================================

export function calculateGrowthRate(values: number[]): number[] {
  if (values.length < 2) return []

  return values.slice(1).map((current, index) => {
    const previous = values[index]
    return previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0
  })
}

export function calculateCompoundGrowthRate(startValue: number, endValue: number, periods: number): number {
  if (startValue <= 0 || periods <= 0) return 0
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100
}

export function calculateMovingAverage(values: number[], windowSize: number): number[] {
  if (values.length < windowSize) return []

  const result: number[] = []
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1)
    result.push(calculateAverage(window))
  }

  return result
}

export function calculateExponentialMovingAverage(
  values: number[],
  smoothingFactor: number = 0.2
): number[] {
  if (values.length === 0) return []

  const result: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    const ema = values[i] * smoothingFactor + result[i - 1] * (1 - smoothingFactor)
    result.push(ema)
  }

  return result
}

// ============================================
// FUNNEL ANALYSIS
// ============================================

export interface FunnelStep {
  name: string
  count: number
  percentage: number
  dropoff: number
  dropoffPercentage: number
}

export function calculateFunnel(steps: Array<{ name: string; count: number }>): FunnelStep[] {
  if (steps.length === 0) return []

  const total = steps[0].count

  return steps.map((step, index) => {
    const previousCount = index > 0 ? steps[index - 1].count : step.count
    const dropoff = previousCount - step.count

    return {
      name: step.name,
      count: step.count,
      percentage: total > 0 ? (step.count / total) * 100 : 0,
      dropoff,
      dropoffPercentage: previousCount > 0 ? (dropoff / previousCount) * 100 : 0,
    }
  })
}

// ============================================
// COHORT ANALYSIS
// ============================================

export interface CohortData {
  cohortId: string
  cohortDate: Date
  periods: Array<{
    period: number
    value: number
    retention: number
  }>
}

export function calculateCohortRetention(
  cohorts: Array<{
    cohortId: string
    cohortDate: Date
    periodValues: number[]
  }>
): CohortData[] {
  return cohorts.map(cohort => ({
    cohortId: cohort.cohortId,
    cohortDate: cohort.cohortDate,
    periods: cohort.periodValues.map((value, index) => ({
      period: index,
      value,
      retention: cohort.periodValues[0] > 0
        ? (value / cohort.periodValues[0]) * 100
        : 0,
    })),
  }))
}
