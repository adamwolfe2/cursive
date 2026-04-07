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
        'id, email_address, display_name, is_primary, is_verified, last_token_refresh_at, created_at, oauth_provider_user_id'
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
