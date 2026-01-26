/**
 * Enrichment Queue Service
 * Cursive Platform
 *
 * Manages the enrichment pipeline with:
 * - Priority-based queue processing
 * - Multiple enrichment sources
 * - Rate limiting per provider
 * - Retry logic with exponential backoff
 * - Enrichment logging and analytics
 */

import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'

// ============================================================================
// TYPES
// ============================================================================

export type EnrichmentProvider =
  | 'clay'
  | 'clearbit'
  | 'apollo'
  | 'zoominfo'
  | 'email_validation'
  | 'ai_analysis'
  | 'web_scrape'

export type EnrichmentPriority = 'critical' | 'high' | 'normal' | 'low'

export type EnrichmentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'partial'

export interface EnrichmentJob {
  id: string
  leadId: string
  workspaceId: string
  provider: EnrichmentProvider
  priority: EnrichmentPriority
  status: EnrichmentStatus
  attempts: number
  maxAttempts: number
  data: Record<string, any>
  result?: Record<string, any>
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  nextRetryAt?: string
}

export interface EnrichmentConfig {
  providers: EnrichmentProvider[]
  priority: EnrichmentPriority
  maxRetries: number
  webhookUrl?: string
}

export interface EnrichmentResult {
  provider: EnrichmentProvider
  success: boolean
  data?: Record<string, any>
  error?: string
  creditsUsed?: number
  duration: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_ORDER: Record<EnrichmentPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

const RATE_LIMITS: Record<EnrichmentProvider, { requestsPerMinute: number; requestsPerDay: number }> = {
  clay: { requestsPerMinute: 60, requestsPerDay: 10000 },
  clearbit: { requestsPerMinute: 100, requestsPerDay: 50000 },
  apollo: { requestsPerMinute: 50, requestsPerDay: 5000 },
  zoominfo: { requestsPerMinute: 30, requestsPerDay: 2000 },
  email_validation: { requestsPerMinute: 200, requestsPerDay: 100000 },
  ai_analysis: { requestsPerMinute: 20, requestsPerDay: 5000 },
  web_scrape: { requestsPerMinute: 10, requestsPerDay: 1000 },
}

const RETRY_DELAYS = [60, 300, 900, 3600] // 1min, 5min, 15min, 1hr

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Add a lead to the enrichment queue
 */
export async function queueEnrichment(
  leadId: string,
  workspaceId: string,
  config: EnrichmentConfig
): Promise<string[]> {
  const supabase = await createClient()
  const jobIds: string[] = []

  // Create a job for each provider
  for (const provider of config.providers) {
    const { data: job, error } = await supabase
      .from('enrichment_jobs')
      .insert({
        lead_id: leadId,
        workspace_id: workspaceId,
        provider,
        priority: config.priority,
        status: 'pending',
        attempts: 0,
        max_attempts: config.maxRetries,
        data: { webhook_url: config.webhookUrl },
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Failed to queue enrichment job: ${error.message}`)
      continue
    }

    jobIds.push(job.id)

    // Trigger Inngest to process the job
    await inngest.send({
      name: 'enrichment/process',
      data: {
        job_id: job.id,
        lead_id: leadId,
        workspace_id: workspaceId,
        provider,
        priority: config.priority,
      },
    })
  }

  return jobIds
}

/**
 * Get next jobs to process based on priority and rate limits
 */
export async function getNextJobs(
  workspaceId: string,
  limit: number = 10
): Promise<EnrichmentJob[]> {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from('enrichment_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .or('next_retry_at.is.null,next_retry_at.lte.now()')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error(`Failed to get enrichment jobs: ${error.message}`)
    return []
  }

  return jobs.map(mapDbJobToEnrichmentJob)
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: EnrichmentStatus,
  result?: Record<string, any>,
  error?: string
): Promise<void> {
  const supabase = await createClient()

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString()
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (result) {
    updateData.result = result
  }

  if (error) {
    updateData.error = error
  }

  await supabase
    .from('enrichment_jobs')
    .update(updateData)
    .eq('id', jobId)
}

/**
 * Schedule retry for failed job
 */
export async function scheduleRetry(job: EnrichmentJob): Promise<boolean> {
  if (job.attempts >= job.maxAttempts) {
    await updateJobStatus(job.id, 'failed', undefined, 'Max retries exceeded')
    return false
  }

  const supabase = await createClient()
  const retryDelay = RETRY_DELAYS[Math.min(job.attempts, RETRY_DELAYS.length - 1)]
  const nextRetryAt = new Date(Date.now() + retryDelay * 1000).toISOString()

  await supabase
    .from('enrichment_jobs')
    .update({
      status: 'pending',
      attempts: job.attempts + 1,
      next_retry_at: nextRetryAt,
    })
    .eq('id', job.id)

  return true
}

// ============================================================================
// ENRICHMENT ORCHESTRATION
// ============================================================================

/**
 * Orchestrate full enrichment for a lead
 */
export async function enrichLead(
  leadId: string,
  workspaceId: string,
  options: {
    providers?: EnrichmentProvider[]
    priority?: EnrichmentPriority
    waitForCompletion?: boolean
  } = {}
): Promise<{
  queued: boolean
  jobIds: string[]
  results?: Record<EnrichmentProvider, EnrichmentResult>
}> {
  const {
    providers = ['email_validation', 'ai_analysis', 'clay'],
    priority = 'normal',
    waitForCompletion = false,
  } = options

  // Queue all enrichment jobs
  const jobIds = await queueEnrichment(leadId, workspaceId, {
    providers,
    priority,
    maxRetries: 3,
  })

  if (!waitForCompletion) {
    return { queued: true, jobIds }
  }

  // Poll for completion (with timeout)
  const results = await waitForEnrichmentCompletion(jobIds, 60000) // 60 second timeout

  return { queued: true, jobIds, results }
}

/**
 * Wait for enrichment jobs to complete
 */
async function waitForEnrichmentCompletion(
  jobIds: string[],
  timeoutMs: number
): Promise<Record<EnrichmentProvider, EnrichmentResult>> {
  const supabase = await createClient()
  const startTime = Date.now()
  const results: Record<string, EnrichmentResult> = {}

  while (Date.now() - startTime < timeoutMs) {
    const { data: jobs } = await supabase
      .from('enrichment_jobs')
      .select('*')
      .in('id', jobIds)

    if (!jobs) break

    let allComplete = true

    for (const job of jobs) {
      if (job.status === 'pending' || job.status === 'in_progress') {
        allComplete = false
        continue
      }

      results[job.provider] = {
        provider: job.provider,
        success: job.status === 'completed',
        data: job.result,
        error: job.error,
        duration: job.completed_at
          ? new Date(job.completed_at).getTime() - new Date(job.started_at || job.created_at).getTime()
          : 0,
      }
    }

    if (allComplete) {
      return results as Record<EnrichmentProvider, EnrichmentResult>
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return results as Record<EnrichmentProvider, EnrichmentResult>
}

// ============================================================================
// BATCH ENRICHMENT
// ============================================================================

/**
 * Queue enrichment for multiple leads
 */
export async function queueBatchEnrichment(
  leads: Array<{ leadId: string; workspaceId: string }>,
  config: EnrichmentConfig
): Promise<{ totalQueued: number; failedToQueue: number }> {
  let totalQueued = 0
  let failedToQueue = 0

  // Process in batches to avoid overwhelming the queue
  const batchSize = 50

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map((lead) =>
        queueEnrichment(lead.leadId, lead.workspaceId, config)
      )
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        totalQueued++
      } else {
        failedToQueue++
      }
    }

    // Small delay between batches
    if (i + batchSize < leads.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return { totalQueued, failedToQueue }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get enrichment statistics for a workspace
 */
export async function getEnrichmentStats(
  workspaceId: string,
  days: number = 30
): Promise<{
  totalJobs: number
  completed: number
  failed: number
  pending: number
  byProvider: Record<EnrichmentProvider, { total: number; success: number; failed: number }>
  avgDuration: number
  successRate: number
}> {
  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs } = await supabase
    .from('enrichment_jobs')
    .select('provider, status, started_at, completed_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startDate)

  if (!jobs || jobs.length === 0) {
    return {
      totalJobs: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      byProvider: {} as any,
      avgDuration: 0,
      successRate: 0,
    }
  }

  const stats = {
    totalJobs: jobs.length,
    completed: 0,
    failed: 0,
    pending: 0,
    byProvider: {} as Record<EnrichmentProvider, { total: number; success: number; failed: number }>,
    totalDuration: 0,
    durationCount: 0,
  }

  for (const job of jobs) {
    // Count by status
    if (job.status === 'completed') stats.completed++
    else if (job.status === 'failed') stats.failed++
    else stats.pending++

    // Count by provider
    if (!stats.byProvider[job.provider as EnrichmentProvider]) {
      stats.byProvider[job.provider as EnrichmentProvider] = { total: 0, success: 0, failed: 0 }
    }
    stats.byProvider[job.provider as EnrichmentProvider].total++
    if (job.status === 'completed') {
      stats.byProvider[job.provider as EnrichmentProvider].success++
    } else if (job.status === 'failed') {
      stats.byProvider[job.provider as EnrichmentProvider].failed++
    }

    // Calculate duration
    if (job.started_at && job.completed_at) {
      const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
      stats.totalDuration += duration
      stats.durationCount++
    }
  }

  return {
    totalJobs: stats.totalJobs,
    completed: stats.completed,
    failed: stats.failed,
    pending: stats.pending,
    byProvider: stats.byProvider,
    avgDuration: stats.durationCount > 0 ? stats.totalDuration / stats.durationCount : 0,
    successRate: stats.totalJobs > 0 ? (stats.completed / stats.totalJobs) * 100 : 0,
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function mapDbJobToEnrichmentJob(dbJob: any): EnrichmentJob {
  return {
    id: dbJob.id,
    leadId: dbJob.lead_id,
    workspaceId: dbJob.workspace_id,
    provider: dbJob.provider,
    priority: dbJob.priority,
    status: dbJob.status,
    attempts: dbJob.attempts,
    maxAttempts: dbJob.max_attempts,
    data: dbJob.data || {},
    result: dbJob.result,
    error: dbJob.error,
    createdAt: dbJob.created_at,
    startedAt: dbJob.started_at,
    completedAt: dbJob.completed_at,
    nextRetryAt: dbJob.next_retry_at,
  }
}

/**
 * Check if we're within rate limits for a provider
 */
export async function checkRateLimit(
  workspaceId: string,
  provider: EnrichmentProvider
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = await createClient()
  const limits = RATE_LIMITS[provider]

  // Check per-minute limit
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
  const { count: minuteCount } = await supabase
    .from('enrichment_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .gte('started_at', oneMinuteAgo)

  if ((minuteCount || 0) >= limits.requestsPerMinute) {
    return { allowed: false, retryAfter: 60 }
  }

  // Check per-day limit
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const { count: dayCount } = await supabase
    .from('enrichment_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .gte('started_at', oneDayAgo)

  if ((dayCount || 0) >= limits.requestsPerDay) {
    return { allowed: false, retryAfter: 3600 }
  }

  return { allowed: true }
}
