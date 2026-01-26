/**
 * Retry Failed Jobs
 * Processes failed jobs queue and retries them
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import {
  getJobsForRetry,
  markRetrySuccess,
  markRetryFailed,
  cleanupOldJobs,
} from '@/lib/services/error-handling.service'

/**
 * Process retry queue every 5 minutes
 */
export const processRetryQueue = inngest.createFunction(
  {
    id: 'process-retry-queue',
    name: 'Process Failed Jobs Retry Queue',
    retries: 1, // Don't retry the retry processor itself
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step, logger }) => {
    // Get jobs ready for retry
    const jobs = await step.run('get-jobs-for-retry', async () => {
      return await getJobsForRetry(20) // Process 20 at a time
    })

    logger.info(`Found ${jobs.length} jobs ready for retry`)

    if (jobs.length === 0) {
      return { success: true, processed: 0 }
    }

    // Process each job
    const results = await step.run('process-jobs', async () => {
      const processed: Array<{
        jobId: string
        jobType: string
        success: boolean
        error?: string
      }> = []

      for (const job of jobs) {
        try {
          // Dispatch based on job type
          const success = await executeRetry(job)

          if (success) {
            await markRetrySuccess(job.id)
            processed.push({ jobId: job.id, jobType: job.jobType, success: true })
          } else {
            await markRetryFailed(job.id, 'Retry execution returned false')
            processed.push({
              jobId: job.id,
              jobType: job.jobType,
              success: false,
              error: 'Execution returned false',
            })
          }
        } catch (error: any) {
          await markRetryFailed(job.id, error.message || 'Unknown error')
          processed.push({
            jobId: job.id,
            jobType: job.jobType,
            success: false,
            error: error.message,
          })
        }
      }

      return processed
    })

    const successCount = results.filter((r) => r.success).length
    logger.info(`Processed ${jobs.length} jobs: ${successCount} succeeded, ${jobs.length - successCount} failed`)

    return {
      success: true,
      processed: jobs.length,
      succeeded: successCount,
      failed: jobs.length - successCount,
      details: results,
    }
  }
)

/**
 * Execute a retry based on job type
 */
async function executeRetry(job: any): Promise<boolean> {
  const payload = job.payload || {}

  switch (job.jobType) {
    case 'email_send':
      // Re-trigger email send
      if (payload.email_send_id) {
        await inngest.send({
          name: 'campaign/send-email',
          data: {
            email_send_id: payload.email_send_id,
            campaign_lead_id: payload.campaign_lead_id,
            workspace_id: job.workspaceId,
          },
        })
        return true
      }
      break

    case 'enrichment':
      // Re-trigger enrichment
      if (payload.lead_id) {
        await inngest.send({
          name: 'lead/enrich',
          data: {
            lead_id: payload.lead_id,
            workspace_id: job.workspaceId,
          },
        })
        return true
      }
      break

    case 'webhook_delivery':
      // Re-trigger webhook
      if (payload.webhook_url && payload.webhook_data) {
        await inngest.send({
          name: 'webhook/deliver',
          data: {
            url: payload.webhook_url,
            data: payload.webhook_data,
            workspace_id: job.workspaceId,
          },
        })
        return true
      }
      break

    case 'campaign_compose':
      // Re-trigger composition
      if (payload.campaign_lead_id) {
        await inngest.send({
          name: 'campaign/compose-email',
          data: {
            campaign_lead_id: payload.campaign_lead_id,
            campaign_id: payload.campaign_id,
            lead_id: payload.lead_id,
            workspace_id: job.workspaceId,
          },
        })
        return true
      }
      break

    default:
      // Unknown job type - can't retry automatically
      console.warn(`Unknown job type for retry: ${job.jobType}`)
      return false
  }

  return false
}

/**
 * Clean up old resolved jobs daily
 */
export const cleanupFailedJobs = inngest.createFunction(
  {
    id: 'cleanup-failed-jobs',
    name: 'Cleanup Old Failed Jobs',
    retries: 2,
  },
  { cron: '0 3 * * *' }, // Daily at 3 AM UTC
  async ({ step, logger }) => {
    const deleted = await step.run('cleanup', async () => {
      return await cleanupOldJobs()
    })

    logger.info(`Cleaned up ${deleted} old failed job records`)

    return { success: true, deleted }
  }
)

/**
 * Event handler for explicit job retry requests
 */
export const onJobRetryRequested = inngest.createFunction(
  {
    id: 'on-job-retry-requested',
    name: 'Handle Job Retry Request',
  },
  { event: 'job/retry-requested' },
  async ({ event, step, logger }) => {
    const { job_id } = event.data

    logger.info(`Manual retry requested for job ${job_id}`)

    // Get the job
    const job = await step.run('get-job', async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('failed_jobs')
        .select('*')
        .eq('id', job_id)
        .single()
      return data
    })

    if (!job) {
      logger.warn(`Job ${job_id} not found`)
      return { success: false, error: 'Job not found' }
    }

    // Execute retry
    const success = await step.run('execute-retry', async () => {
      try {
        return await executeRetry({
          id: job.id,
          jobType: job.job_type,
          payload: job.payload,
          workspaceId: job.workspace_id,
        })
      } catch (error: any) {
        await markRetryFailed(job.id, error.message)
        return false
      }
    })

    if (success) {
      await step.run('mark-success', async () => {
        await markRetrySuccess(job.id)
      })
    }

    return { success, job_id }
  }
)
