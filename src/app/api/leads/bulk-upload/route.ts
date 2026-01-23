import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map(h => h.trim())

    const records = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const record: any = {}
      headers.forEach((header, idx) => {
        record[header] = values[idx]
      })
      records.push(record)
    }

    const supabase = createClient()
    const { data: job, error: jobError } = await supabase
      .from('bulk_upload_jobs')
      .insert({
        workspace_id: records[0]?.workspace_id || 'default',
        source,
        total_records: records.length,
        status: 'processing'
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    let successful = 0
    let failed = 0
    const routingSummary: Record<string, number> = {}

    for (const record of records) {
      try {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .insert({
            workspace_id: record.workspace_id || 'default',
            company_name: record.company_name,
            company_industry: record.industry,
            company_location: {
              state: record.state,
              country: record.country || 'US'
            },
            email: record.email,
            source: source || 'csv',
            enrichment_status: 'pending',
            delivery_status: 'pending'
          })
          .select()
          .single()

        if (leadError) {
          failed++
          continue
        }

        const { data: workspaceId } = await supabase
          .rpc('route_lead_to_workspace', {
            p_lead_id: lead.id,
            p_source_workspace_id: record.workspace_id || 'default'
          })

        routingSummary[workspaceId || 'unmatched'] = (routingSummary[workspaceId || 'unmatched'] || 0) + 1
        successful++
      } catch {
        failed++
      }
    }

    await supabase
      .from('bulk_upload_jobs')
      .update({
        status: 'completed',
        successful_records: successful,
        failed_records: failed,
        routing_summary: routingSummary
      })
      .eq('id', job.id)

    return NextResponse.json({
      id: job.id,
      status: 'completed',
      total_records: records.length,
      successful_records: successful,
      failed_records: failed,
      routing_summary: routingSummary
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
