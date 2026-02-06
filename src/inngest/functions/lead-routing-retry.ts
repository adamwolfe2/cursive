/**
 * Lead Routing Retry Queue Processor
 * Inngest Functions
 *
 * Handles:
 * - Processing failed routing attempts with exponential backoff
 * - Cleanup of stale routing locks
 * - Marking expired leads (90-day TTL)
 */

import { inngest } from '../client'
import { LeadRoutingService } from '@/lib/services/lead-routing.service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

/**
 * Process lead routing retry queue
 *
 * Runs every 5 minutes to process leads that failed routing and are ready for retry.
 * Uses exponential backoff: 1min, 5min, 15min, 1hr
 */
export const processLeadRoutingRetryQueue = inngest.createFunction(
  {
    id: 'lead-routing-retry-queue-processor',
    name: 'Process Lead Routing Retry Queue',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step, logger }) => {
    const result = await step.run('process-retry-queue', async () => {
      logger.info('Processing lead routing retry queue')

      const processingResult = await LeadRoutingService.processRetryQueue(100)

      logger.info('Retry queue processing complete', {
        processed: processingResult.processed,
        succeeded: processingResult.succeeded,
        failed: processingResult.failed,
      })

      return processingResult
    })

    // Log errors if any
    if (result.errors.length > 0) {
      await step.run('log-errors', async () => {
        logger.warn('Some leads failed during retry', {
          errorCount: result.errors.length,
          errors: result.errors.slice(0, 10), // Log first 10 errors
        })
      })
    }

    return {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errorCount: result.errors.length,
    }
  }
)

/**
 * Manual trigger for retry queue processing
 *
 * Allows immediate processing of retry queue without waiting for cron.
 */
export const triggerLeadRoutingRetry = inngest.createFunction(
  {
    id: 'lead-routing-retry-manual-trigger',
    name: 'Manual Lead Routing Retry',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { event: 'lead/routing.retry.trigger' },
  async ({ event, step, logger }) => {
    const { limit = 100 } = event.data

    logger.info('Manual retry queue processing triggered', { limit })

    const result = await step.run('process-retry-queue', async () => {
      return await LeadRoutingService.processRetryQueue(limit)
    })

    return {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errorCount: result.errors.length,
    }
  }
)

/**
 * Cleanup stale routing locks
 *
 * Runs every 10 minutes to release locks held for > 5 minutes.
 * Prevents leads from getting stuck in 'routing' state.
 */
export const cleanupStaleRoutingLocks = inngest.createFunction(
  {
    id: 'lead-routing-cleanup-stale-locks',
    name: 'Cleanup Stale Routing Locks',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { cron: '*/10 * * * *' }, // Every 10 minutes
  async ({ step, logger }) => {
    logger.info('Cleaning up stale routing locks')

    const result = await step.run('release-stale-locks', async () => {
      return await LeadRoutingService.cleanupStaleLocks()
    })

    if (result.released > 0) {
      logger.warn('Released stale routing locks', {
        count: result.released,
      })
    }

    return { released: result.released }
  }
)

/**
 * Mark expired leads
 *
 * Runs daily at 2 AM to mark leads older than 90 days as expired.
 * Expired leads are excluded from routing and analytics.
 */
export const markExpiredLeads = inngest.createFunction(
  {
    id: 'lead-routing-mark-expired-leads',
    name: 'Mark Expired Leads',
    retries: 3,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 2 * * *' }, // Daily at 2 AM
  async ({ step, logger }) => {
    logger.info('Marking expired leads (90-day TTL)')

    const result = await step.run('mark-expired', async () => {
      return await LeadRoutingService.markExpiredLeads()
    })

    if (result.expired > 0) {
      logger.info('Marked expired leads', {
        count: result.expired,
      })
    }

    return { expired: result.expired }
  }
)

/**
 * Routing health check
 *
 * Runs every hour to check routing health across all workspaces.
 * Alerts if critical issues detected (high failure rate, stale locks, etc.)
 */
export const leadRoutingHealthCheck = inngest.createFunction(
  {
    id: 'lead-routing-health-check',
    name: 'Lead Routing Health Check',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ event, step, logger }) => {
    const { workspaceId } = event.data || {}

    if (!workspaceId) {
      logger.warn('No workspaceId provided for health check')
      return { skipped: true }
    }

    const health = await step.run('check-routing-health', async () => {
      return await LeadRoutingService.getRoutingHealth(workspaceId)
    })

    // Alert on critical issues
    const alerts = []

    if (health.staleLockCount > 10) {
      alerts.push({
        severity: 'critical',
        message: `High number of stale routing locks: ${health.staleLockCount}`,
      })
    }

    if (health.failedCount > 100) {
      alerts.push({
        severity: 'warning',
        message: `High number of failed routing attempts: ${health.failedCount}`,
      })
    }

    if (health.retryQueueCount > 500) {
      alerts.push({
        severity: 'warning',
        message: `Large retry queue backlog: ${health.retryQueueCount}`,
      })
    }

    if (alerts.length > 0) {
      await step.run('send-alerts', async () => {
        logger.error('Lead routing health issues detected', {
          workspace_id: workspaceId,
          health,
          alerts,
        })
        // FUTURE: Send alerts to Slack or monitoring system
        // Use existing Slack alerting system from src/lib/monitoring/slack.ts
      })
    }

    return {
      workspaceId,
      health,
      alerts,
    }
  }
)
