// Marketplace Leads API
// Browse and search marketplace leads with filters


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import type { MarketplaceFilters, SeniorityLevel } from '@/types/database.types'
import { safeError } from '@/lib/utils/log-sanitizer'

const filtersSchema = z.object({
  industries: z.array(z.string()).max(20, 'Too many industries (max 20)').optional(),
  states: z.array(z.string()).max(50, 'Too many states (max 50)').optional(),
  companySizes: z.array(z.string()).max(20, 'Too many company sizes (max 20)').optional(),
  seniorityLevels: z.array(z.string()).max(20, 'Too many seniority levels (max 20)').optional(),
  intentScoreMin: z.number().min(0).max(100).optional(),
  intentScoreMax: z.number().min(0).max(100).optional(),
  freshnessMin: z.number().min(0).max(100).optional(),
  hasPhone: z.boolean().optional(),
  hasVerifiedEmail: z.boolean().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  limit: z.number().int('Limit must be an integer').min(1).max(100).default(20),
  offset: z.number().int('Offset must be an integer').min(0).default(0),
  orderBy: z.enum(['price', 'intent_score', 'freshness_score', 'created_at', 'relevant']).optional(),
  sort: z.enum(['relevant', 'newest', 'intent']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check (server-verified)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RATE LIMITING: Check browse rate limit (60 per minute per user)
    const rateLimitResult = await withRateLimit(
      request,
      'marketplace-browse',
      `user:${user.id}`
    )
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const rawFilters: Record<string, unknown> = {}

    // Parse array params
    const arrayParams = ['industries', 'states', 'companySizes', 'seniorityLevels']
    for (const param of arrayParams) {
      const value = searchParams.get(param)
      if (value) {
        rawFilters[param] = value.split(',').filter(Boolean)
      }
    }

    // Parse number params with NaN validation
    const numberParams = ['intentScoreMin', 'intentScoreMax', 'freshnessMin', 'priceMin', 'priceMax', 'limit', 'offset']
    for (const param of numberParams) {
      const value = searchParams.get(param)
      if (value) {
        const parsed = parseFloat(value)
        if (isNaN(parsed)) {
          return NextResponse.json(
            { error: `Invalid ${param}: must be a valid number` },
            { status: 400 }
          )
        }
        rawFilters[param] = parsed
      }
    }

    // Parse boolean params
    const boolParams = ['hasPhone', 'hasVerifiedEmail']
    for (const param of boolParams) {
      const value = searchParams.get(param)
      if (value === 'true') {
        rawFilters[param] = true
      }
    }

    // Parse string params
    rawFilters.orderBy = searchParams.get('orderBy') || undefined
    rawFilters.orderDirection = searchParams.get('orderDirection') || undefined

    // Validate with safeParse for structured error handling
    const parseResult = filtersSchema.safeParse(rawFilters)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid filters', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const validated = parseResult.data

    const filters: MarketplaceFilters = {
      industries: validated.industries,
      states: validated.states,
      companySizes: validated.companySizes,
      seniorityLevels: validated.seniorityLevels as SeniorityLevel[] | undefined,
      intentScoreMin: validated.intentScoreMin,
      intentScoreMax: validated.intentScoreMax,
      freshnessMin: validated.freshnessMin,
      hasPhone: validated.hasPhone,
      hasVerifiedEmail: validated.hasVerifiedEmail,
      priceMin: validated.priceMin,
      priceMax: validated.priceMax,
    }

    // Resolve 'relevant' sort alias to the default ordering column
    const resolvedOrderBy =
      validated.orderBy === 'relevant' ? 'freshness_score' : validated.orderBy

    const repo = new MarketplaceRepository()
    const { leads, total } = await repo.browseLeads(filters, {
      limit: validated.limit,
      offset: validated.offset,
      orderBy: resolvedOrderBy,
      orderDirection: validated.orderDirection,
    })

    return NextResponse.json({
      leads,
      total,
      limit: validated.limit,
      offset: validated.offset,
    })
  } catch (error) {
    safeError('Failed to browse leads:', error)
    return NextResponse.json({ error: 'Failed to browse leads' }, { status: 500 })
  }
}
