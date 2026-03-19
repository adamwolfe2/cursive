/**
 * Workspace Tags API
 * GET /api/crm/workspace/tags
 * Fetch all tags in the current workspace
 *
 * POST /api/crm/workspace/tags
 * Create a new tag
 */


import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return unauthorized()
    }

    const supabase = await createClient()

    // Fetch unique tags used in the workspace (sample up to 10,000 leads)
    // Tags are stored as JSON arrays in leads table
    const { data: leads, error } = await supabase
      .from('leads')
      .select('tags')
      .eq('workspace_id', user.workspace_id)
      .not('tags', 'is', null)
      .limit(10000)

    if (error) {
      safeError('[Workspace Tags] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workspace tags' },
        { status: 500 }
      )
    }

    // Extract all unique tags
    const tagsSet = new Set<string>()
    leads?.forEach(lead => {
      if (Array.isArray(lead.tags)) {
        lead.tags.forEach(tag => tagsSet.add(tag))
      }
    })

    const tags = Array.from(tagsSet).sort()

    return NextResponse.json({ tags })

  } catch (error: unknown) {
    safeError('[Workspace Tags] Error:', error)
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return unauthorized()
    }

    const body = await request.json()
    const { name } = createTagSchema.parse(body)

    // Return the new tag (no DB storage needed as tags are stored on leads)
    return NextResponse.json({ tag: name, success: true })

  } catch (error: unknown) {
    safeError('[Workspace Tags] Create Error:', error)
    return handleApiError(error)
  }
}
