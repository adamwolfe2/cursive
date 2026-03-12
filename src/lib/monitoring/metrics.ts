/**
 * Performance Metrics Tracking
 * Tracks key business and technical metrics
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface MetricData {
  name: string
  value: number
  unit: 'count' | 'ms' | 'bytes' | 'percent' | 'dollars'
  tags?: Record<string, string>
  timestamp?: Date
}

class Metrics {
  private buffer: MetricData[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Flush metrics every 60 seconds in production
    if (process.env.NODE_ENV === 'production') {
      this.flushInterval = setInterval(() => this.flush(), 60000)
    }
  }

  /**
   * Record a metric
   */
  record(metric: MetricData): void {
    this.buffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    })

    // Flush if buffer gets too large
    if (this.buffer.length >= 100) {
      this.flush()
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      unit: 'count',
      tags,
    })
  }

  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value: durationMs,
      unit: 'ms',
      tags,
    })
  }

  /**
   * Record a gauge (current value)
   */
  gauge(name: string, value: number, unit: MetricData['unit'] = 'count', tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      unit,
      tags,
    })
  }

  /**
   * Flush buffered metrics to storage
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const metricsToFlush = [...this.buffer]
    this.buffer = []

    try {
      const supabase = createAdminClient()

      // Store metrics in database
      const { error } = await supabase.from('platform_metrics').insert(
        metricsToFlush.map(m => ({
          metric_name: m.name,
          metric_value: m.value,
          metric_unit: m.unit,
          tags: m.tags || {},
          created_at: m.timestamp?.toISOString(),
        }))
      )

      if (error) {
        safeError('Failed to flush metrics:', error)
        // Re-add to buffer for retry
        this.buffer.unshift(...metricsToFlush)
      }
    } catch (error) {
      safeError('Metrics flush error:', error)
    }
  }

  /**
   * Track API performance
   */
  trackApiCall(endpoint: string, method: string, durationMs: number, statusCode: number): void {
    this.timing('api.request.duration', durationMs, {
      endpoint,
      method,
      status: String(statusCode),
    })

    this.increment('api.request.count', 1, {
      endpoint,
      method,
      status: String(statusCode),
    })

    if (statusCode >= 500) {
      this.increment('api.error.count', 1, {
        endpoint,
        method,
      })
    }
  }

  /**
   * Track business metrics
   */
  trackPurchase(amount: number, type: 'lead' | 'credits' | 'campaign'): void {
    this.gauge('purchase.amount', amount, 'dollars', { type })
    this.increment('purchase.count', 1, { type })
  }

  trackUpload(leadCount: number, partnerId: string): void {
    this.gauge('upload.lead_count', leadCount, 'count', { partnerId })
    this.increment('upload.count', 1, { partnerId })
  }

  trackPayout(amount: number, status: 'completed' | 'failed'): void {
    this.gauge('payout.amount', amount, 'dollars', { status })
    this.increment('payout.count', 1, { status })
  }
}

export const metrics = new Metrics()
