/**
 * GoHighLevel Sync API
 * POST /api/integrations/ghl/sync - Sync leads to GHL
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  syncContactToGhl,
  bulkSyncToGhl,
  getGhlConnection,
  getGhlPipelines,
} from '@/lib/services/integrations/gohighlevel.service'

const syncSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(100),
  create_opportunities: z.boolean().optional().default(false),
  pipeline_id: z.string().optional(),
  stage_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check GHL connection
    const connection = await getGhlConnection(user.workspace_id)
    if (!connection) {
      return NextResponse.json({ error: 'GoHighLevel not connected' }, { status: 400 })
    }

    const body = await req.json()
    const { lead_ids, create_opportunities, pipeline_id, stage_id, tags } = syncSchema.parse(body)

    // Validate opportunity creation params
    if (create_opportunities && (!pipeline_id || !stage_id)) {
      return NextResponse.json({
        error: 'pipeline_id and stage_id are required when creating opportunities',
      }, { status: 400 })
    }

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, company_data, contact_data')
      .in('id', lead_ids)
      .eq('workspace_id', user.workspace_id)

    if (leadsError || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'No leads found' }, { status: 404 })
    }

    // Sync to GHL
    const result = await bulkSyncToGhl(
      user.workspace_id,
      leads.map((l) => ({
        id: l.id,
        companyData: l.company_data,
        contactData: l.contact_data,
      })),
      {
        createOpportunities: create_opportunities,
        pipelineId: pipeline_id,
        stageId: stage_id,
        tags,
      }
    )

    return NextResponse.json({
      success: true,
      synced: result.synced,
      failed: result.failed,
      results: result.results,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('GHL sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET pipelines
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const pipelines = await getGhlPipelines(user.workspace_id)

    return NextResponse.json({ pipelines })
  } catch (error: any) {
    console.error('GHL pipelines fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
