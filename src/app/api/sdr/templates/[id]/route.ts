/**
 * Single SDR Reply Template API
 * GET, PATCH, DELETE for a specific template
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

    const { data: template, error } = await supabase
      .from('sdr_reply_templates')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (error || !template) return notFound('Template not found')

    return success({ template })
  } catch (error) {
    return handleApiError(error)
  }
}

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z
    .enum([
      'interested',
      'question',
      'objection',
      'scheduling',
      'follow_up',
      'breakup',
      'referral',
      'general',
    ])
    .optional(),
  body_template: z.string().min(1).max(10_000).optional(),
  subject_template: z.string().max(500).nullable().optional(),
  for_sentiment: z.array(z.string()).optional(),
  for_intent_score_min: z.number().min(0).max(10).optional(),
  for_intent_score_max: z.number().min(0).max(10).optional(),
  trigger_conditions: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  auto_suggest: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id } = await context.params
    const body = await request.json()
    const validated = patchSchema.parse(body)

    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('sdr_reply_templates')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .select()
      .maybeSingle()

    if (error) {
      safeError('[SDR Templates PATCH]', error)
      return badRequest('Failed to update template')
    }

    if (!template) return notFound('Template not found')

    return success({ template })
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
      .from('sdr_reply_templates')
      .delete()
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)

    if (error) {
      safeError('[SDR Templates DELETE]', error)
      return badRequest('Failed to delete template')
    }

    return success({ message: 'Template deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
