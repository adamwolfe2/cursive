/**
 * Saved Filters API
 * Manage user's saved filter presets
 */


import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

import { z } from 'zod'
import { handleApiError, unauthorized, badRequest, notFound } from '@/lib/utils/api-error-handler'

// JSON-safe filter value: primitives, arrays of primitives, or nested records of the same
const filterValue: z.ZodType<string | number | boolean | null | string[] | number[]> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.array(z.number()),
])

// Validation schemas
const createFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filter_type: z.enum(['marketplace', 'leads', 'campaigns', 'partners', 'audit_logs', 'earnings']),
  filters: z.record(filterValue).refine(
    (obj) => Object.keys(obj).length <= 50,
    { message: 'Too many filter keys (max 50)' }
  ),
  is_default: z.boolean().optional(),
  is_shared: z.boolean().optional(),
})

const updateFilterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  filters: z.record(filterValue).refine(
    (obj) => Object.keys(obj).length <= 50,
    { message: 'Too many filter keys (max 50)' }
  ).optional(),
  is_default: z.boolean().optional(),
  is_shared: z.boolean().optional(),
})

/**
 * GET /api/filters
 * List user's saved filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get('type')
    const includeShared = searchParams.get('include_shared') === 'true'

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('saved_filters')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by type if provided
    if (filterType) {
      query = query.eq('filter_type', filterType)
    }

    // Get user's own filters
    const { data: ownFilters, error: ownError } = await query
      .eq('workspace_id', user.workspaceId)
      .eq('user_id', user.userId)
      .limit(200)

    if (ownError) {
      safeError('[Filters API] Query error:', ownError)
      return handleApiError(ownError)
    }

    let sharedFilters: any[] = []

    // Optionally include workspace shared filters
    if (includeShared) {
      let sharedQuery = supabase
        .from('saved_filters')
        .select('*, users!saved_filters_user_id_fkey(full_name, email)')
        .eq('workspace_id', user.workspaceId)
        .eq('is_shared', true)
        .neq('user_id', user.userId)
        .order('created_at', { ascending: false })

      if (filterType) {
        sharedQuery = sharedQuery.eq('filter_type', filterType)
      }

      const { data, error } = await sharedQuery.limit(100)

      if (!error && data) {
        sharedFilters = data
      }
    }

    return NextResponse.json({
      filters: {
        own: ownFilters || [],
        shared: sharedFilters,
      },
    })
  } catch (error) {
    safeError('[Filters API] GET error:', error)
    return handleApiError(error)
  }
}

/**
 * POST /api/filters
 * Create a new saved filter
 */
export async function POST(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    const body = await request.json()
    const data = createFilterSchema.parse(body)

    const supabase = await createClient()

    // If this is set as default, unset previous default for this type
    if (data.is_default) {
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('user_id', user.userId)
        .eq('filter_type', data.filter_type)
        .eq('is_default', true)
    }

    // Create the filter
    const { data: filter, error } = await supabase
      .from('saved_filters')
      .insert({
        ...data,
        workspace_id: user.workspaceId,
        user_id: user.userId,
      })
      .select()
      .maybeSingle()

    if (error) {
      safeError('[Filters API] Create error:', error)
      return handleApiError(error)
    }

    return NextResponse.json({ filter }, { status: 201 })
  } catch (error) {
    safeError('[Filters API] POST error:', error)
    return handleApiError(error)
  }
}

/**
 * PATCH /api/filters
 * Update a saved filter
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    const body = await request.json()
    const { id, ...updates } = updateFilterSchema.parse(body)

    const supabase = await createClient()

    // If setting as default, unset previous default
    if (updates.is_default) {
      // First get the filter type
      const { data: existingFilter } = await supabase
        .from('saved_filters')
        .select('filter_type')
        .eq('id', id)
        .eq('user_id', user.userId)
        .maybeSingle()

      if (existingFilter) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('user_id', user.userId)
          .eq('filter_type', existingFilter.filter_type)
          .eq('is_default', true)
          .neq('id', id)
      }
    }

    // Update the filter
    const { data: filter, error } = await supabase
      .from('saved_filters')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.userId)
      .eq('workspace_id', user.workspaceId) // Defense-in-depth
      .select()
      .maybeSingle()

    if (error) {
      safeError('[Filters API] Update error:', error)
      return handleApiError(error)
    }

    if (!filter) {
      return notFound('Filter not found')
    }

    return NextResponse.json({ filter })
  } catch (error) {
    safeError('[Filters API] PATCH error:', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/filters?id=[filter-id]
 * Delete a saved filter
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const filterId = searchParams.get('id')

    if (!filterId) {
      return badRequest('Filter ID is required')
    }

    const supabase = await createClient()

    // Delete the filter
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', filterId)
      .eq('user_id', user.userId)
      .eq('workspace_id', user.workspaceId) // Defense-in-depth

    if (error) {
      safeError('[Filters API] Delete error:', error)
      return handleApiError(error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[Filters API] DELETE error:', error)
    return handleApiError(error)
  }
}
