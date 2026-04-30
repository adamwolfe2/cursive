/**
 * Shopify Disconnect Route
 * Cursive Platform
 *
 * Clears the Shopify OAuth connection for the current workspace.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'shopify')
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'No Shopify connection found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('crm_connections')
      .update({
        status: 'disconnected',
        access_token: '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('workspace_id', user.workspace_id)

    if (updateError) {
      safeError('[Shopify] Failed to disconnect:', updateError)
      return NextResponse.json({ error: 'Failed to disconnect Shopify' }, { status: 500 })
    }

    await supabase.from('audit_logs').insert({
      workspace_id: user.workspace_id,
      user_id: user.id,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: { provider: 'shopify' },
      severity: 'info',
    })

    return NextResponse.json({ success: true, message: 'Shopify disconnected successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
