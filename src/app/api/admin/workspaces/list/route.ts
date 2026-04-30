export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

// Lightweight workspace list for admin pickers (e.g., assigning an
// onboarding client to a workspace before EmailBison push). Returns id +
// name + slug only, sorted by name. Excludes suspended workspaces.

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, slug, is_suspended')
      .order('name', { ascending: true })

    if (error) {
      safeError('[Admin] Failed to list workspaces:', error)
      return NextResponse.json({ error: 'Failed to load workspaces' }, { status: 500 })
    }

    const workspaces = (data ?? [])
      .filter((w) => !w.is_suspended)
      .map((w) => ({ id: w.id, name: w.name, slug: w.slug }))

    return NextResponse.json({ workspaces })
  } catch (err) {
    safeError('[Admin] workspaces/list GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
