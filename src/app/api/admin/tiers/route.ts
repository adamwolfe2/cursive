/**
 * Admin Tier Management API
 * GET /api/admin/tiers - List all product tiers
 * POST /api/admin/tiers/assign - Assign tier to workspace
 * PATCH /api/admin/tiers/override - Set tier overrides for workspace
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'

const assignTierSchema = z.object({
  workspaceId: z.string().uuid(),
  tierSlug: z.string().min(1).max(100),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  notes: z.string().max(1000).optional(),
})

const overrideSchema = z.object({
  workspaceId: z.string().uuid(),
  dailyLeadLimitOverride: z.number().int().min(0).max(1_000_000).nullable().optional(),
  monthlyLeadLimitOverride: z.number().int().min(0).max(10_000_000).nullable().optional(),
  featureOverrides: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
})

// GET - List all product tiers
export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { data: tiers, error } = await supabase
      .from('product_tiers')
      .select('id, name, slug, description, price_monthly, price_yearly, features, limits, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      tiers,
    })
  } catch (error: any) {
    safeError('[Admin Tiers GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get tiers' },
      { status: 500 }
    )
  }
}

// POST - Assign tier to workspace
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const parsed = assignTierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { workspaceId, tierSlug, billingCycle, notes } = parsed.data

    const supabase = await createClient()

    // Get the product tier
    const { data: tier, error: tierError } = await supabase
      .from('product_tiers')
      .select('id, name')
      .eq('slug', tierSlug)
      .maybeSingle()

    if (tierError || !tier) {
      return NextResponse.json(
        { error: 'Tier not found' },
        { status: 404 }
      )
    }

    // Get current tier for audit log
    const { data: currentTier } = await supabase
      .from('workspace_tiers')
      .select('id, workspace_id, product_tier_id, billing_cycle, subscription_status, daily_lead_limit_override, monthly_lead_limit_override, feature_overrides, internal_notes, product_tiers(name, slug)')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    // Upsert workspace tier
    const { data: workspaceTier, error: upsertError } = await supabase
      .from('workspace_tiers')
      .upsert(
        {
          workspace_id: workspaceId,
          product_tier_id: tier.id,
          billing_cycle: billingCycle,
          subscription_status: 'active',
          internal_notes: notes,
          current_period_start: new Date().toISOString(),
        },
        { onConflict: 'workspace_id' }
      )
      .select('id, workspace_id, product_tier_id, billing_cycle, subscription_status, daily_lead_limit_override, monthly_lead_limit_override, feature_overrides, internal_notes')
      .maybeSingle()

    if (upsertError) throw upsertError

    if (!workspaceTier) {
      return NextResponse.json({ error: 'Failed to upsert workspace tier' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(
      'tier_change',
      'workspace_tier',
      workspaceTier.id,
      {
        tier: (currentTier?.product_tiers as any)?.slug || 'free',
        tierName: (currentTier?.product_tiers as any)?.name || 'Free',
      },
      {
        tier: tierSlug,
        tierName: tier.name,
        billingCycle,
      },
      workspaceId
    )

    return NextResponse.json({
      success: true,
      workspaceTier,
      message: `Workspace upgraded to ${tier.name}`,
    })
  } catch (error: any) {
    safeError('[Admin Tiers POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to assign tier' },
      { status: 500 }
    )
  }
}

// PATCH - Set tier overrides
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const parsed = overrideSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { workspaceId, dailyLeadLimitOverride, monthlyLeadLimitOverride, featureOverrides, notes } = parsed.data

    const supabase = await createClient()

    // Get current tier info
    const { data: currentTier } = await supabase
      .from('workspace_tiers')
      .select('id, workspace_id, product_tier_id, billing_cycle, subscription_status, daily_lead_limit_override, monthly_lead_limit_override, feature_overrides, internal_notes')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!currentTier) {
      return NextResponse.json(
        { error: 'Workspace has no tier assigned. Assign a tier first.' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    if (dailyLeadLimitOverride !== undefined) {
      updates.daily_lead_limit_override = dailyLeadLimitOverride
    }

    if (monthlyLeadLimitOverride !== undefined) {
      updates.monthly_lead_limit_override = monthlyLeadLimitOverride
    }

    if (featureOverrides !== undefined) {
      updates.feature_overrides = {
        ...(currentTier.feature_overrides || {}),
        ...featureOverrides,
      }
    }

    if (notes !== undefined) {
      updates.internal_notes = notes
    }

    // Update tier
    const { data: updatedTier, error: updateError } = await supabase
      .from('workspace_tiers')
      .update(updates)
      .eq('workspace_id', workspaceId)
      .select('id, workspace_id, product_tier_id, billing_cycle, subscription_status, daily_lead_limit_override, monthly_lead_limit_override, feature_overrides, internal_notes')
      .maybeSingle()

    if (updateError) throw updateError

    if (!updatedTier) {
      return NextResponse.json({ error: 'Failed to update workspace tier' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(
      'tier_override',
      'workspace_tier',
      updatedTier.id,
      {
        daily_lead_limit_override: currentTier.daily_lead_limit_override,
        monthly_lead_limit_override: currentTier.monthly_lead_limit_override,
        feature_overrides: currentTier.feature_overrides,
      },
      {
        daily_lead_limit_override: updatedTier.daily_lead_limit_override,
        monthly_lead_limit_override: updatedTier.monthly_lead_limit_override,
        feature_overrides: updatedTier.feature_overrides,
      },
      workspaceId
    )

    return NextResponse.json({
      success: true,
      workspaceTier: updatedTier,
      message: 'Tier overrides updated',
    })
  } catch (error: any) {
    safeError('[Admin Tiers PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update overrides' },
      { status: 500 }
    )
  }
}
