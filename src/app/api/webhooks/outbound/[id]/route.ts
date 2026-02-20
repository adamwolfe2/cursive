/**
 * Outbound Webhooks — Individual Endpoint
 * Cursive Platform
 *
 * DELETE /api/webhooks/outbound/[id] — delete a webhook
 * PATCH  /api/webhooks/outbound/[id] — update name/events/is_active
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

const ALLOWED_EVENTS = [
  'lead.received',
  'lead.enriched',
  'lead.purchased',
  'credit.purchased',
] as const

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.enum(ALLOWED_EVENTS)).min(1).optional(),
  is_active: z.boolean().optional(),
})

/** Verify the webhook belongs to the user's workspace */
async function ownsWebhook(webhookId: string, workspaceId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('workspace_webhooks')
    .select('id')
    .eq('id', webhookId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  return !!data
}

// ---------------------------------------------------------------------------
// DELETE — remove webhook
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!(await ownsWebhook(id, user.workspace_id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('workspace_webhooks')
      .delete()
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)

    if (error) {
      safeError('[Webhooks/Outbound] DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// ---------------------------------------------------------------------------
// PATCH — update webhook
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!(await ownsWebhook(id, user.workspace_id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.url !== undefined) updateData.url = parsed.data.url
    if (parsed.data.events !== undefined) updateData.events = parsed.data.events
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active

    const supabase = createAdminClient()
    const { data: updated, error } = await supabase
      .from('workspace_webhooks')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .select('id, name, url, events, is_active, updated_at')
      .maybeSingle()

    if (error || !updated) {
      safeError('[Webhooks/Outbound] PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
