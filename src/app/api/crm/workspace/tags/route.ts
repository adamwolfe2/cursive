/**
 * Workspace Tags API
 * GET /api/crm/workspace/tags
 * Fetch all tags in the current workspace
 *
 * POST /api/crm/workspace/tags
 * Create a new tag
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch all unique tags used in the workspace
    // Tags are stored as JSON arrays in leads table
    const { data: leads, error } = await supabase
      .from('leads')
      .select('tags')
      .eq('workspace_id', user.workspace_id)
      .not('tags', 'is', null)

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

  } catch (error: any) {
    safeError('[Workspace Tags] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspace tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = createTagSchema.parse(body)

    // Return the new tag (no DB storage needed as tags are stored on leads)
    return NextResponse.json({ tag: name, success: true })

  } catch (error: any) {
    safeError('[Workspace Tags] Create Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
