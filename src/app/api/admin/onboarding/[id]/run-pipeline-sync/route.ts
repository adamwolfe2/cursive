// Synchronous pipeline runner, bypasses Inngest for the heavy compute path.
// Runs enrichment + copy generation inline so admins can unblock a client
// even if Inngest is misconfigured or the function isn't deployed.
//
// Side-channel notifications (Slack alert, confirmation email, CRM sync)
// run AFTER the main pipeline succeeds. Each is wrapped in its own try/catch
// so a Slack outage cannot break onboarding for the client.
//
// Auth: admin session OR x-automation-secret header (so server actions can
// fire-and-forget this endpoint via after()).
//
// Timeout: 300s, enrichment ~25s + copy generation ~90-120s (3 Claude calls).
// 60s default is not enough; the function gets killed mid-call before it can
// write a failure log entry.

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { enrichClientICP } from '@/lib/services/onboarding/claude-enrichment'
import { generateEmailSequences, isCreditBalanceError } from '@/lib/services/onboarding/copy-generation'
import { checkCopyQuality } from '@/lib/services/onboarding/copy-quality-check'
import { sendOnboardingConfirmation } from '@/lib/services/onboarding/onboarding-email'
import { sendNewClientSlackAlert, sendCopyReviewSlackAlert } from '@/lib/services/onboarding/onboarding-slack'
import { syncClientToCRM } from '@/lib/services/onboarding/crm-sync'
import { needsOutboundSetup } from '@/types/onboarding'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import type { PackageSlug } from '@/types/onboarding'

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
  try {
    // Kill switch — set ONBOARDING_PIPELINE_DISABLED=1 in Vercel env to
    // stop ALL automated runs (cron + after()) without a code deploy.
    if (process.env.ONBOARDING_PIPELINE_DISABLED === '1') {
      return NextResponse.json(
        { error: 'Pipeline disabled by ONBOARDING_PIPELINE_DISABLED env var' },
        { status: 503 }
      )
    }

    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id: clientId } = await params

    const repo = new OnboardingClientRepository()
    const client = await repo.findById(clientId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Concurrency guard — refuse to start if another run is already in
    // flight. Prevents duplicate Claude calls when cron + manual button
    // race each other.
    const isInFlight =
      (client.enrichment_status === 'processing' ||
        client.copy_generation_status === 'processing') &&
      Date.now() - new Date(client.updated_at).getTime() < 5 * 60 * 1000

    if (isInFlight) {
      return NextResponse.json(
        {
          error: 'Another pipeline run is already in progress for this client',
          last_updated: client.updated_at,
        },
        { status: 409 }
      )
    }

    // Log that we started so even if the function dies mid-Claude-call,
    // the timeline shows "started but never finished" -> timeout.
    await repo.appendAutomationLog(clientId, {
      step: 'pipeline_run_started',
      status: 'complete',
      timestamp: new Date().toISOString(),
    })

    // Side-channel notifications: confirmation email + Slack alert + CRM sync.
    // These run BEFORE the heavy Claude work so a real client gets confirmation
    // immediately, and so an admin sees the new submission in Slack even if
    // enrichment fails. Each is wrapped so an outage in one channel cannot
    // break onboarding for the client.
    if (!client.confirmation_email_sent) {
      try {
        await sendOnboardingConfirmation(client)
        await repo.update(clientId, { confirmation_email_sent: true })
        await repo.appendAutomationLog(clientId, {
          step: 'confirmation_email',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        safeError('[run-pipeline-sync] confirmation email failed:', e?.message || e)
        await repo.appendAutomationLog(clientId, {
          step: 'confirmation_email',
          status: 'failed',
          error: e?.message || 'Unknown email error',
          timestamp: new Date().toISOString(),
        })
      }
    }
    if (!client.slack_notification_sent) {
      try {
        await sendNewClientSlackAlert(client)
        await repo.update(clientId, { slack_notification_sent: true })
        await repo.appendAutomationLog(clientId, {
          step: 'slack_new_client',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        safeError('[run-pipeline-sync] slack alert failed:', e?.message || e)
        await repo.appendAutomationLog(clientId, {
          step: 'slack_new_client',
          status: 'failed',
          error: e?.message || 'Unknown slack error',
          timestamp: new Date().toISOString(),
        })
      }
    }
    if (client.crm_sync_status !== 'synced') {
      try {
        const crmId = await syncClientToCRM(client)
        await repo.update(clientId, { crm_record_id: crmId, crm_sync_status: 'synced' })
        await repo.appendAutomationLog(clientId, {
          step: 'crm_sync',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
      } catch (e: any) {
        safeError('[run-pipeline-sync] CRM sync failed:', e?.message || e)
        await repo.update(clientId, { crm_sync_status: 'failed' })
        await repo.appendAutomationLog(clientId, {
          step: 'crm_sync',
          status: 'failed',
          error: e?.message || 'Unknown CRM error',
          timestamp: new Date().toISOString(),
        })
      }
    }

    const result: { enrichment: string; copy: string; errors: string[] } = {
      enrichment: 'skipped',
      copy: 'skipped',
      errors: [],
    }

    // 1. Enrichment — only if not already complete
    let icpBrief = client.enriched_icp_brief
    if (client.enrichment_status !== 'complete' || !icpBrief) {
      await repo.update(clientId, { enrichment_status: 'processing' })
      try {
        icpBrief = await enrichClientICP(client)
        await repo.update(clientId, {
          enriched_icp_brief: icpBrief as any,
          enrichment_status: 'complete',
        })
        await repo.appendAutomationLog(clientId, {
          step: 'enrichment',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        result.enrichment = 'complete'
      } catch (e: any) {
        const msg = e?.message || 'Unknown enrichment error'
        const credits = isCreditBalanceError(e)
        await repo.update(clientId, { enrichment_status: 'failed' })
        await repo.appendAutomationLog(clientId, {
          step: 'enrichment',
          status: 'failed',
          error: credits ? `BLOCKED: Anthropic credits exhausted, top up at console.anthropic.com/settings/billing then retry. (${msg})` : msg,
          timestamp: new Date().toISOString(),
        })
        if (credits) {
          await fireCreditAlert(clientId, 'enrichment').catch(() => {})
        }
        result.enrichment = 'failed'
        result.errors.push(`enrichment: ${msg}`)
        return NextResponse.json(result, { status: credits ? 402 : 500 })
      }
    } else {
      result.enrichment = 'already_complete'
    }

    // 2. Copy generation — only if outbound and not already complete
    const packages = client.packages_selected as PackageSlug[]
    const needsCopy = needsOutboundSetup(packages)

    if (!needsCopy) {
      await repo.update(clientId, {
        copy_generation_status: 'not_applicable',
        copy_approval_status: 'not_applicable',
      })
      result.copy = 'not_applicable'
    } else if (client.copy_generation_status !== 'complete') {
      await repo.update(clientId, { copy_generation_status: 'processing' })
      // Marker entry so we can tell from the timeline whether copy gen
      // started (and timed out) vs never reached this step.
      await repo.appendAutomationLog(clientId, {
        step: 'copy_generation_started',
        status: 'complete',
        timestamp: new Date().toISOString(),
      })
      try {
        const seqs = await generateEmailSequences(client, icpBrief, checkCopyQuality)
        await repo.update(clientId, {
          draft_sequences: seqs as any,
          copy_generation_status: 'complete',
        })
        await repo.appendAutomationLog(clientId, {
          step: 'copy_generation',
          status: 'complete',
          timestamp: new Date().toISOString(),
        })
        // Notify the team that copy is ready for review. Non-blocking.
        try {
          const fresh = await repo.findById(clientId)
          if (fresh) await sendCopyReviewSlackAlert(fresh, seqs)
        } catch (slackErr: any) {
          safeError('[run-pipeline-sync] copy review slack failed:', slackErr?.message || slackErr)
        }
        safeLog(`[run-pipeline-sync] copy generation complete for ${clientId}`)
        result.copy = 'complete'
      } catch (e: any) {
        const msg = e?.message || 'Unknown copy generation error'
        const credits = isCreditBalanceError(e)
        await repo.update(clientId, { copy_generation_status: 'failed' })
        await repo.appendAutomationLog(clientId, {
          step: 'copy_generation',
          status: 'failed',
          error: credits ? `BLOCKED: Anthropic credits exhausted, top up at console.anthropic.com/settings/billing then retry. (${msg})` : msg,
          timestamp: new Date().toISOString(),
        })
        if (credits) {
          await fireCreditAlert(clientId, 'copy_generation').catch(() => {})
        }
        result.copy = 'failed'
        result.errors.push(`copy: ${msg}`)
        return NextResponse.json(result, { status: credits ? 402 : 500 })
      }
    } else {
      result.copy = 'already_complete'
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    safeError('[run-pipeline-sync] Error:', error)
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Critical Slack alert when Anthropic credits are exhausted. Prevents
// silent platform-wide failure where new client intakes pile up with no
// admin notification.
async function fireCreditAlert(clientId: string, step: 'enrichment' | 'copy_generation'): Promise<void> {
  try {
    const { sendSlackAlert } = await import('@/lib/monitoring/alerts')
    await sendSlackAlert({
      type: 'system_health',
      severity: 'critical',
      message: `Anthropic credit balance exhausted, ${step} failed for client ${clientId}. Onboarding pipeline is BLOCKED until you top up at console.anthropic.com/settings/billing.`,
      metadata: { client_id: clientId, step },
    })
  } catch {
    // best effort, don't crash the runner over a Slack hiccup
  }
}
