/**
 * POST /api/outbound/workflows/preview-count
 *
 * Lightweight filter validation endpoint. Takes the same OutboundFilters
 * shape the workflow setup form uses and returns the AudienceLab preview
 * count WITHOUT creating an audience or charging credits.
 *
 * The setup form calls this on filter change (debounced) to show users
 * an estimated match count BEFORE they save and run a workflow against
 * filters that would return zero results or ten million.
 *
 * Failure modes:
 *   - filters too narrow (count = 0)        → returns { count: 0, status: 'too_narrow' }
 *   - filters too broad (count > threshold) → returns { count, status: 'too_broad' }
 *   - filters in healthy range              → returns { count, status: 'ok' }
 *
 * No body validation errors throw — they all return a structured response
 * the UI can render inline without dealing with toast errors.
 */

export const maxDuration = 20

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { unauthorized, handleApiError } from '@/lib/utils/api-error-handler'
import { previewAudience, UNFILTERED_PREVIEW_THRESHOLD } from '@/lib/audiencelab/api-client'
import { buildAlFilters } from '@/lib/services/outbound/al-prospecting.service'
import type { OutboundFilters } from '@/types/outbound'
import { safeError } from '@/lib/utils/log-sanitizer'

const filterSchema = z
  .object({
    industries: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    zips: z.array(z.string()).optional(),
    seniority_levels: z
      .array(
        z.enum([
          'C-Suite',
          'VP',
          'Director',
          'Manager',
          'Individual Contributor',
          'Entry Level',
        ])
      )
      .optional(),
    job_titles: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    company_sizes: z.array(z.string()).optional(),
    employee_count: z
      .object({ min: z.number().optional(), max: z.number().optional() })
      .optional(),
    company_revenue: z
      .object({ min: z.number().optional(), max: z.number().optional() })
      .optional(),
    sic: z.array(z.string()).optional(),
    naics: z.array(z.string()).optional(),
  })
  .strict()

export type FilterPreviewStatus = 'ok' | 'too_narrow' | 'too_broad' | 'no_filters'

export interface FilterPreviewResponse {
  count: number
  status: FilterPreviewStatus
  threshold_high: number
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const body = await request.json().catch(() => ({}))
    const parsed = filterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        count: 0,
        status: 'no_filters' satisfies FilterPreviewStatus,
        threshold_high: UNFILTERED_PREVIEW_THRESHOLD,
        message: 'Add at least one filter to see how many prospects match.',
      } as FilterPreviewResponse)
    }

    // If the user hasn't added any filters yet, don't waste an AL call
    const filters = parsed.data as OutboundFilters
    const hasAnyFilter =
      (filters.industries?.length ?? 0) > 0 ||
      (filters.job_titles?.length ?? 0) > 0 ||
      (filters.seniority_levels?.length ?? 0) > 0 ||
      (filters.states?.length ?? 0) > 0 ||
      (filters.cities?.length ?? 0) > 0 ||
      (filters.zips?.length ?? 0) > 0 ||
      (filters.departments?.length ?? 0) > 0 ||
      (filters.sic?.length ?? 0) > 0 ||
      (filters.naics?.length ?? 0) > 0

    if (!hasAnyFilter) {
      return NextResponse.json({
        count: 0,
        status: 'no_filters' satisfies FilterPreviewStatus,
        threshold_high: UNFILTERED_PREVIEW_THRESHOLD,
        message: 'Add at least one filter to see how many prospects match.',
      } as FilterPreviewResponse)
    }

    const alFilters = buildAlFilters(filters)
    const preview = await previewAudience({
      days_back: 7,
      filters: alFilters,
      limit: 1, // smallest possible — we only care about the count
    })

    let status: FilterPreviewStatus
    let message: string
    if (preview.count === 0) {
      status = 'too_narrow'
      message =
        'Zero matches. Loosen your filters — try removing one industry or expanding your seniority levels.'
    } else if (preview.count > UNFILTERED_PREVIEW_THRESHOLD) {
      status = 'too_broad'
      message = `Too broad (${preview.count.toLocaleString()} matches). Add more filters before running.`
    } else {
      status = 'ok'
      message = `Looks good — about ${preview.count.toLocaleString()} prospects match your filters.`
    }

    return NextResponse.json({
      count: preview.count,
      status,
      threshold_high: UNFILTERED_PREVIEW_THRESHOLD,
      message,
    } as FilterPreviewResponse)
  } catch (error) {
    safeError('[outbound] preview-count failed:', error)
    // Don't 500 — return a soft error so the UI doesn't break
    return NextResponse.json(
      {
        count: 0,
        status: 'no_filters' satisfies FilterPreviewStatus,
        threshold_high: UNFILTERED_PREVIEW_THRESHOLD,
        message: 'Couldn\'t check filter count right now. The Run button will still work.',
      } as FilterPreviewResponse,
      { status: 200 },
    )
  } finally {
    // ensure handleApiError isn't dead code
    void handleApiError
  }
}
