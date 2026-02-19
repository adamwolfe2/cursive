/**
 * Enrichment History API
 * GET /api/leads/enrichment-history
 *
 * Returns recent enrichment activity for the user's workspace.
 * Used on the billing page for credit usage transparency.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userProfile?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Fetch recent enrichments (last 30 days, max 50)
    const { data: enrichments } = await adminSupabase
      .from('enrichment_log')
      .select('id, lead_id, status, credits_used, fields_added, created_at')
      .eq('workspace_id', userProfile.workspace_id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get summary stats
    const { count: totalEnrichments } = await adminSupabase
      .from('enrichment_log')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)

    const { count: successCount } = await adminSupabase
      .from('enrichment_log')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .eq('status', 'success')

    const { count: todayCount } = await adminSupabase
      .from('enrichment_log')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', userProfile.workspace_id)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

    return NextResponse.json({
      enrichments: enrichments || [],
      stats: {
        total: totalEnrichments || 0,
        successful: successCount || 0,
        today: todayCount || 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch enrichment history' }, { status: 500 })
  }
}
