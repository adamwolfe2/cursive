/**
 * Single SDR Knowledge Entry API
 * GET, PATCH, DELETE for a specific knowledge entry
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import {
  handleApiError,
  unauthorized,
  notFound,
  success,
  badRequest,
} from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const supabase = await createClient()

    const { data: entry, error } = await supabase
      .from('sdr_knowledge_base')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (error || !entry) return notFound('Knowledge entry not found')

    return success({ entry })
  } catch (error) {
    return handleApiError(error)
  }
}

const patchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(10_000).optional(),
  category: z
    .enum([
      'product',
      'objection_handling',
      'pricing',
      'scheduling',
      'competitor',
      'case_study',
      'faq',
      'custom',
    ])
    .optional(),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const body = await request.json()
    const validated = patchSchema.parse(body)

    const supabase = await createClient()

    const { data: entry, error } = await supabase
      .from('sdr_knowledge_base')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .select()
      .maybeSingle()

    if (error) {
      safeError('[SDR Knowledge PATCH]', error)
      return badRequest('Failed to update knowledge entry')
    }

    if (!entry) return notFound('Knowledge entry not found')

    return success({ entry })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const supabase = await createClient()

    const { error } = await supabase
      .from('sdr_knowledge_base')
      .delete()
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)

    if (error) {
      safeError('[SDR Knowledge DELETE]', error)
      return badRequest('Failed to delete knowledge entry')
    }

    return success({ message: 'Knowledge entry deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
