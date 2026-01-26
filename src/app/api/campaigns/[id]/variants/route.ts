/**
 * Campaign Variants API
 * Manage A/B test variants for email templates
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, notFound, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  createVariant,
  getVariants,
  updateVariantWeights,
} from '@/lib/services/campaign/ab-testing.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createVariantSchema = z.object({
  name: z.string().min(1).max(100),
  variant_key: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  subject_template: z.string().min(1),
  body_template: z.string().min(1),
  is_control: z.boolean().optional(),
  weight: z.number().int().min(0).max(100).optional(),
  description: z.string().optional(),
})

const updateWeightsSchema = z.object({
  weights: z.array(
    z.object({
      variant_id: z.string().uuid(),
      weight: z.number().int().min(0).max(100),
    })
  ),
})

/**
 * GET /api/campaigns/[id]/variants
 * Get all variants for a campaign
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()

    // Verify campaign access
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !campaign) {
      return notFound('Campaign not found')
    }

    const variants = await getVariants(campaignId)

    // Calculate total weight
    const totalWeight = variants
      .filter((v) => v.status === 'active')
      .reduce((sum, v) => sum + v.weight, 0)

    return success({
      campaign_id: campaignId,
      campaign_name: campaign.name,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        variant_key: v.variantKey,
        is_control: v.isControl,
        subject_template: v.subjectTemplate,
        body_template: v.bodyTemplate,
        weight: v.weight,
        status: v.status,
        traffic_percent: totalWeight > 0 ? Math.round((v.weight / totalWeight) * 100) : 0,
      })),
      total_weight: totalWeight,
      is_balanced: totalWeight === 100,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/campaigns/[id]/variants
 * Create a new variant
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = createVariantSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign access
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !campaign) {
      return notFound('Campaign not found')
    }

    const result = await createVariant(campaignId, user.workspace_id, {
      name: validated.name,
      variantKey: validated.variant_key,
      subjectTemplate: validated.subject_template,
      bodyTemplate: validated.body_template,
      isControl: validated.is_control,
      weight: validated.weight,
      description: validated.description,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to create variant')
    }

    return success({
      message: 'Variant created',
      variant: {
        id: result.variant!.id,
        name: result.variant!.name,
        variant_key: result.variant!.variantKey,
        is_control: result.variant!.isControl,
        weight: result.variant!.weight,
        status: result.variant!.status,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/campaigns/[id]/variants
 * Update variant weights (rebalance)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = updateWeightsSchema.parse(body)

    const supabase = await createClient()

    // Verify campaign access
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (error || !campaign) {
      return notFound('Campaign not found')
    }

    const result = await updateVariantWeights(
      campaignId,
      validated.weights.map((w) => ({
        variantId: w.variant_id,
        weight: w.weight,
      }))
    )

    if (!result.success) {
      return badRequest(result.error || 'Failed to update weights')
    }

    return success({
      message: 'Variant weights updated',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
