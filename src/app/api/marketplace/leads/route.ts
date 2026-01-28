// Marketplace Leads API
// Browse and search marketplace leads with filters

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { MarketplaceRepository } from '@/lib/repositories/marketplace.repository'
import type { MarketplaceFilters } from '@/types/database.types'

const filtersSchema = z.object({
  industries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  companySizes: z.array(z.string()).optional(),
  seniorityLevels: z.array(z.string()).optional(),
  intentScoreMin: z.number().min(0).max(100).optional(),
  intentScoreMax: z.number().min(0).max(100).optional(),
  freshnessMin: z.number().min(0).max(100).optional(),
  hasPhone: z.boolean().optional(),
  hasVerifiedEmail: z.boolean().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  orderBy: z.enum(['price', 'intent_score', 'freshness_score', 'created_at']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Parse number params
    const numberParams = ['intentScoreMin', 'intentScoreMax', 'freshnessMin', 'priceMin', 'priceMax', 'limit', 'offset']
    for (const param of numberParams) {
      const value = searchParams.get(param)
      if (value) {
        rawFilters[param] = parseFloat(value)
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

    // Validate
    const validated = filtersSchema.parse(rawFilters)

    const filters: MarketplaceFilters = {
      industries: validated.industries,
      states: validated.states,
      companySizes: validated.companySizes,
      seniorityLevels: validated.seniorityLevels,
      intentScoreMin: validated.intentScoreMin,
      intentScoreMax: validated.intentScoreMax,
      freshnessMin: validated.freshnessMin,
      hasPhone: validated.hasPhone,
      hasVerifiedEmail: validated.hasVerifiedEmail,
      priceMin: validated.priceMin,
      priceMax: validated.priceMax,
    }

    const repo = new MarketplaceRepository()
    const { leads, total } = await repo.browseLeads(filters, {
      limit: validated.limit || 20,
      offset: validated.offset || 0,
      orderBy: validated.orderBy,
      orderDirection: validated.orderDirection,
    })

    return NextResponse.json({
      leads,
      total,
      limit: validated.limit || 20,
      offset: validated.offset || 0,
    })
  } catch (error) {
    console.error('Failed to browse leads:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid filters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to browse leads' }, { status: 500 })
  }
}
