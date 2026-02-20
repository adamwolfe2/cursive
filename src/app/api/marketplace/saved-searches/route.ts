// Marketplace Saved Searches API
// GET:  List saved searches for the workspace
// POST: Save a new search filter preset

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

const saveSearchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  filters: z.record(z.unknown()), // The filter object as JSON
})

// ── Helper: resolve authenticated user + workspace ──────────────────────────

async function resolveUser() {
  const user = await getCurrentUser()

  if (!user) {
    return { user: null, error: 'Unauthorized' }
  }

  if (!user.workspace_id) {
    return { user: null, error: 'No workspace found' }
  }

  return { user, error: null }
}
// ── GET: List saved searches ─────────────────────────────────────────────────

export async function GET() {
  try {
    const { user, error } = await resolveUser()

    if (error || !user) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: savedSearches, error: fetchError } = await admin
      .from('saved_filters')
      .select('id, name, filters, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('workspace_id', user.workspace_id)
      .eq('filter_type', 'marketplace')
      .order('created_at', { ascending: false })

    if (fetchError) {
      safeError('[SavedSearches GET] Failed to fetch saved searches:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
    }

    return NextResponse.json({ savedSearches: savedSearches ?? [] })
  } catch (error) {
    safeError('[SavedSearches GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
  }
}

// ── POST: Save a new search ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await resolveUser()

    if (error || !user) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parseResult = saveSearchSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, filters } = parseResult.data

    const admin = createAdminClient()

    const { data: savedSearch, error: insertError } = await admin
      .from('saved_filters')
      .insert({
        user_id: user.id,
        workspace_id: user.workspace_id,
        name,
        filter_type: 'marketplace',
        filters,
        is_default: false,
        is_shared: false,
      })
      .select('id, name, filters, created_at')
      .maybeSingle()

    if (insertError) {
      safeError('[SavedSearches POST] Failed to save search:', insertError)
      return NextResponse.json({ error: 'Failed to save search' }, { status: 500 })
    }

    return NextResponse.json({ savedSearch }, { status: 201 })
  } catch (error) {
    safeError('[SavedSearches POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to save search' }, { status: 500 })
  }
}
