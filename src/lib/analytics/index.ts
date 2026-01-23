/**
 * Analytics Library Index
 * OpenInfo Platform
 *
 * Export all analytics utilities, reports, and hooks.
 */

// Metrics utilities
export {
  // Types
  type DataPoint,
  type TimeSeriesData,
  type TimeInterval,
  type AggregatedMetric,
  type TrendData,
  type MetricComparison,
  type BucketedData,
  type FunnelStep,
  type CohortData,

  // Time utilities
  getStartOfPeriod,
  getEndOfPeriod,
  getPreviousPeriod,
  generateDateRange,
  formatDateByInterval,

  // Aggregation functions
  calculateSum,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
  calculatePercentile,
  aggregateMetrics,

  // Trend analysis
  calculateTrend,
  compareMetrics,

  // Time series
  groupByInterval,
  aggregateTimeSeries,
  fillMissingDataPoints,

  // Bucketing
  bucketByRange,
  bucketByValue,
  calculateDistribution,

  // Growth metrics
  calculateGrowthRate,
  calculateCompoundGrowthRate,
  calculateMovingAverage,
  calculateExponentialMovingAverage,

  // Funnel & Cohort
  calculateFunnel,
  calculateCohortRetention,
} from './metrics'

// Report utilities
export {
  // Types
  type ReportConfig,
  type ReportSection,
  type Report,
  type ReportSummary,
  type LineChartData,
  type BarChartData,
  type PieChartData,
  type TableData,
  type LeadsReport,
  type QueriesReport,
  type UsageReport,
  type ExportOptions,

  // Chart formatters
  formatForLineChart,
  formatForBarChart,
  formatForPieChart,

  // Table formatter
  formatForTable,

  // Report generators
  generateLeadsReport,
  generateQueriesReport,
  generateUsageReport,

  // Export utilities
  exportToCSV,
  exportToJSON,
  generateReportFilename,
} from './reports'

// React hooks
export {
  // Types
  type DateRangePreset,
  type DateRange,
  type UseMetricsOptions,
  type UseMetricsResult,
  type ComparisonData,
  type RealtimeMetric,
  type DashboardAnalytics,

  // Hooks
  useDateRange,
  useTimeInterval,
  useMetrics,
  useComparison,
  useLeadsReport,
  useQueriesReport,
  useUsageReport,
  useRealtimeMetrics,
  useDashboardAnalytics,
} from './hooks'
