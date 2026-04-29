// Inline EmailBison push runner. Bypasses Inngest entirely — the prod
// Inngest project for this app is unreachable, so we cannot rely on
// inngest.send() to deliver the post-approval push. This endpoint is the
// authoritative path: callable from the admin "Push to EmailBison Now"
// button AND from approveSequences() / portal approve via after().
//
// Auth: admin session OR x-automation-secret header (so server actions can
// fire-and-forget via after() without needing a real session).
//
// Timeout: 120s — campaign creation, sequence steps, sender attach, schedule,
// and Slack notification. Real push is rate-limited to ~300ms per campaign.

export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { pushCopyToEmailBison } from '@/lib/services/onboarding/emailbison-push'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-helpers'
import { createAdminClient } from '@/lib/supabase/server'
import type { DraftSequences } from '@/types/onboarding'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = request.headers.get('x-automation-secret')
  const expectedSecret = process.env.AUTOMATION_SECRET
  if (expectedSecret && secret === expectedSecret) return true

  try {
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()
    return true
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: clientId } = await params
  const repo = new OnboardingClientRepository()

  try {
    const client = await repo.findById(clientId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.copy_approval_status !== 'approved') {
      return NextResponse.json(
        { error: `Cannot push: copy_approval_status is "${client.copy_approval_status}", expected "approved"` },
        { status: 400 }
      )
    }

    if (!client.draft_sequences) {
      return NextResponse.json({ error: 'Client has no draft sequences' }, { status: 400 })
    }

    if (!client.eb_workspace_id && !client.is_test_client) {
      return NextResponse.json(
        { error: 'EmailBison workspace must be assigned before push.' },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const force = url.searchParams.get('force') === '1'

    // Atomically claim the push lock before any EB API calls.
    // Only succeeds if campaign_deployed is currently false (or force=true).
    const supabaseAdmin = createAdminClient()
    const { data: locked, error: lockErr } = await supabaseAdmin
      .from('onboarding_clients')
      .update({ campaign_deployed: true, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .eq('campaign_deployed', force ? true : false)
      .select('id')
      .maybeSingle()

    if (lockErr) {
      safeError(`[push-emailbison] lock acquisition error for ${clientId}: ${lockErr.message}`)
      return NextResponse.json({ error: 'Failed to acquire push lock' }, { status: 500 })
    }

    if (!locked && !force) {
      return NextResponse.json(
        {
          error: 'Campaigns already deployed for this client',
          campaign_ids: client.emailbison_campaign_ids ?? [],
          hint: 'Pass ?force=1 to push again',
        },
        { status: 409 }
      )
    }

    const workspaceId = client.assigned_workspace_id || client.id
    const dryRun = client.is_test_client === true

    safeLog(
      `[push-emailbison] starting client=${clientId} workspace=${workspaceId} dryRun=${dryRun} force=${force}`
    )

    let result
    try {
      result = await pushCopyToEmailBison({
        clientName: client.company_name,
        sequences: client.draft_sequences as DraftSequences,
        workspaceId,
        ebWorkspaceId: client.eb_workspace_id,
        dryRun,
        onCampaignCreated: async (campaign) => {
          const fresh = await repo.findById(clientId)
          const existing = (fresh?.emailbison_campaign_ids as string[] | null) ?? []
          if (!existing.includes(campaign.campaignId)) {
            await repo.update(clientId, {
              emailbison_campaign_ids: [...existing, campaign.campaignId],
            } as never)
          }
        },
      })
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error)
      // Release lock so retry works
      await supabaseAdmin
        .from('onboarding_clients')
        .update({ campaign_deployed: false })
        .eq('id', clientId)
      await repo.appendAutomationLog(clientId, {
        step: 'emailbison_push',
        status: 'failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })
      // Slack alert for real client failures only — dry-run noise is unhelpful.
      if (!dryRun) {
        sendSlackAlert({
          type: 'inngest_failure',
          severity: 'critical',
          message: `EmailBison push FAILED for ${client.company_name} (${clientId})`,
          metadata: { client_id: clientId, error: errorMessage },
        }).catch(() => {})
      }
      safeError(`[push-emailbison] failed for ${clientId}: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    const campaignIds = result.campaigns.map((c) => c.campaignId)

    await repo.update(clientId, {
      emailbison_campaign_ids: campaignIds,
    } as never)

    await repo.appendAutomationLog(clientId, {
      step: 'emailbison_push',
      status: 'complete',
      timestamp: new Date().toISOString(),
    })

    // Auto-promote status to 'active' if all gates pass — same logic the
    // Inngest handler had, kept here so we match the documented flow.
    const fresh = await repo.findById(clientId)
    if (fresh) {
      const isFullySetup =
        fresh.campaign_deployed &&
        fresh.copy_approval_status === 'approved' &&
        fresh.enrichment_status === 'complete' &&
        fresh.sow_signed &&
        fresh.payment_confirmed
      if (isFullySetup && fresh.status === 'setup') {
        await repo.updateStatus(clientId, 'active')
        await repo.appendAutomationLog(clientId, {
          step: 'status_to_active',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Slack notification — informative only, dry-run gets a clear tag.
    const campaignSummary = result.campaigns
      .map((c) => `${c.campaignName} (${c.sequenceSteps} steps, ${c.variants} variants)`)
      .join('\n')

    sendSlackAlert({
      type: 'pipeline_update',
      severity: 'info',
      message: dryRun
        ? `[DRY-RUN] Test campaigns synthesized for ${client.company_name}`
        : `Campaigns created in EmailBison for ${client.company_name}`,
      metadata: {
        client_id: clientId,
        company: client.company_name,
        dry_run: dryRun ? 'true' : 'false',
        campaigns_created: result.campaigns.length.toString(),
        campaign_summary: campaignSummary,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      dryRun,
      campaigns: result.campaigns,
      campaign_ids: campaignIds,
    })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    safeError(`[push-emailbison] unexpected error for ${clientId}: ${errorMessage}`)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
