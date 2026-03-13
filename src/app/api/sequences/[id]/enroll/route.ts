/**
 * Sequence Enrollment API
 * POST /api/sequences/[id]/enroll - Enroll leads in sequence
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { safeLog } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'
import { withRateLimit, getRequestIdentifier } from '@/lib/middleware/rate-limiter'

const enrollSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(1000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Rate limit: each enrollment triggers Inngest batch jobs for up to 1000 leads — 20/hour per user
    const rateLimitResponse = await withRateLimit(req, 'sequence-enroll', getRequestIdentifier(req, user.id))
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()

    // Verify sequence exists and belongs to workspace
    const { data: sequence } = await supabase
      .from('email_sequences')
      .select('id, is_active')
      .eq('id', sequenceId)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    if (!sequence.is_active) {
      return NextResponse.json({ error: 'Sequence is not active' }, { status: 400 })
    }

    const body = await req.json()
    const { lead_ids } = enrollSchema.parse(body)

    // Verify leads belong to workspace
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .in('id', lead_ids)
      .eq('workspace_id', user.workspace_id)

    const validLeadIds = leads?.map((l) => l.id) || []

    if (validLeadIds.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 400 })
    }

    await inngest.send({
      name: 'sequence/batch-enroll' as const,
      data: { sequence_id: sequenceId, lead_ids: validLeadIds, workspace_id: user.workspace_id },
    })
    safeLog(`[Sequence Enroll] ${validLeadIds.length} leads queued for enrollment in sequence ${sequenceId}`)

    return NextResponse.json({
      success: true,
      enrolled: validLeadIds.length,
      sequence_id: sequenceId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
