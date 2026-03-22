// API: Retry a Failed Onboarding Automation Step
// Admin auth OR automation secret required. Re-runs the specified step for a given client.
// For event-driven steps (enrichment, copy), fires Inngest events.
// For service steps (slack, email, crm_sync), calls the service directly.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { sendOnboardingConfirmation } from '@/lib/services/onboarding/onboarding-email'
import {
  sendNewClientSlackAlert,
  sendCopyReviewSlackAlert,
} from '@/lib/services/onboarding/onboarding-slack'
import { syncClientToCRM } from '@/lib/services/onboarding/crm-sync'
import { needsOutboundSetup } from '@/types/onboarding'
import type { PackageSlug, EnrichedICPBrief, DraftSequences } from '@/types/onboarding'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const RETRYABLE_STEPS = ['enrichment', 'copy_generation', 'slack', 'email', 'crm_sync'] as const
type RetryableStep = (typeof RETRYABLE_STEPS)[number]

const bodySchema = z.object({
  client_id: z.string().uuid('client_id must be a valid UUID'),
  step: z.enum(RETRYABLE_STEPS),
})

async function isAuthorized(request: NextRequest): Promise<{ authorized: boolean; adminEmail?: string }> {
  // Check automation secret first
  const secret = request.headers.get('x-automation-secret')
  const expectedSecret = process.env.AUTOMATION_SECRET
  if (expectedSecret && secret === expectedSecret) {
    return { authorized: true, adminEmail: 'automation' }
  }

  // Fall back to admin auth
  try {
    const { requireAdmin } = await import('@/lib/auth/admin')
    const admin = await requireAdmin()
    return { authorized: true, adminEmail: admin.email }
  } catch {
    return { authorized: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, adminEmail } = await isAuthorized(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { client_id, step } = parsed.data
    const repo = new OnboardingClientRepository()

    // Verify client exists
    const client = await repo.findById(client_id)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    safeLog(`[Automation Retry] Admin ${adminEmail} retrying step '${step}' for client ${client_id}`)

    switch (step as RetryableStep) {
      case 'enrichment': {
        await inngest.send({
          name: 'onboarding/retry-enrichment' as const,
          data: { client_id },
        })
        break
      }

      case 'copy_generation': {
        await inngest.send({
          name: 'onboarding/regenerate-copy' as const,
          data: { client_id },
        })
        break
      }

      case 'slack': {
        try {
          const icpBrief = client.enriched_icp_brief as EnrichedICPBrief | null
          await sendNewClientSlackAlert(client, icpBrief ?? undefined)

          const packages = client.packages_selected as PackageSlug[]
          const sequences = client.draft_sequences as DraftSequences | null
          if (needsOutboundSetup(packages) && sequences) {
            await sendCopyReviewSlackAlert(client, sequences)
          }

          await repo.update(client_id, { slack_notification_sent: true })
          await repo.appendAutomationLog(client_id, {
            step: 'slack_retry',
            status: 'complete',
            timestamp: new Date().toISOString(),
          })
        } catch (e: any) {
          await repo.appendAutomationLog(client_id, {
            step: 'slack_retry',
            status: 'failed',
            error: e.message,
            timestamp: new Date().toISOString(),
          })
          return NextResponse.json(
            { error: `Slack retry failed: ${e.message}` },
            { status: 502 }
          )
        }
        break
      }

      case 'email': {
        try {
          await sendOnboardingConfirmation(client)
          await repo.update(client_id, { confirmation_email_sent: true })
          await repo.appendAutomationLog(client_id, {
            step: 'email_retry',
            status: 'complete',
            timestamp: new Date().toISOString(),
          })
        } catch (e: any) {
          await repo.appendAutomationLog(client_id, {
            step: 'email_retry',
            status: 'failed',
            error: e.message,
            timestamp: new Date().toISOString(),
          })
          return NextResponse.json(
            { error: `Email retry failed: ${e.message}` },
            { status: 502 }
          )
        }
        break
      }

      case 'crm_sync': {
        try {
          const icpBrief = client.enriched_icp_brief as EnrichedICPBrief | null
          const crmId = await syncClientToCRM(client, icpBrief ?? undefined)
          await repo.update(client_id, {
            crm_record_id: crmId,
            crm_sync_status: 'synced',
          })
          await repo.appendAutomationLog(client_id, {
            step: 'crm_sync_retry',
            status: 'complete',
            timestamp: new Date().toISOString(),
          })
        } catch (e: any) {
          await repo.update(client_id, { crm_sync_status: 'failed' })
          await repo.appendAutomationLog(client_id, {
            step: 'crm_sync_retry',
            status: 'failed',
            error: e.message,
            timestamp: new Date().toISOString(),
          })
          return NextResponse.json(
            { error: `CRM sync retry failed: ${e.message}` },
            { status: 502 }
          )
        }
        break
      }
    }

    return NextResponse.json({ success: true, client_id, step, retried: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    safeError('[Automation Retry] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
