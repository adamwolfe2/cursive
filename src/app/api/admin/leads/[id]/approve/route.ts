// Admin Lead Approve API
// Approve a lead for inclusion in marketplace

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get lead to verify it exists and check workspace context
    // Note: Platform admins can access leads from any workspace
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, workspace_id, partner_id, verification_status_admin')
      .eq('id', id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Platform admins have access to all workspaces
    // Future enhancement: Could add workspace-scoped admin roles here
    // if (!lead.workspace_id) {
    //   return NextResponse.json({ error: 'Invalid lead data' }, { status: 400 })
    // }

    // Update lead verification status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        verification_status_admin: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      safeError('Error approving lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve lead' },
        { status: 500 }
      )
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'lead.approved',
      resource_type: 'lead',
      resource_id: id,
      metadata: {
        partner_id: lead.partner_id,
        approved_by: user.email,
        previous_status: lead.verification_status_admin,
      },
    })

    return NextResponse.json({ lead: updatedLead })
  } catch (error) {
    safeError('Error approving lead:', error)

    return NextResponse.json(
      { error: 'Failed to approve lead' },
      { status: 500 }
    )
  }
}
