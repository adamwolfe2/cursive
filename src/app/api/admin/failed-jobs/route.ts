/**
 * Failed Jobs API
 * View and manage failed background jobs
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getFailedJobs,
  getErrorStats,
  resolveFailedJob,
  retryFailedJob,
  type JobStatus,
  type ErrorType,
} from '@/lib/services/error-handling.service'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  job_type: z.string().optional(),
  error_type: z.string().optional(),
})

const actionSchema = z.object({
  action: z.enum(['resolve', 'retry', 'get_stats']),
  job_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  hours: z.number().int().min(1).max(720).optional(),
})

/**
 * GET /api/admin/failed-jobs
 * List failed jobs
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = listQuerySchema.parse(searchParams)

    // Build filters
    const filters: {
      status?: JobStatus | JobStatus[]
      jobType?: string
      errorType?: ErrorType
    } = {}

    if (params.status) {
      const statuses = params.status.split(',').filter(Boolean)
      filters.status = statuses.length === 1 ? (statuses[0] as JobStatus) : (statuses as JobStatus[])
    }
    if (params.job_type) filters.jobType = params.job_type
    if (params.error_type) filters.errorType = params.error_type as ErrorType

    const { jobs, total } = await getFailedJobs(user.workspace_id, filters, {
      page: params.page,
      limit: params.limit,
    })

    const limit = params.limit || 20
    const page = params.page || 1

    return success({
      jobs: jobs.map((j) => ({
        id: j.id,
        job_type: j.jobType,
        job_name: j.jobName,
        error_type: j.errorType,
        error_code: j.errorCode,
        error_message: j.errorMessage,
        related_type: j.relatedType,
        related_id: j.relatedId,
        attempts: j.attempts,
        max_attempts: j.maxAttempts,
        status: j.status,
        next_retry_at: j.nextRetryAt,
        resolved_at: j.resolvedAt,
        resolution_notes: j.resolutionNotes,
        created_at: j.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_more: page * limit < total,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/failed-jobs
 * Perform actions on failed jobs
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = actionSchema.parse(body)

    switch (validated.action) {
      case 'resolve': {
        if (!validated.job_id) {
          return badRequest('job_id is required for resolve action')
        }
        const result = await resolveFailedJob(validated.job_id, user.id, validated.notes)
        if (!result.success) {
          return badRequest('Failed to resolve job')
        }
        return success({
          message: 'Job resolved',
          job_id: validated.job_id,
        })
      }

      case 'retry': {
        if (!validated.job_id) {
          return badRequest('job_id is required for retry action')
        }
        const result = await retryFailedJob(validated.job_id)
        if (!result.success) {
          return badRequest('Failed to queue job for retry')
        }
        return success({
          message: 'Job queued for retry',
          job_id: validated.job_id,
        })
      }

      case 'get_stats': {
        const stats = await getErrorStats(user.workspace_id, validated.hours || 24)
        return success({
          stats: stats.map((s) => ({
            error_type: s.errorType,
            job_type: s.jobType,
            total: s.count,
            resolved: s.resolvedCount,
            abandoned: s.abandonedCount,
            pending: s.count - s.resolvedCount - s.abandonedCount,
          })),
          period_hours: validated.hours || 24,
        })
      }

      default:
        return badRequest('Invalid action')
    }
  } catch (error) {
    return handleApiError(error)
  }
}
