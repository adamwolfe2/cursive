// Auto-Recharge Settings API
// GET: returns current auto-recharge settings for the workspace
// POST: saves auto-recharge settings (enabled, threshold, recharge_amount)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const autoRechargeSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().int().min(1).max(500),
  recharge_amount: z.enum(['starter', 'growth', 'scale', 'enterprise']),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Fetch workspace settings via admin client
    const adminClient = createAdminClient()
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('settings')
      .eq('id', user.workspace_id)
      .maybeSingle()

    const autoRecharge = workspace?.settings?.auto_recharge ?? {
      enabled: false,
      threshold: 10,
      recharge_amount: 'starter',
    }

    safeLog('[Auto-Recharge] Fetched settings for workspace', { workspace_id: user.workspace_id })

    return NextResponse.json({ data: autoRecharge })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = autoRechargeSchema.parse(body)

    // Fetch existing settings to merge (preserve other settings keys)
    const adminClient = createAdminClient()
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('settings')
      .eq('id', user.workspace_id)
      .maybeSingle()

    const existingSettings = workspace?.settings ?? {}

    // Merge auto_recharge into settings JSONB
    const updatedSettings = {
      ...existingSettings,
      auto_recharge: {
        enabled: validated.enabled,
        threshold: validated.threshold,
        recharge_amount: validated.recharge_amount,
        updated_at: new Date().toISOString(),
      },
    }

    const { error: updateError } = await adminClient
      .from('workspaces')
      .update({ settings: updatedSettings })
      .eq('id', user.workspace_id)

    if (updateError) {
      safeError('[Auto-Recharge] Failed to save settings', updateError)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    safeLog('[Auto-Recharge] Saved settings for workspace', {
      workspace_id: user.workspace_id,
      enabled: validated.enabled,
      threshold: validated.threshold,
      recharge_amount: validated.recharge_amount,
    })

    return NextResponse.json({ success: true, data: updatedSettings.auto_recharge })
  } catch (error) {
    return handleApiError(error)
  }
}
