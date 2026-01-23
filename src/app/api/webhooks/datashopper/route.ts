import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const supabase = createClient()

    const { lead, workspace_id } = payload

    if (!lead || !workspace_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: insertedLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id,
        company_name: lead.company_name,
        company_industry: lead.company_industry,
        company_location: lead.company_location,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        job_title: lead.job_title,
        source: 'datashopper',
        enrichment_status: 'completed',
        delivery_status: 'pending'
      })
      .select()
      .single()

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    const { data: routedWorkspaceId } = await supabase
      .rpc('route_lead_to_workspace', {
        p_lead_id: insertedLead.id,
        p_source_workspace_id: workspace_id
      })

    return NextResponse.json({
      success: true,
      lead_id: insertedLead.id,
      routed_to_workspace: routedWorkspaceId,
      message: 'Lead received and routed successfully'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
