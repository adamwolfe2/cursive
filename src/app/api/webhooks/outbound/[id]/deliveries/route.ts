import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user.workspace_id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 403 })
  }

  const supabase = await createClient()

  // Fetch webhook with deliveries (verify workspace ownership)
  const { data: webhook, error } = await supabase
    .from('workspace_webhooks')
    .select(`
      id, name, url, events, is_active,
      outbound_webhook_deliveries(
        id, event_type, status, response_status, response_body,
        attempts, last_attempt_at, payload
      )
    `)
    .eq('id', id)
    .eq('workspace_id', user.workspace_id)
    .order('last_attempt_at', { referencedTable: 'outbound_webhook_deliveries', ascending: false })
    .limit(50, { referencedTable: 'outbound_webhook_deliveries' })
    .maybeSingle()

  if (error || !webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      ...webhook,
      recent_deliveries: (webhook as any).outbound_webhook_deliveries ?? [],
    },
  })
}
