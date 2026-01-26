/**
 * Clay Webhook Handler
 * Cursive Platform
 *
 * Receives enriched contact/company data from Clay.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Types for Clay webhook payload
interface ClayPerson {
  email?: string
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  linkedin_url?: string
  job_title?: string
}

interface ClayCompany {
  name: string
  domain?: string
  industry?: string
  location?: string
  employee_count?: number
  revenue?: string
}

interface ClayWebhookPayload {
  person: ClayPerson
  company: ClayCompany
  clay_record_id?: string
  workspace_id?: string
  enrichment_job_id?: string
  timestamp?: string
}

/**
 * Verify Clay webhook signature
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  // Clay uses HMAC-SHA256 signature
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
    const webhookSecret = process.env.CLAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Clay Webhook] Missing CLAY_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const signature = req.headers.get('x-clay-signature') ||
                      req.headers.get('x-webhook-signature')

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Clay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload after signature verification
    let payload: ClayWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { person, company, clay_record_id, workspace_id, enrichment_job_id } = payload

    if (!person || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: person and company' },
        { status: 400 }
      )
    }

    // Use admin client for database operations
    const supabase = getSupabaseAdmin()

    // Determine workspace - use provided or find from enrichment job
    let targetWorkspaceId = workspace_id

    if (!targetWorkspaceId && enrichment_job_id) {
      // Look up workspace from enrichment job
      const { data: job } = await supabase
        .from('enrichment_jobs')
        .select('workspace_id')
        .eq('id', enrichment_job_id)
        .single()

      targetWorkspaceId = job?.workspace_id
    }

    if (!targetWorkspaceId) {
      // Fallback to default admin workspace
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

    // Build full name from parts if not provided
    const fullName = person.full_name ||
      [person.first_name, person.last_name].filter(Boolean).join(' ') ||
      null

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id: targetWorkspaceId,
        company_name: company.name,
        company_domain: company.domain || null,
        company_industry: company.industry || null,
        company_location: company.location || null,
        email: person.email || null,
        full_name: fullName,
        first_name: person.first_name || null,
        last_name: person.last_name || null,
        phone: person.phone || null,
        linkedin_url: person.linkedin_url || null,
        job_title: person.job_title || null,
        source: 'clay',
        enrichment_status: 'completed',
        delivery_status: 'pending',
        raw_data: {
          clay_record_id,
          enrichment_job_id,
          company_details: {
            employee_count: company.employee_count,
            revenue: company.revenue,
          },
          webhook_received_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('[Clay Webhook] Failed to insert lead:', leadError)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Route lead to appropriate workspace
    const { data: routedWorkspaceId, error: routeError } = await supabase
      .rpc('route_lead_to_workspace', {
        p_lead_id: lead.id,
        p_source_workspace_id: targetWorkspaceId,
      })

    if (routeError) {
      console.error('[Clay Webhook] Lead routing failed:', routeError)
      // Don't fail the webhook - lead was created successfully
    }

    // Update enrichment job if provided
    if (enrichment_job_id) {
      await supabase
        .from('enrichment_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_lead_id: lead.id,
        })
        .eq('id', enrichment_job_id)
    }

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      clay_record_id,
      routed_to_workspace: routedWorkspaceId || targetWorkspaceId,
      message: 'Clay enrichment received and processed successfully',
    })
  } catch (error: any) {
    console.error('[Clay Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
