/**
 * Audience Labs Webhook Handler
 * Cursive Platform
 *
 * Receives bulk lead imports from Audience Labs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Types for Audience Labs webhook payload
interface AudienceLabsLead {
  company_name: string
  company_industry?: string
  location?: string
  email?: string
  first_name?: string
  last_name?: string
  job_title?: string
  phone?: string
  linkedin_url?: string
}

interface AudienceLabsWebhookPayload {
  leads: AudienceLabsLead[]
  workspace_id?: string
  import_job_id?: string
  event_type?: string
  timestamp?: string
}

/**
 * Verify Audience Labs webhook signature
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  // Audience Labs uses HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Create admin Supabase client for webhook operations
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature
    const webhookSecret = process.env.AUDIENCE_LABS_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Audience Labs Webhook] Missing AUDIENCE_LABS_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const signature = req.headers.get('x-audience-labs-signature') ||
                      req.headers.get('x-webhook-signature')

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Audience Labs Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload after signature verification
    let payload: AudienceLabsWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { leads, workspace_id, import_job_id } = payload

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Missing or invalid leads array' },
        { status: 400 }
      )
    }

    // Use admin client for database operations
    const supabase = getSupabaseAdmin()

    // Verify workspace exists if provided
    let targetWorkspaceId = workspace_id
    if (targetWorkspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', targetWorkspaceId)
        .single()

      if (workspaceError || !workspace) {
        return NextResponse.json(
          { error: 'Invalid workspace_id' },
          { status: 400 }
        )
      }
    } else {
      // Get default admin workspace
      const { data: adminWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('is_admin', true)
        .single()

      targetWorkspaceId = adminWorkspace?.id
    }

    if (!targetWorkspaceId) {
      return NextResponse.json(
        { error: 'Could not determine target workspace' },
        { status: 400 }
      )
    }

    const results = {
      total: leads.length,
      successful: 0,
      failed: 0,
      lead_ids: [] as string[],
      errors: [] as string[],
      routing_summary: {} as Record<string, number>,
    }

    // Process leads in batches for better performance
    const batchSize = 50
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)

      const leadsToInsert = batch.map((leadData) => ({
        workspace_id: targetWorkspaceId,
        company_name: leadData.company_name,
        company_industry: leadData.company_industry || null,
        company_location: leadData.location || null,
        email: leadData.email || null,
        first_name: leadData.first_name || null,
        last_name: leadData.last_name || null,
        job_title: leadData.job_title || null,
        phone: leadData.phone || null,
        linkedin_url: leadData.linkedin_url || null,
        source: 'audience-labs',
        enrichment_status: 'completed',
        delivery_status: 'pending',
        raw_data: {
          import_job_id,
          webhook_received_at: new Date().toISOString(),
        },
      }))

      const { data: insertedLeads, error: batchError } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select('id')

      if (batchError) {
        console.error('[Audience Labs Webhook] Batch insert error:', batchError)
        results.failed += batch.length
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${batchError.message}`)
        continue
      }

      results.successful += insertedLeads?.length || 0
      results.failed += batch.length - (insertedLeads?.length || 0)

      // Route each lead
      for (const lead of insertedLeads || []) {
        results.lead_ids.push(lead.id)

        const { data: routedWorkspaceId } = await supabase
          .rpc('route_lead_to_workspace', {
            p_lead_id: lead.id,
            p_source_workspace_id: targetWorkspaceId,
          })

        const routeKey = routedWorkspaceId || 'unmatched'
        results.routing_summary[routeKey] = (results.routing_summary[routeKey] || 0) + 1
      }
    }

    // Update import job status if provided
    if (import_job_id) {
      await supabase
        .from('import_jobs')
        .update({
          status: results.failed === 0 ? 'completed' : 'completed_with_errors',
          completed_at: new Date().toISOString(),
          total_leads: results.total,
          successful_leads: results.successful,
          failed_leads: results.failed,
        })
        .eq('id', import_job_id)
    }

    return NextResponse.json({
      success: true,
      import_job_id,
      results: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        lead_ids: results.lead_ids,
        routing_summary: results.routing_summary,
      },
      message: `Processed ${results.successful} of ${results.total} leads`,
    })
  } catch (error: any) {
    console.error('[Audience Labs Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
