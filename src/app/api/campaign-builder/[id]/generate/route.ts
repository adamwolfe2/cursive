/**
 * Campaign Builder API - AI Generation
 * Generate email sequence using Anthropic Claude
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import { generateEmailSequence } from '@/lib/services/campaign-builder/ai-generator'

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
    const supabase = await createClient()
    const { id } = await params

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Validate request
    const body = await req.json()
    const validated = generateSchema.parse(body)

    // Get draft
    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, userData.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if already generated (unless regenerate flag is set)
    if (draft.generated_emails && !validated.regenerate) {
      return NextResponse.json({
        success: true,
        draft,
        emails: draft.generated_emails,
        message: 'Campaign already has generated emails. Set regenerate=true to generate new ones.',
      })
    }

    // Validate draft has minimum required fields
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

    // Update status to 'generating'
    await repo.updateStatus(id, userData.workspace_id, 'generating')

    try {
      // Generate emails with AI
      const emails = await generateEmailSequence(draft, validated.custom_prompt)

      // Save generated emails
      const updatedDraft = await repo.saveGeneratedEmails(id, emails, {
        prompt: validated.custom_prompt,
        model: 'claude-3-5-sonnet-20241022',
      })

      return NextResponse.json({
        success: true,
        draft: updatedDraft,
        emails,
      })
    } catch (generationError) {
      // Save error to draft
      await repo.saveGeneratedEmails(id, [], {
        error: generationError instanceof Error ? generationError.message : 'Unknown error',
      })

      throw generationError
    }
  } catch (error) {
    console.error('[Campaign Builder] Generate error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to generate emails',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
