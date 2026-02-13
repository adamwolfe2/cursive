/**
 * Saved Filters API
 * Manage user's saved filter presets
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

// Validation schemas
const createFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filter_type: z.enum(['marketplace', 'leads', 'campaigns', 'partners', 'audit_logs', 'earnings']),
  filters: z.record(z.any()),
  is_default: z.boolean().optional(),
  is_shared: z.boolean().optional(),
})

const updateFilterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  filters: z.record(z.any()).optional(),
  is_default: z.boolean().optional(),
  is_shared: z.boolean().optional(),
})

/**
 * GET /api/filters
 * List user's saved filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      .eq('user_id', user.id)

    if (ownError) {
      safeError('[Filters API] Query error:', ownError)
      return NextResponse.json(
        { error: 'Failed to fetch filters' },
        { status: 500 }
      )
    }

    let sharedFilters: any[] = []

    // Optionally include workspace shared filters
    if (includeShared) {
      let sharedQuery = supabase
        .from('saved_filters')
        .select('*, users!saved_filters_user_id_fkey(full_name, email)')
        .eq('workspace_id', user.workspace_id)
        .eq('is_shared', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filterType) {
        sharedQuery = sharedQuery.eq('filter_type', filterType)
      }

      const { data, error } = await sharedQuery

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
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/filters
 * Create a new saved filter
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createFilterSchema.parse(body)

    const supabase = await createClient()

    // If this is set as default, unset previous default for this type
    if (data.is_default) {
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('filter_type', data.filter_type)
        .eq('is_default', true)
    }

    // Create the filter
    const { data: filter, error } = await supabase
      .from('saved_filters')
      .insert({
        ...data,
        workspace_id: user.workspace_id,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      safeError('[Filters API] Create error:', error)
      return NextResponse.json(
        { error: 'Failed to create filter' },
        { status: 500 }
      )
    }

    return NextResponse.json({ filter }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Filters API] POST error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/filters
 * Update a saved filter
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        .eq('user_id', user.id)
        .single()

      if (existingFilter) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('user_id', user.id)
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
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      safeError('[Filters API] Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update filter' },
        { status: 500 }
      )
    }

    if (!filter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ filter })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    safeError('[Filters API] PATCH error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/filters?id=[filter-id]
 * Delete a saved filter
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filterId = searchParams.get('id')

    if (!filterId) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Delete the filter (RLS ensures user owns it)
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', filterId)
      .eq('user_id', user.id)

    if (error) {
      safeError('[Filters API] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete filter' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[Filters API] DELETE error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
