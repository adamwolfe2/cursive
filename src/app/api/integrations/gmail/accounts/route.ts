/**
 * GET /api/integrations/gmail/accounts
 *
 * Lists the workspace's connected Gmail accounts. Tokens are NEVER returned —
 * only the safe public fields (id, email_address, display_name, is_primary,
 * is_verified, last_token_refresh_at).
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('email_accounts')
      .select(
        // connection_status MUST be in the select list — the email-accounts
        // settings UI reads it to render the "Needs reconnect" badge and
        // swap the "Send test" → "Reconnect" button when Google has revoked
        // the token. Without it, users with stale OAuth see the same UI as
        // a healthy account and have no obvious way to recover.
        'id, email_address, display_name, is_primary, is_verified, connection_status, last_token_refresh_at, last_error, last_error_at, created_at, oauth_provider_user_id'
      )
      .eq('workspace_id', user.workspace_id)
      .eq('provider', 'gmail')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    return handleApiError(error)
  }
}
