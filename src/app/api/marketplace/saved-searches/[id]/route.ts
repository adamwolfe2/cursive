// Marketplace Saved Searches — Delete by ID
// DELETE /api/marketplace/saved-searches/[id]

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing saved search ID' }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const admin = createAdminClient()

    // Delete only if the record belongs to this user (ownership check)
    const { error: deleteError, count } = await admin
      .from('saved_filters')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('filter_type', 'marketplace')

    if (deleteError) {
      safeError('[SavedSearches DELETE] Failed to delete saved search:', deleteError)
      return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[SavedSearches DELETE] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 })
  }
}
