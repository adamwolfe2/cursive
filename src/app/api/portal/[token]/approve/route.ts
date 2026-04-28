export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getInngest } from '@/inngest/client'

const requestSchema = z.object({
  stepType: z.enum(['contract', 'invoice', 'domains', 'copy']),
  status: z.enum(['approved', 'changes_requested']),
  notes: z.string().max(2000).optional(),
})

const STEP_LABELS: Record<string, string> = {
  contract: 'contract',
  invoice: 'invoice',
  domains: 'sender domains',
  copy: 'email copy',
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // Validate token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('client_portal_tokens')
      .select('id, client_id, expires_at, revoked')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
    }

    if (tokenRecord.revoked) {
      return NextResponse.json({ error: 'This portal link has been revoked' }, { status: 403 })
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This portal link has expired' }, { status: 403 })
    }

    // Validate body
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { stepType, status, notes } = parsed.data
    const now = new Date().toISOString()

    // Upsert approval record
    const { error: upsertError } = await supabase
      .from('client_portal_approvals')
      .upsert(
        {
          client_id: tokenRecord.client_id,
          token_id: tokenRecord.id,
          step_type: stepType,
          status,
          notes: notes ?? null,
          updated_at: now,
        },
        { onConflict: 'client_id,step_type' }
      )

    if (upsertError) {
      safeError('[Portal] Failed to upsert approval:', upsertError)
      return NextResponse.json({ error: 'Failed to save approval' }, { status: 500 })
    }

    // Side effects based on step + status
    if (status === 'approved') {
      if (stepType === 'domains') {
        await supabase
          .from('onboarding_clients')
          .update({ sender_identity_approval: true })
          .eq('id', tokenRecord.client_id)
      }

      if (stepType === 'copy') {
        await supabase
          .from('onboarding_clients')
          .update({ copy_approval_status: 'approved' })
          .eq('id', tokenRecord.client_id)

        // Trigger EmailBison push, same event the admin approval fires.
        // workspace_id mirrors the admin path: onboarding clients use their
        // own client_id as workspace scope (the EB push then falls back to
        // all connected senders when no email_accounts row matches).
        try {
          const inngest = getInngest()
          await inngest.send({
            name: 'onboarding/copy-approved',
            data: {
              client_id: tokenRecord.client_id,
              workspace_id: tokenRecord.client_id,
            },
          })
        } catch (err) {
          safeError('[Portal] Failed to trigger EmailBison push:', err)
          // Non-fatal, approval is saved, pipeline will retry or admin can manually push
        }
      }
    }

    // Fetch company name for Slack notification
    const { data: clientMeta } = await supabase
      .from('onboarding_clients')
      .select('company_name')
      .eq('id', tokenRecord.client_id)
      .maybeSingle()

    const companyName = clientMeta?.company_name ?? 'Unknown client'
    const stepLabel = STEP_LABELS[stepType] ?? stepType

    const slackMessage =
      status === 'approved'
        ? `${companyName} approved ${stepLabel} via portal`
        : `${companyName} requested changes on ${stepLabel} via portal${notes ? `: ${notes}` : ''}`

    await sendSlackAlert({
      type: 'dfy_onboarding_complete',
      severity: status === 'approved' ? 'info' : 'warning',
      message: slackMessage,
      metadata: {
        company: companyName,
        step: stepLabel,
        decision: status,
        ...(notes ? { notes } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[Portal] approve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
