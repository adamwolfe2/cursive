/**
 * Workspace Onboarding API
 * Track and manage onboarding progress
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  initializeOnboarding,
  getOnboardingProgress,
  completeOnboardingStep,
  skipOnboardingStep,
} from '@/lib/services/workspace-settings.service'

const completeStepSchema = z.object({
  action: z.literal('complete'),
  step_key: z.string(),
  step_data: z.record(z.any()).optional(),
})

const skipStepSchema = z.object({
  action: z.literal('skip'),
  step_key: z.string(),
})

const initSchema = z.object({
  action: z.literal('initialize'),
})

const actionSchema = z.union([completeStepSchema, skipStepSchema, initSchema])

/**
 * GET /api/workspace/onboarding
 * Get onboarding progress
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const progress = await getOnboardingProgress(user.workspace_id, user.id)

    return success({
      progress: {
        total_steps: progress.totalSteps,
        completed_steps: progress.completedSteps,
        progress_percent: progress.progressPercent,
        is_complete: progress.isComplete,
      },
      steps: progress.steps.map((s) => ({
        key: s.stepKey,
        order: s.stepOrder,
        is_completed: s.isCompleted,
        completed_at: s.completedAt,
        skipped: s.skipped,
        skipped_at: s.skippedAt,
        // Step metadata
        title: getStepTitle(s.stepKey),
        description: getStepDescription(s.stepKey),
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/workspace/onboarding
 * Initialize, complete, or skip onboarding steps
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = actionSchema.parse(body)

    switch (validated.action) {
      case 'initialize': {
        await initializeOnboarding(user.workspace_id, user.id)
        const progress = await getOnboardingProgress(user.workspace_id, user.id)
        return success({
          message: 'Onboarding initialized',
          progress: {
            total_steps: progress.totalSteps,
            completed_steps: progress.completedSteps,
            progress_percent: progress.progressPercent,
          },
        })
      }

      case 'complete': {
        const result = await completeOnboardingStep(
          user.workspace_id,
          user.id,
          validated.step_key,
          validated.step_data || {}
        )

        return success({
          message: `Step "${validated.step_key}" completed`,
          step_key: validated.step_key,
          all_complete: result.allComplete,
        })
      }

      case 'skip': {
        const result = await skipOnboardingStep(
          user.workspace_id,
          user.id,
          validated.step_key
        )

        if (!result.success) {
          return badRequest('Failed to skip step')
        }

        return success({
          message: `Step "${validated.step_key}" skipped`,
          step_key: validated.step_key,
        })
      }

      default:
        return badRequest('Invalid action')
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// Step metadata helpers
function getStepTitle(stepKey: string): string {
  const titles: Record<string, string> = {
    connect_email_account: 'Connect Email Account',
    configure_sender_info: 'Configure Sender Info',
    create_first_campaign: 'Create Your First Campaign',
    import_leads: 'Import Your Leads',
    compose_first_email: 'Compose Your First Email',
    review_and_send: 'Review and Send',
  }
  return titles[stepKey] || stepKey
}

function getStepDescription(stepKey: string): string {
  const descriptions: Record<string, string> = {
    connect_email_account: 'Connect your email sending account (e.g., EmailBison) to enable email delivery',
    configure_sender_info: 'Set up your default sender name, email, and signature',
    create_first_campaign: 'Create a campaign to organize your outreach efforts',
    import_leads: 'Import leads via CSV or paste their emails directly',
    compose_first_email: 'Write or generate your first personalized email',
    review_and_send: 'Review your composed emails and approve them for sending',
  }
  return descriptions[stepKey] || ''
}
