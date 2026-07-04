/**
 * CRM Leads API - Update/Delete specific lead
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, notFound } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { LEAD_STATUSES } from '@/types/crm.types'

// Use edge runtime

const updateLeadSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  company_industry: z.string().optional(),
  business_type: z.string().optional(),
  title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  // Inline CRM editors persist tags + assignment through this route; without
  // these keys Zod silently strips them and the update becomes a no-op.
  tags: z.array(z.string()).optional(),
  assigned_user_id: z.string().uuid().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { id } = await params
    const body = await req.json()
    const validated = updateLeadSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('leads')
      .update(validated)
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return notFound('Lead not found')

    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    safeError('[Update Lead] Error:', error)
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[Delete Lead] Error:', error)
    return handleApiError(error)
  }
}
