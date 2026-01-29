// CRM Leads API
// API endpoints for fetching and managing CRM leads

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import type { LeadFilters, LeadUpdatePayload } from '@/types/crm.types'

// Validation schema for filters
const filtersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['new', 'contacted', 'qualified', 'won', 'lost'])).optional(),
  industries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  companySizes: z.array(z.string()).optional(),
  intentScoreMin: z.number().min(0).max(100).optional(),
  intentScoreMax: z.number().min(0).max(100).optional(),
  freshnessMin: z.number().min(0).max(100).optional(),
  hasPhone: z.boolean().optional(),
  hasVerifiedEmail: z.boolean().optional(),
  assignedUserId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
})

// Validation schema for lead updates
const leadUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'won', 'lost']).optional(),
  assigned_user_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).max(20).optional(),
  notes: z.string().max(5000).optional(),
  last_contacted_at: z.string().datetime().optional(),
  next_follow_up_at: z.string().datetime().optional(),
})

// GET /api/crm/leads - Fetch leads with filters
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

    // Rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      'crm-operations',
      `user:${user.id}`
    )
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const rawFilters: Record<string, unknown> = {}

    // Parse array params
    const arrayParams = ['status', 'industries', 'states', 'companySizes', 'tags']
    for (const param of arrayParams) {
      const value = searchParams.get(param)
      if (value) {
        rawFilters[param] = value.split(',').filter(Boolean)
      }
    }

    // Parse number params
    const numberParams = [
      'intentScoreMin',
      'intentScoreMax',
      'freshnessMin',
      'page',
      'pageSize',
    ]
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
    rawFilters.search = searchParams.get('search') || undefined
    rawFilters.assignedUserId = searchParams.get('assignedUserId') || undefined
    rawFilters.orderBy = searchParams.get('orderBy') || undefined
    rawFilters.orderDirection = searchParams.get('orderDirection') || undefined

    // Validate
    const validated = filtersSchema.parse(rawFilters)

    const filters: LeadFilters = {
      ...validated,
      page: validated.page || 1,
      pageSize: validated.pageSize || 20,
    }

    // Fetch leads
    const repo = new CRMLeadRepository()
    const { leads, total } = await repo.findByWorkspace(userData.workspace_id, filters)

    const pageCount = Math.ceil(total / filters.pageSize)

    return NextResponse.json({
      leads,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      pageCount,
    })
  } catch (error) {
    console.error('[CRM API] Failed to fetch leads:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// PATCH /api/crm/leads - Update a single lead (ID in query params)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      'crm-operations',
      `user:${user.id}`
    )
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get lead ID from query params
    const leadId = request.nextUrl.searchParams.get('id')
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = leadUpdateSchema.parse(body)

    // Update lead
    const repo = new CRMLeadRepository()
    const lead = await repo.update(leadId, validated, userData.workspace_id)

    // TODO: Audit log the update

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('[CRM API] Failed to update lead:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
