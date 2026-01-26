// Lead Tags API
// GET /api/leads/tags - Get all tags
// POST /api/leads/tags - Create a new tag

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'

const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6b7280'),
  description: z.string().max(200).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const { data: tags, error } = await supabase
      .from('lead_tags')
      .select('*, lead_count:lead_tag_assignments(count)')
      .eq('workspace_id', user.workspace_id)
      .order('name')

    if (error) throw new Error(`Failed to fetch tags: ${error.message}`)

    // Transform to include count
    const tagsWithCount = (tags || []).map(tag => ({
      ...tag,
      lead_count: tag.lead_count?.[0]?.count || 0,
    }))

    return success({ tags: tagsWithCount })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validationResult = createTagSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const supabase = await createClient()
    const { data: tag, error } = await supabase
      .from('lead_tags')
      .insert({
        workspace_id: user.workspace_id,
        ...validationResult.data,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return badRequest('A tag with this name already exists')
      }
      throw new Error(`Failed to create tag: ${error.message}`)
    }

    return success({ tag }, 201)
  } catch (error: any) {
    return handleApiError(error)
  }
}
