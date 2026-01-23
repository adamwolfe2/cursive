import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const supabase = createClient()

    const { person, company, clay_record_id } = payload

    if (!person || !company) {
      return NextResponse.json(
        { error: 'Missing person or company data' },
        { status: 400 }
      )
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: 'default',
        company_name: company.name,
        company_domain: company.domain,
        company_industry: company.industry,
        email: person.email,
        full_name: person.full_name,
        phone: person.phone,
        linkedin_url: person.linkedin_url,
        source: 'clay',
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
        p_lead_id: lead.id,
        p_source_workspace_id: 'default'
      })

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      clay_record_id,
      routed_to_workspace: routedWorkspaceId,
      message: 'Clay enrichment received and routed'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
