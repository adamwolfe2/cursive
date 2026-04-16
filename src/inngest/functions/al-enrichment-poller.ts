/**
 * AudienceLab Batch Enrichment Poller
 *
 * Cron: every 5 minutes
 * Polls al_enrichment_jobs rows where status = 'pending' | 'processing',
 * downloads the CSV when complete, parses it, and updates the corresponding
 * leads in the workspace with the enriched data.
 *
 * This supports the manual "batch enrich existing leads" workflow where an
 * admin submits a CSV of leads to AL and we pick up the results automatically.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBatchEnrichmentStatus } from '@/lib/audiencelab/api-client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Enrichment Poller]'
const MAX_JOBS_PER_RUN = 20

export const alEnrichmentPoller = inngest.createFunction(
  {
    id: 'al-enrichment-poller',
    name: 'AudienceLab Batch Enrichment Poller',
    retries: 0,
    timeouts: { finish: '4m' },
    concurrency: { limit: 1 },
  },
  // Every 5 minutes
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
      return { skipped: true, reason: 'no_api_key' }
    }

    // Step 1: Load pending/processing jobs
    const pendingJobs = await step.run('load-pending-jobs', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('al_enrichment_jobs')
        .select('id, workspace_id, al_job_id, status, total_submitted')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true })
        .limit(MAX_JOBS_PER_RUN)

      if (error) {
        safeError(`${LOG_PREFIX} Failed to load pending jobs:`, error)
        return []
      }

      return data || []
    })

    if (pendingJobs.length === 0) {
      return { polled: 0, completed: 0, message: 'No pending enrichment jobs' }
    }

    safeLog(`${LOG_PREFIX} Polling ${pendingJobs.length} pending enrichment jobs`)

    let polled = 0
    let completed = 0

    for (const job of pendingJobs) {
      await step.run(`poll-job-${job.id}`, async () => {
        const supabase = createAdminClient()
        polled++

        try {
          const status = await getBatchEnrichmentStatus(job.al_job_id)
          const now = new Date().toISOString()

          if (status.status === 'completed') {
            completed++
            safeLog(`${LOG_PREFIX} Job ${job.al_job_id} complete — ${status.processed || 0} records enriched`)

            // Update job record with completion info
            await supabase
              .from('al_enrichment_jobs')
              .update({
                status: 'completed',
                total_enriched: status.processed || status.total || 0,
                download_url: status.download_url || null,
                last_polled_at: now,
              })
              .eq('id', job.id)

            // If there's a download URL, trigger async CSV processing
            if (status.download_url) {
              await inngest.send({
                name: 'al/enrichment-job-completed',
                data: {
                  jobId: job.id,
                  workspaceId: job.workspace_id,
                  alJobId: job.al_job_id,
                  downloadUrl: status.download_url,
                  totalEnriched: status.processed || status.total || 0,
                },
              })
            }
          } else if (status.status === 'failed') {
            safeLog(`${LOG_PREFIX} Job ${job.al_job_id} failed`)
            await supabase
              .from('al_enrichment_jobs')
              .update({
                status: 'failed',
                error_message: 'AL API reported job failure',
                last_polled_at: now,
              })
              .eq('id', job.id)
          } else {
            // Still pending or processing — update last_polled_at only
            await supabase
              .from('al_enrichment_jobs')
              .update({
                status: status.status || job.status,
                last_polled_at: now,
              })
              .eq('id', job.id)
          }
        } catch (err) {
          safeError(`${LOG_PREFIX} Failed to poll job ${job.al_job_id}:`, err)
          // Don't mark as failed — a transient poll error shouldn't kill the job
        }
      })
    }

    return { polled, completed }
  }
)
