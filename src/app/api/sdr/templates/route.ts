/**
 * SDR Reply Templates API
 * GET: List templates for workspace
 * POST: Create new template
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
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum([
    'interested',
    'question',
    'objection',
    'scheduling',
    'follow_up',
    'breakup',
    'referral',
    'general',
  ]),
  body_template: z.string().min(1).max(10_000),
  subject_template: z.string().max(500).nullable().optional(),
  for_sentiment: z.array(z.string()).optional().default([]),
  for_intent_score_min: z.number().min(0).max(10).optional().default(0),
  for_intent_score_max: z.number().min(0).max(10).optional().default(10),
  trigger_conditions: z.record(z.any()).optional().default({}),
  is_active: z.boolean().optional().default(true),
  auto_suggest: z.boolean().optional().default(false),
  priority: z.number().int().min(1).max(10).optional().default(5),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('sdr_reply_templates')
      .select('*')
      .eq('workspace_id', user.workspace_id)
      .order('priority', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) {
      safeError('[SDR Templates GET]', error)
      return badRequest('Failed to fetch templates')
    }

    return success({
      templates: templates || [],
      total: templates?.length || 0,
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

    const { data: template, error } = await supabase
      .from('sdr_reply_templates')
      .insert({
        workspace_id: user.workspace_id,
        ...validated,
      })
      .select()
      .single()

    if (error) {
      safeError('[SDR Templates POST]', error)
      return badRequest('Failed to create template')
    }

    return created({ template })
  } catch (error) {
    return handleApiError(error)
  }
}
