/**
 * Campaign Builder API - Individual Draft Operations
 * Get, Update, Delete specific campaign draft
 */


import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import type { UpdateCampaignDraftRequest } from '@/types/campaign-builder'

const updateDraftSchema = z.object({
  name: z.string().min(1).max(200).optional(),

  // Step 1: Company Profile
  company_name: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  website_url: z.string().url().optional().nullable(),
  value_proposition: z.string().optional(),
  differentiators: z.array(z.string()).optional(),

  // Step 2: Product
  product_name: z.string().optional(),
  problem_solved: z.string().optional(),
  key_features: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  pricing_model: z.string().optional(),
  social_proof: z.string().optional(),
  objection_rebuttals: z.record(z.string()).optional(),

  // Step 3: ICP
  target_titles: z.array(z.string()).optional(),
  target_company_sizes: z.array(z.string()).optional(),
  target_industries: z.array(z.string()).optional(),
  target_locations: z.array(z.string()).optional(),
  pain_points: z.array(z.string()).optional(),
  buying_triggers: z.array(z.string()).optional(),

  // Step 4: Offer
  primary_cta: z.string().optional(),
  secondary_cta: z.string().optional(),
  urgency_elements: z.string().optional(),
  meeting_link: z.string().url().optional().nullable(),

  // Step 5: Tone
  tone: z.enum(['professional', 'casual', 'witty', 'direct', 'friendly']).optional(),
  email_length: z.enum(['short', 'medium', 'long']).optional(),
  personalization_level: z.enum(['light', 'medium', 'heavy']).optional(),
  reference_style: z.enum(['formal', 'casual', 'first_name']).optional(),

  // Step 6: Sequence
  email_count: z.number().min(1).max(10).optional(),
  sequence_type: z.enum(['cold_outreach', 'follow_up', 'nurture', 're_engagement']).optional(),
  days_between_emails: z.number().min(1).max(30).optional(),
  sequence_goal: z.enum(['meeting_booked', 'reply', 'click', 'awareness']).optional(),
})

/**
 * GET /api/campaign-builder/[id]
 * Get specific campaign draft
 */
export async function GET(
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
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get draft
    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, userData.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    safeError('[Campaign Builder] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to get campaign' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaign-builder/[id]
 * Update campaign draft (wizard progress)
 */
export async function PATCH(
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
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Validate request
    const body = await req.json()
    const validated = updateDraftSchema.parse(body)

    // Update draft
    const repo = new CampaignBuilderRepository()
    const draft = await repo.update(id, userData.workspace_id, validated as UpdateCampaignDraftRequest)

    return NextResponse.json({ draft })
  } catch (error) {
    safeError('[Campaign Builder] Update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaign-builder/[id]
 * Delete campaign draft
 */
export async function DELETE(
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
      .maybeSingle()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Delete draft
    const repo = new CampaignBuilderRepository()
    await repo.delete(id, userData.workspace_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[Campaign Builder] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
