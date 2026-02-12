/**
 * Zapier Webhook Generate Route
 * POST /api/integrations/zapier/generate
 *
 * Generates a unique webhook URL for the user to paste into
 * Zapier's "Webhooks by Zapier" trigger. Requires Pro plan.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, forbidden } from '@/lib/utils/api-error-handler'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Pro plan check
    if (user.plan !== 'pro') {
      return forbidden('Zapier integration requires a Pro plan')
    }

    // 3. Generate a unique, unguessable webhook token
    const webhookToken = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zapier/inbound/${webhookToken}`

    const supabase = createAdminClient()

    // 4. Store the webhook URL on the users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ zapier_webhook_url: webhookUrl })
      .eq('id', user.id)

    if (userUpdateError) {
      safeError('[Zapier] Failed to update user webhook URL:', userUpdateError)
      throw new Error('Failed to save webhook URL')
    }

    // 5. Upsert into integrations table
    //    Check if a zapier integration already exists for this workspace
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('workspace_id', user.workspace_id)
      .eq('type', 'zapier')
      .single()

    const integrationData = {
      workspace_id: user.workspace_id,
      type: 'zapier' as const,
      name: 'Zapier Webhook',
      status: 'active' as const,
      config: {
        webhook_token: webhookToken,
        webhook_url: webhookUrl,
        created_at: new Date().toISOString(),
      },
      created_by: user.id,
    }

    if (existingIntegration) {
      const { error: integrationError } = await supabase
        .from('integrations')
        .update({
          ...integrationData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)

      if (integrationError) {
        safeError('[Zapier] Failed to update integration:', integrationError)
      }
    } else {
      const { error: integrationError } = await supabase
        .from('integrations')
        .insert(integrationData)

      if (integrationError) {
        safeError('[Zapier] Failed to create integration:', integrationError)
      }
    }

    // 6. Log to audit_logs
    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_connected',
      resource_type: 'integration',
      metadata: {
        provider: 'zapier',
        webhook_url: webhookUrl,
      },
      severity: 'info',
    })

    // 7. Return the webhook URL
    return NextResponse.json({
      success: true,
      webhookUrl,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
