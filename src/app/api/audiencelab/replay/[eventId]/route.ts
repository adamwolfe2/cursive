/**
 * Audience Labs Event Replay
 *
 * POST /api/audiencelab/replay/:eventId
 * Re-triggers normalization from raw event data (idempotent).
 * Requires authenticated user + workspace membership.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { processEventInline } from '@/lib/audiencelab/edge-processor'
import { z } from 'zod'

const ParamsSchema = z.object({
  eventId: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const resolvedParams = await params
    const parsed = ParamsSchema.safeParse(resolvedParams)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { eventId } = parsed.data

    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Verify event belongs to user's workspace
    const { data: event, error: eventError } = await supabase
      .from('audiencelab_events')
      .select('id, source, workspace_id')
      .eq('id', eventId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Reset processed flag so the processor will re-run
    await supabase
      .from('audiencelab_events')
      .update({ processed: false, error: null })
      .eq('id', eventId)

    // Process inline (bypasses Inngest callback which hangs on Vercel)
    const result = await processEventInline(
      eventId,
      event.workspace_id || user.workspace_id,
      event.source
    )

    return NextResponse.json({
      ...result,
      event_id: eventId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
