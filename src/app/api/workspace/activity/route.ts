import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (!user?.workspace_id) {
    return NextResponse.json({ data: [] })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  // Fetch from audit_logs for workspace activity
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, resource_type, metadata, created_at, user_id, users(full_name, email)')
    .eq('workspace_id', user.workspace_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!logs) {
    return NextResponse.json({ data: [] })
  }

  // Shape events for display
  const events = logs.map((log) => {
    const usersRaw = log.users
    const actor = (Array.isArray(usersRaw) ? usersRaw[0] : usersRaw) as { full_name: string | null; email: string } | null
    const actorName = actor?.full_name?.split(' ')[0] ?? actor?.email?.split('@')[0] ?? 'Someone'

    let description = ''
    const meta = (log.metadata as Record<string, unknown>) ?? {}

    switch (log.action) {
      case 'leads.exported':
        description = `${actorName} exported ${meta.count ?? 'some'} leads to CSV`
        break
      case 'lead.purchased':
        description = `${actorName} purchased a lead from the marketplace`
        break
      case 'campaign.sent':
        description = `${actorName} launched a campaign`
        break
      case 'credit.purchased':
        description = `${actorName} purchased ${meta.amount ?? ''} credits`
        break
      case 'contact.created':
        description = `${actorName} added a contact to CRM`
        break
      case 'workspace.member.invited':
        description = `${actorName} invited a team member`
        break
      case 'api_key.created':
        description = `${actorName} created an API key`
        break
      case 'webhook.created':
        description = `${actorName} added a webhook endpoint`
        break
      case 'integration.connected':
        description = `${actorName} connected ${meta.provider ?? 'an integration'}`
        break
      default:
        description = `${actorName} performed ${log.action}`
    }

    return {
      id: log.id as string,
      action: log.action as string,
      description,
      actor_name: actorName,
      created_at: log.created_at as string,
    }
  })

  return NextResponse.json({ data: events })
}
