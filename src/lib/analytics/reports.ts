/**
 * Report Generation Utilities
 * OpenInfo Platform
 *
 * Generate various reports from analytics data.
 */

import {
  DataPoint,
  TimeInterval,
  TrendData,
  AggregatedMetric,
  aggregateMetrics,
  calculateTrend,
  aggregateTimeSeries,
  fillMissingDataPoints,
  calculateFunnel,
  FunnelStep,
} from './metrics'

// ============================================
// TYPES
// ============================================

export interface ReportConfig {
  id: string
  name: string
  description?: string
  dateRange: {
    start: Date
    end: Date
  }
  compareWithPrevious?: boolean
  interval: TimeInterval
  metrics: string[]
  filters?: Record<string, unknown>
}

export interface ReportSection {
  title: string
  type: 'summary' | 'chart' | 'table' | 'funnel' | 'cohort'
  data: unknown
}

export interface Report {
  id: string
  config: ReportConfig
  generatedAt: Date
  sections: ReportSection[]
  summary: ReportSummary
}

export interface ReportSummary {
  totalRecords: number
  dateRange: string
  keyMetrics: Array<{
    name: string
    value: number
    formattedValue: string
    trend?: TrendData
  }>
}

// ============================================
// CHART DATA FORMATTERS
// ============================================

export interface LineChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
}

export interface BarChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
}

export interface PieChartData {
  labels: string[]
  data: number[]
  colors?: string[]
}

export function formatForLineChart(
  dataSets: Array<{ label: string; points: DataPoint[]; color?: string }>,
  startDate: Date,
  endDate: Date,
  interval: TimeInterval
): LineChartData {
  // Fill missing points and ensure all datasets have same labels
  const filledDataSets = dataSets.map(ds => ({
    ...ds,
    points: fillMissingDataPoints(ds.points, startDate, endDate, interval),
  }))

  const labels = filledDataSets[0]?.points.map(p => p.label || '') || []

  return {
    labels,
    datasets: filledDataSets.map(ds => ({
      label: ds.label,
      data: ds.points.map(p => p.value),
      color: ds.color,
    })),
  }
}

export function formatForBarChart(
  data: Array<{ label: string; value: number; color?: string }>
): BarChartData {
  return {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Value',
      data: data.map(d => d.value),
      color: data[0]?.color,
    }],
  }
}

export function formatForPieChart(
  data: Array<{ label: string; value: number; color?: string }>
): PieChartData {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return {
    labels: data.map(d => `${d.label} (${total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)`),
    data: data.map(d => d.value),
    colors: data.map(d => d.color).filter((c): c is string => !!c),
  }
}

// ============================================
// TABLE FORMATTERS
// ============================================

export interface TableData {
  headers: Array<{
    key: string
    label: string
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
  }>
  rows: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

export function formatForTable<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{
    key: keyof T
    label: string
    format?: (value: T[keyof T]) => string
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
  }>,
  options?: {
    includeSummary?: boolean
    summaryFn?: (data: T[], key: keyof T) => unknown
  }
): TableData {
  const headers = columns.map(col => ({
    key: col.key as string,
    label: col.label,
    align: col.align,
    sortable: col.sortable,
  }))

  const rows = data.map(item =>
    Object.fromEntries(
      columns.map(col => [
        col.key,
        col.format ? col.format(item[col.key]) : item[col.key],
      ])
    )
  )

  let summary: Record<string, unknown> | undefined

  if (options?.includeSummary) {
    summary = Object.fromEntries(
      columns.map(col => [
        col.key,
        options.summaryFn
          ? options.summaryFn(data, col.key)
          : null,
      ])
    )
  }

  return { headers, rows, summary }
}

// ============================================
// REPORT GENERATORS
// ============================================

export interface LeadsReport {
  totalLeads: number
  newLeadsThisPeriod: number
  leadsOverTime: LineChartData
  leadsBySource: PieChartData
  leadsByStatus: BarChartData
  conversionFunnel: FunnelStep[]
  topLeads: TableData
  trend: TrendData
}

export function generateLeadsReport(
  leads: Array<{
    id: string
    name: string
    company: string
    source: string
    status: string
    intentScore: number
    createdAt: Date
    value?: number
  }>,
  config: ReportConfig,
  previousPeriodLeads?: typeof leads
): LeadsReport {
  const { dateRange, interval } = config

  // Total and new leads
  const totalLeads = leads.length
  const newLeadsThisPeriod = leads.filter(
    l => l.createdAt >= dateRange.start && l.createdAt <= dateRange.end
  ).length

  // Leads over time
  const leadsTimeSeries = leads.map(l => ({
    timestamp: l.createdAt,
    value: 1,
  }))
  const aggregatedTimeSeries = aggregateTimeSeries(leadsTimeSeries, interval, 'count')
  const filledTimeSeries = fillMissingDataPoints(
    aggregatedTimeSeries,
    dateRange.start,
    dateRange.end,
    interval
  )

  const leadsOverTime = formatForLineChart(
    [{ label: 'Leads', points: filledTimeSeries, color: '#3b82f6' }],
    dateRange.start,
    dateRange.end,
    interval
  )

  // Leads by source
  const sourceGroups = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const leadsBySource = formatForPieChart(
    Object.entries(sourceGroups).map(([label, value]) => ({ label, value }))
  )

  // Leads by status
  const statusGroups = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const leadsByStatus = formatForBarChart(
    Object.entries(statusGroups).map(([label, value]) => ({ label, value }))
  )

  // Conversion funnel
  const funnelSteps = [
    { name: 'Total Leads', count: leads.length },
    { name: 'Contacted', count: leads.filter(l => ['contacted', 'qualified', 'converted'].includes(l.status)).length },
    { name: 'Qualified', count: leads.filter(l => ['qualified', 'converted'].includes(l.status)).length },
    { name: 'Converted', count: leads.filter(l => l.status === 'converted').length },
  ]
  const conversionFunnel = calculateFunnel(funnelSteps)

  // Top leads by intent score
  const sortedLeads = [...leads].sort((a, b) => b.intentScore - a.intentScore).slice(0, 10)
  const topLeads = formatForTable(
    sortedLeads,
    [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'company', label: 'Company', sortable: true },
      { key: 'intentScore', label: 'Intent Score', align: 'right', sortable: true },
      { key: 'status', label: 'Status' },
    ]
  )

  // Trend calculation
  const previousCount = previousPeriodLeads?.length || 0
  const trend = calculateTrend(newLeadsThisPeriod, previousCount)

  return {
    totalLeads,
    newLeadsThisPeriod,
    leadsOverTime,
    leadsBySource,
    leadsByStatus,
    conversionFunnel,
    topLeads,
    trend,
  }
}

export interface QueriesReport {
  totalQueries: number
  creditsUsed: number
  queriesOverTime: LineChartData
  queriesByStatus: PieChartData
  avgResultsPerQuery: number
  topQueries: TableData
  trend: TrendData
}

export function generateQueriesReport(
  queries: Array<{
    id: string
    name: string
    status: string
    resultCount: number
    creditsUsed: number
    createdAt: Date
    completedAt?: Date
  }>,
  config: ReportConfig,
  previousPeriodQueries?: typeof queries
): QueriesReport {
  const { dateRange, interval } = config

  // Totals
  const totalQueries = queries.length
  const creditsUsed = queries.reduce((sum, q) => sum + q.creditsUsed, 0)

  // Queries over time
  const queriesTimeSeries = queries.map(q => ({
    timestamp: q.createdAt,
    value: 1,
  }))
  const aggregatedTimeSeries = aggregateTimeSeries(queriesTimeSeries, interval, 'count')
  const filledTimeSeries = fillMissingDataPoints(
    aggregatedTimeSeries,
    dateRange.start,
    dateRange.end,
    interval
  )

  const queriesOverTime = formatForLineChart(
    [{ label: 'Queries', points: filledTimeSeries, color: '#10b981' }],
    dateRange.start,
    dateRange.end,
    interval
  )

  // Queries by status
  const statusGroups = queries.reduce((acc, query) => {
    acc[query.status] = (acc[query.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const queriesByStatus = formatForPieChart(
    Object.entries(statusGroups).map(([label, value]) => ({ label, value }))
  )

  // Average results
  const avgResultsPerQuery = queries.length > 0
    ? queries.reduce((sum, q) => sum + q.resultCount, 0) / queries.length
    : 0

  // Top queries by result count
  const sortedQueries = [...queries].sort((a, b) => b.resultCount - a.resultCount).slice(0, 10)
  const topQueries = formatForTable(
    sortedQueries,
    [
      { key: 'name', label: 'Query Name', sortable: true },
      { key: 'status', label: 'Status' },
      { key: 'resultCount', label: 'Results', align: 'right', sortable: true },
      { key: 'creditsUsed', label: 'Credits', align: 'right', sortable: true },
    ]
  )

  // Trend
  const previousCount = previousPeriodQueries?.length || 0
  const trend = calculateTrend(totalQueries, previousCount)

  return {
    totalQueries,
    creditsUsed,
    queriesOverTime,
    queriesByStatus,
    avgResultsPerQuery,
    topQueries,
    trend,
  }
}

export interface UsageReport {
  totalCredits: number
  creditsUsed: number
  creditsRemaining: number
  usagePercentage: number
  usageOverTime: LineChartData
  usageByFeature: PieChartData
  projectedExhaustion?: Date
  trend: TrendData
}

export function generateUsageReport(
  usage: Array<{
    date: Date
    feature: string
    creditsUsed: number
  }>,
  totalCredits: number,
  config: ReportConfig,
  previousPeriodUsage?: typeof usage
): UsageReport {
  const { dateRange, interval } = config

  // Totals
  const creditsUsed = usage.reduce((sum, u) => sum + u.creditsUsed, 0)
  const creditsRemaining = Math.max(0, totalCredits - creditsUsed)
  const usagePercentage = totalCredits > 0 ? (creditsUsed / totalCredits) * 100 : 0

  // Usage over time
  const usageTimeSeries = usage.map(u => ({
    timestamp: u.date,
    value: u.creditsUsed,
  }))
  const aggregatedTimeSeries = aggregateTimeSeries(usageTimeSeries, interval, 'sum')
  const filledTimeSeries = fillMissingDataPoints(
    aggregatedTimeSeries,
    dateRange.start,
    dateRange.end,
    interval
  )

  const usageOverTime = formatForLineChart(
    [{ label: 'Credits Used', points: filledTimeSeries, color: '#f59e0b' }],
    dateRange.start,
    dateRange.end,
    interval
  )

  // Usage by feature
  const featureGroups = usage.reduce((acc, u) => {
    acc[u.feature] = (acc[u.feature] || 0) + u.creditsUsed
    return acc
  }, {} as Record<string, number>)

  const usageByFeature = formatForPieChart(
    Object.entries(featureGroups).map(([label, value]) => ({ label, value }))
  )

  // Projected exhaustion
  let projectedExhaustion: Date | undefined
  if (creditsUsed > 0 && creditsRemaining > 0) {
    const periodDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    const dailyRate = creditsUsed / periodDays
    const daysUntilExhaustion = creditsRemaining / dailyRate
    projectedExhaustion = new Date(Date.now() + daysUntilExhaustion * 24 * 60 * 60 * 1000)
  }

  // Trend
  const previousCreditsUsed = previousPeriodUsage?.reduce((sum, u) => sum + u.creditsUsed, 0) || 0
  const trend = calculateTrend(creditsUsed, previousCreditsUsed)

  return {
    totalCredits,
    creditsUsed,
    creditsRemaining,
    usagePercentage,
    usageOverTime,
    usageByFeature,
    projectedExhaustion,
    trend,
  }
}

// ============================================
// EXPORT UTILITIES
// ============================================

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  filename: string
  includeHeaders?: boolean
  columns?: string[]
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: Omit<ExportOptions, 'format'>
): string {
  if (data.length === 0) return ''

  const columns = options.columns || Object.keys(data[0])
  const rows: string[] = []

  if (options.includeHeaders !== false) {
    rows.push(columns.join(','))
  }

  for (const item of data) {
    const values = columns.map(col => {
      const value = item[col]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return String(value)
    })
    rows.push(values.join(','))
  }

  return rows.join('\n')
}

export function exportToJSON<T>(data: T[], _options: Omit<ExportOptions, 'format'>): string {
  return JSON.stringify(data, null, 2)
}

export function generateReportFilename(
  reportName: string,
  dateRange: { start: Date; end: Date },
  format: string
): string {
  const startStr = dateRange.start.toISOString().split('T')[0]
  const endStr = dateRange.end.toISOString().split('T')[0]
  const sanitizedName = reportName.toLowerCase().replace(/\s+/g, '-')
  return `${sanitizedName}_${startStr}_${endStr}.${format}`
}
