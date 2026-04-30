/**
 * Campaign Builder API - AI Generation
 * Generate email sequence using Anthropic Claude
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import { generateEmailSequence } from '@/lib/services/campaign-builder/ai-generator'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { withRateLimit, getRequestIdentifier } from '@/lib/middleware/rate-limiter'

const generateSchema = z.object({
  custom_prompt: z.string().optional(),
  regenerate: z.boolean().optional(),
})

/**
 * POST /api/campaign-builder/[id]/generate
 * Generate AI email sequence
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const limited = await withRateLimit(req, 'ai-generate-email', getRequestIdentifier(req, user.id))
    if (limited) return limited

    const body = await req.json()
    const validated = generateSchema.parse(body)

    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, user.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (draft.generated_emails && !validated.regenerate) {
      return NextResponse.json({
        success: true,
        draft,
        emails: draft.generated_emails,
        message: 'Campaign already has generated emails. Set regenerate=true to generate new ones.',
      })
    }

    if (!draft.company_name || !draft.problem_solved || !draft.primary_cta) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missing: {
            company_name: !draft.company_name,
            problem_solved: !draft.problem_solved,
            primary_cta: !draft.primary_cta,
          },
        },
        { status: 400 }
      )
    }

    await repo.updateStatus(id, user.workspace_id, 'generating')

    try {
      const emails = await generateEmailSequence(draft, validated.custom_prompt)
      const updatedDraft = await repo.saveGeneratedEmails(id, user.workspace_id, emails, {
        prompt: validated.custom_prompt,
        model: 'claude-3-5-sonnet-20241022',
      })

      return NextResponse.json({ success: true, draft: updatedDraft, emails })
    } catch (generationError) {
      await repo.saveGeneratedEmails(id, user.workspace_id, [], {
        error: generationError instanceof Error ? generationError.message : 'Unknown error',
      })
      throw generationError
    }
  } catch (error) {
    return handleApiError(error)
  }
}
