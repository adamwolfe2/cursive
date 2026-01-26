/**
 * Error Handling Service
 * Manages failed job tracking, retry logic, and error reporting
 */

import { createClient } from '@/lib/supabase/server'

export type ErrorType =
  | 'timeout'
  | 'rate_limit'
  | 'api_error'
  | 'validation'
  | 'network'
  | 'database'
  | 'authentication'
  | 'permission'
  | 'not_found'
  | 'unknown'

export type JobStatus = 'failed' | 'pending_retry' | 'retrying' | 'resolved' | 'abandoned'

export interface FailedJob {
  id: string
  workspaceId: string | null
  jobType: string
  jobId: string | null
  jobName: string | null
  relatedType: string | null
  relatedId: string | null
  errorType: ErrorType
  errorCode: string | null
  errorMessage: string
  errorStack: string | null
  payload: Record<string, any>
  attempts: number
  maxAttempts: number
  lastAttemptAt: string
  nextRetryAt: string | null
  status: JobStatus
  resolvedAt: string | null
  resolvedBy: string | null
  resolutionNotes: string | null
  context: Record<string, any>
  createdAt: string
}

export interface ErrorStats {
  errorType: string
  jobType: string
  count: number
  resolvedCount: number
  abandonedCount: number
}

export interface LogFailedJobParams {
  jobType: string
  errorMessage: string
  workspaceId?: string
  jobId?: string
  jobName?: string
  relatedType?: string
  relatedId?: string
  errorType?: ErrorType
  errorCode?: string
  errorStack?: string
  payload?: Record<string, any>
  maxAttempts?: number
  context?: Record<string, any>
}

// ============ Failed Job Management ============

/**
 * Log a failed job
 */
export async function logFailedJob(params: LogFailedJobParams): Promise<string | null> {
  const supabase = await createClient()

  // Try database function
  const { data, error } = await supabase.rpc('log_failed_job', {
    p_job_type: params.jobType,
    p_error_message: params.errorMessage,
    p_workspace_id: params.workspaceId || null,
    p_job_id: params.jobId || null,
    p_job_name: params.jobName || null,
    p_related_type: params.relatedType || null,
    p_related_id: params.relatedId || null,
    p_error_type: params.errorType || 'unknown',
    p_error_code: params.errorCode || null,
    p_error_stack: params.errorStack || null,
    p_payload: params.payload || {},
    p_max_attempts: params.maxAttempts || 5,
    p_context: params.context || {},
  })

  if (error) {
    console.error('Failed to log failed job:', error.message)

    // Fallback to direct insert
    const { data: insertData, error: insertError } = await supabase
      .from('failed_jobs')
      .insert({
        workspace_id: params.workspaceId,
        job_type: params.jobType,
        job_id: params.jobId,
        job_name: params.jobName,
        related_type: params.relatedType,
        related_id: params.relatedId,
        error_type: params.errorType || 'unknown',
        error_code: params.errorCode,
        error_message: params.errorMessage,
        error_stack: params.errorStack,
        payload: params.payload || {},
        max_attempts: params.maxAttempts || 5,
        status: 'pending_retry',
        next_retry_at: new Date(Date.now() + 60000).toISOString(), // 1 minute
        context: params.context || {},
      })
      .select('id')
      .single()

    return insertError ? null : insertData.id
  }

  return data
}

/**
 * Get failed jobs for a workspace
 */
export async function getFailedJobs(
  workspaceId: string | null,
  filters: {
    status?: JobStatus | JobStatus[]
    jobType?: string
    errorType?: ErrorType
  } = {},
  pagination: { page?: number; limit?: number } = {}
): Promise<{ jobs: FailedJob[]; total: number }> {
  const supabase = await createClient()

  const page = pagination.page || 1
  const limit = Math.min(pagination.limit || 20, 100)
  const offset = (page - 1) * limit

  let query = supabase.from('failed_jobs').select('*', { count: 'exact' })

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters.jobType) {
    query = query.eq('job_type', filters.jobType)
  }

  if (filters.errorType) {
    query = query.eq('error_type', filters.errorType)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch failed jobs: ${error.message}`)
  }

  return {
    jobs: (data || []).map(mapFailedJob),
    total: count || 0,
  }
}

/**
 * Get jobs ready for retry
 */
export async function getJobsForRetry(limit: number = 50): Promise<FailedJob[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_jobs_for_retry', {
    p_limit: limit,
  })

  if (error) {
    // Fallback to direct query
    const { data: fallbackData } = await supabase
      .from('failed_jobs')
      .select('*')
      .eq('status', 'pending_retry')
      .lte('next_retry_at', new Date().toISOString())
      .lt('attempts', supabase.rpc('greatest', { a: 'max_attempts', b: 5 }) as any)
      .order('next_retry_at', { ascending: true })
      .limit(limit)

    return (fallbackData || []).map(mapFailedJob)
  }

  return (data || []).map((row: any) => ({
    id: row.job_id,
    workspaceId: row.workspace_id,
    jobType: row.job_type,
    payload: row.payload,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    relatedType: row.related_type,
    relatedId: row.related_id,
    // Partial data for retry
    jobId: null,
    jobName: null,
    errorType: 'unknown' as ErrorType,
    errorCode: null,
    errorMessage: '',
    errorStack: null,
    lastAttemptAt: new Date().toISOString(),
    nextRetryAt: null,
    status: 'retrying' as JobStatus,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNotes: null,
    context: {},
    createdAt: '',
  }))
}

/**
 * Mark a retry as successful
 */
export async function markRetrySuccess(jobId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('mark_retry_success', {
    p_job_id: jobId,
  })

  if (error) {
    // Fallback
    await supabase
      .from('failed_jobs')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: 'Resolved via automatic retry',
      })
      .eq('id', jobId)
  }
}

/**
 * Mark a retry as failed
 */
export async function markRetryFailed(jobId: string, errorMessage: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('mark_retry_failed', {
    p_job_id: jobId,
    p_error_message: errorMessage,
  })

  if (error) {
    // Get current job to calculate next retry
    const { data: job } = await supabase
      .from('failed_jobs')
      .select('attempts, max_attempts')
      .eq('id', jobId)
      .single()

    if (job) {
      if (job.attempts >= job.max_attempts) {
        await supabase
          .from('failed_jobs')
          .update({
            status: 'abandoned',
            error_message: errorMessage,
            resolution_notes: 'Max retry attempts exceeded',
          })
          .eq('id', jobId)
      } else {
        // Exponential backoff
        const delayMinutes = Math.min(Math.pow(2, job.attempts), 60)
        const nextRetry = new Date(Date.now() + delayMinutes * 60000)

        await supabase
          .from('failed_jobs')
          .update({
            status: 'pending_retry',
            error_message: errorMessage,
            next_retry_at: nextRetry.toISOString(),
          })
          .eq('id', jobId)
      }
    }
  }
}

/**
 * Manually resolve a failed job
 */
export async function resolveFailedJob(
  jobId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('failed_jobs')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_notes: notes || 'Manually resolved',
    })
    .eq('id', jobId)

  return { success: !error }
}

/**
 * Manually retry a failed job
 */
export async function retryFailedJob(jobId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('failed_jobs')
    .update({
      status: 'pending_retry',
      next_retry_at: new Date().toISOString(), // Immediate retry
    })
    .eq('id', jobId)
    .in('status', ['failed', 'abandoned'])

  return { success: !error }
}

/**
 * Get error statistics
 */
export async function getErrorStats(
  workspaceId: string | null,
  hours: number = 24
): Promise<ErrorStats[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_error_stats', {
    p_workspace_id: workspaceId,
    p_hours: hours,
  })

  if (error) {
    // Fallback to manual aggregation
    const cutoff = new Date(Date.now() - hours * 3600000).toISOString()

    let query = supabase
      .from('failed_jobs')
      .select('error_type, job_type, status')
      .gte('created_at', cutoff)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: jobs } = await query

    // Manual aggregation
    const stats: Record<string, ErrorStats> = {}
    for (const job of jobs || []) {
      const key = `${job.error_type}-${job.job_type}`
      if (!stats[key]) {
        stats[key] = {
          errorType: job.error_type,
          jobType: job.job_type,
          count: 0,
          resolvedCount: 0,
          abandonedCount: 0,
        }
      }
      stats[key].count++
      if (job.status === 'resolved') stats[key].resolvedCount++
      if (job.status === 'abandoned') stats[key].abandonedCount++
    }

    return Object.values(stats).sort((a, b) => b.count - a.count)
  }

  return (data || []).map((row: any) => ({
    errorType: row.error_type,
    jobType: row.job_type,
    count: Number(row.count),
    resolvedCount: Number(row.resolved_count),
    abandonedCount: Number(row.abandoned_count),
  }))
}

/**
 * Clean up old resolved jobs
 */
export async function cleanupOldJobs(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('cleanup_old_failed_jobs')

  return error ? 0 : data || 0
}

// ============ Error Classification ============

/**
 * Classify an error into a type
 */
export function classifyError(error: Error | any): ErrorType {
  const message = error?.message?.toLowerCase() || ''
  const code = error?.code || error?.status

  // Rate limiting
  if (code === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return 'rate_limit'
  }

  // Timeout
  if (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKETTIMEDOUT' ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return 'timeout'
  }

  // Network errors
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ENETUNREACH' ||
    message.includes('network') ||
    message.includes('connection')
  ) {
    return 'network'
  }

  // Authentication
  if (code === 401 || message.includes('unauthorized') || message.includes('authentication')) {
    return 'authentication'
  }

  // Permission
  if (code === 403 || message.includes('forbidden') || message.includes('permission')) {
    return 'permission'
  }

  // Not found
  if (code === 404 || message.includes('not found')) {
    return 'not_found'
  }

  // Validation
  if (code === 400 || message.includes('validation') || message.includes('invalid')) {
    return 'validation'
  }

  // Database
  if (
    message.includes('database') ||
    message.includes('postgres') ||
    message.includes('supabase') ||
    message.includes('sql')
  ) {
    return 'database'
  }

  // API errors (4xx/5xx)
  if (code >= 400 && code < 600) {
    return 'api_error'
  }

  return 'unknown'
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(errorType: ErrorType): boolean {
  const retryable: ErrorType[] = ['timeout', 'rate_limit', 'network', 'api_error', 'database']
  return retryable.includes(errorType)
}

/**
 * Calculate retry delay based on error type and attempts
 */
export function calculateRetryDelay(errorType: ErrorType, attempts: number): number {
  // Base delay in milliseconds
  let baseDelay = 60000 // 1 minute

  // Adjust based on error type
  if (errorType === 'rate_limit') {
    baseDelay = 120000 // 2 minutes for rate limits
  } else if (errorType === 'timeout') {
    baseDelay = 30000 // 30 seconds for timeouts
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempts - 1)
  const jitter = Math.random() * 0.3 * exponentialDelay // Up to 30% jitter

  // Cap at 1 hour
  return Math.min(exponentialDelay + jitter, 3600000)
}

// ============ Helper Functions ============

function mapFailedJob(row: any): FailedJob {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    jobType: row.job_type,
    jobId: row.job_id,
    jobName: row.job_name,
    relatedType: row.related_type,
    relatedId: row.related_id,
    errorType: row.error_type,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    errorStack: row.error_stack,
    payload: row.payload || {},
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastAttemptAt: row.last_attempt_at,
    nextRetryAt: row.next_retry_at,
    status: row.status,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolutionNotes: row.resolution_notes,
    context: row.context || {},
    createdAt: row.created_at,
  }
}
