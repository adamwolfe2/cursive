/**
 * DataShopper Webhook Handler
 * Cursive Platform
 *
 * Receives lead data from DataShopper and routes to appropriate workspace.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Types for DataShopper webhook payload
interface DataShopperLead {
  company_name: string
  company_industry?: string
  company_location?: string
  email?: string
  first_name?: string
  last_name?: string
  job_title?: string
  phone?: string
  linkedin_url?: string
  intent_signals?: string[]
}

interface DataShopperWebhookPayload {
  lead: DataShopperLead
  workspace_id: string
  event_type?: string
  timestamp?: string
}

/**
 * Verify DataShopper webhook signature
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  // DataShopper uses HMAC-SHA256 signature
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


export async function POST(req: NextRequest) {
  let idempotencyKey: string | undefined
  let workspace_id: string | undefined

  try {
    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature
    const webhookSecret = process.env.DATASHOPPER_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[DataShopper Webhook] Missing DATASHOPPER_WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const signature = req.headers.get('x-datashopper-signature') ||
                      req.headers.get('x-webhook-signature')

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[DataShopper Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload after signature verification
    let payload: DataShopperWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { lead } = payload
    workspace_id = payload.workspace_id

    if (!lead || !workspace_id) {
      return NextResponse.json(
        { error: 'Missing required fields: lead and workspace_id' },
        { status: 400 }
      )
    }

    // Use admin client for database operations
    const supabase = createAdminClient()

    // Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Invalid workspace_id' },
        { status: 400 }
      )
    }

    // IDEMPOTENCY: Generate unique key from lead data to prevent duplicates
    // Hash workspace_id + company_name + email/name combination
    const idempotencyData = [
      workspace_id,
      lead.company_name,
      lead.email || `${lead.first_name}:${lead.last_name}`,
      payload.timestamp || '',
    ].filter(Boolean).join('|')

    idempotencyKey = crypto
      .createHash('sha256')
      .update(idempotencyData)
      .digest('hex')

    // Check if this webhook has already been processed
    const { data: existingKey } = await supabase
      .from('api_idempotency_keys')
      .select('status, response_data, completed_at')
      .eq('idempotency_key', idempotencyKey)
      .eq('workspace_id', workspace_id)
      .eq('endpoint', '/api/webhooks/datashopper')
      .single()

    if (existingKey) {
      // Request already processed successfully - return cached response
      if (existingKey.status === 'completed' && existingKey.response_data) {
        return NextResponse.json(existingKey.response_data)
      }

      // Request currently processing - return conflict
      if (existingKey.status === 'processing') {
        return NextResponse.json(
          { error: 'Webhook already being processed. Please retry later.' },
          { status: 409 }
        )
      }

      // Request failed previously - allow retry (don't return early)
    } else {
      // Create new idempotency key record
      await supabase.from('api_idempotency_keys').insert({
        idempotency_key: idempotencyKey,
        workspace_id: workspace_id,
        endpoint: '/api/webhooks/datashopper',
        status: 'processing',
      })
    }

    // Insert lead
    const { data: insertedLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        workspace_id,
        company_name: lead.company_name,
        company_industry: lead.company_industry || null,
        company_location: lead.company_location || null,
        email: lead.email || null,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        job_title: lead.job_title || null,
        phone: lead.phone || null,
        linkedin_url: lead.linkedin_url || null,
        source: 'datashopper',
        enrichment_status: 'completed',
        delivery_status: 'pending',
        raw_data: {
          intent_signals: lead.intent_signals,
          webhook_received_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('[DataShopper Webhook] Failed to insert lead:', leadError)

      // Mark idempotency key as failed
      if (idempotencyKey) {
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotencyKey)
          .eq('workspace_id', workspace_id!)
      }

      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Route lead to appropriate workspace
    const { data: routedWorkspaceId, error: routeError } = await supabase
      .rpc('route_lead_to_workspace', {
        p_lead_id: insertedLead.id,
        p_source_workspace_id: workspace_id,
      })

    if (routeError) {
      console.error('[DataShopper Webhook] Lead routing failed:', routeError)
      // Don't fail the webhook - lead was created successfully
    }

    // Prepare successful response
    const response = {
      success: true,
      lead_id: insertedLead.id,
      routed_to_workspace: routedWorkspaceId || workspace_id,
      message: 'Lead received and processed successfully',
    }

    // Update idempotency key with successful response
    if (idempotencyKey) {
      await supabase
        .from('api_idempotency_keys')
        .update({
          status: 'completed',
          response_data: response,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotencyKey)
        .eq('workspace_id', workspace_id!)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[DataShopper Webhook] Error:', error)

    // Mark idempotency key as failed to allow retry
    if (idempotencyKey && workspace_id) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from('api_idempotency_keys')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotencyKey)
          .eq('workspace_id', workspace_id)
      } catch (idempotencyError) {
        console.error('[DataShopper Webhook] Failed to update idempotency key:', idempotencyError)
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
