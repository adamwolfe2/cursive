import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const supabase = createClient()

    const { leads, workspace_id, import_job_id } = payload

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Missing or invalid leads array' },
        { status: 400 }
      )
    }

    const results = {
      total: leads.length,
      successful: 0,
      failed: 0,
      lead_ids: [] as string[],
      routing_summary: {} as Record<string, number>
    }

    for (const leadData of leads) {
      try {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .insert({
            workspace_id: workspace_id || 'default',
            company_name: leadData.company_name,
            company_industry: leadData.company_industry,
            company_location: leadData.location,
            email: leadData.email,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            job_title: leadData.job_title,
            source: 'audience-labs',
            enrichment_status: 'completed',
            delivery_status: 'pending'
          })
          .select()
          .single()

        if (leadError) {
          results.failed++
          continue
        }

        const { data: routedWorkspaceId } = await supabase
          .rpc('route_lead_to_workspace', {
            p_lead_id: lead.id,
            p_source_workspace_id: workspace_id || 'default'
          })

        results.successful++
        results.lead_ids.push(lead.id)
        results.routing_summary[routedWorkspaceId || 'unmatched'] =
          (results.routing_summary[routedWorkspaceId || 'unmatched'] || 0) + 1
      } catch {
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      import_job_id,
      results,
      message: `Processed ${results.successful} of ${results.total} leads`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
