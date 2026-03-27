/**
 * SDR Knowledge Base API
 * GET: List knowledge entries for workspace
 * POST: Create new knowledge entry
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import {
  handleApiError,
  unauthorized,
  success,
  created,
  badRequest,
} from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const createSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(10_000),
  category: z.enum([
    'product',
    'objection_handling',
    'pricing',
    'scheduling',
    'competitor',
    'case_study',
    'faq',
    'custom',
  ]),
  keywords: z.array(z.string().max(100)).max(20).optional().default([]),
  priority: z.number().int().min(1).max(10).optional().default(5),
  is_active: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('sdr_knowledge_base')
      .select('*')
      .eq('workspace_id', user.workspace_id)
      .order('priority', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: entries, error } = await query

    if (error) {
      safeError('[SDR Knowledge GET]', error)
      return badRequest('Failed to fetch knowledge entries')
    }

    return success({
      entries: entries || [],
      total: entries?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = createSchema.parse(body)

    const supabase = await createClient()

    const { data: entry, error } = await supabase
      .from('sdr_knowledge_base')
      .insert({
        workspace_id: user.workspace_id,
        title: validated.title,
        content: validated.content,
        category: validated.category,
        keywords: validated.keywords,
        priority: validated.priority,
        is_active: validated.is_active,
      })
      .select()
      .single()

    if (error) {
      safeError('[SDR Knowledge POST]', error)
      return badRequest('Failed to create knowledge entry')
    }

    return created({ entry })
  } catch (error) {
    return handleApiError(error)
  }
}
