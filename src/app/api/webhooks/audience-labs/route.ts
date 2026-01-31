/**
 * Audience Labs Webhook Handler
 * Cursive Platform
 *
 * Receives bulk lead imports from Audience Labs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'
import { calculateHashKey } from '@/lib/services/deduplication.service'
import { sendNewLeadEmail } from '@/lib/email/service'

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

    const { leads, workspace_id, import_job_id, timestamp } = payload

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Missing or invalid leads array' },
        { status: 400 }
      )
    }

    // Validation: Max leads per webhook (10,000)
    const MAX_LEADS_PER_WEBHOOK = 10000
    if (leads.length > MAX_LEADS_PER_WEBHOOK) {
      return NextResponse.json(
        { error: `Payload contains ${leads.length.toLocaleString()} leads, which exceeds the 10,000 lead limit per webhook.` },
        { status: 400 }
      )
    }

    // Use admin client for database operations
    const supabase = createAdminClient()

    // ============================================
    // IDEMPOTENCY CHECK - Prevent duplicate processing
    // ============================================
    // Generate unique event ID from import_job_id or payload hash
    const eventId = import_job_id || crypto.createHash('sha256')
      .update(rawBody)
      .digest('hex')

    // Check if this event was already processed
    const { data: existingEvent } = await supabase
      .from('processed_webhook_events')
      .select('id, processed_at')
      .eq('event_id', eventId)
      .eq('source', 'audience-labs')
      .single()

    if (existingEvent) {
      console.log(`[Audience Labs Webhook] Event ${eventId} already processed at ${existingEvent.processed_at}`)
      return NextResponse.json({
        success: true,
        message: 'Event already processed (idempotent)',
        event_id: eventId,
        processed_at: existingEvent.processed_at,
      })
    }

    // Record that we're processing this event
    const { error: insertEventError } = await supabase
      .from('processed_webhook_events')
      .insert({
        event_id: eventId,
        source: 'audience-labs',
        processed_at: new Date().toISOString(),
        payload_summary: {
          lead_count: leads.length,
          workspace_id,
          import_job_id,
          timestamp: timestamp || new Date().toISOString(),
        },
      })

    if (insertEventError) {
      console.error('[Audience Labs Webhook] Failed to record event processing:', insertEventError)
      // Continue anyway - better to process twice than not at all
    }

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
      duplicates_skipped: 0,
      lead_ids: [] as string[],
      errors: [] as string[],
      routing_summary: {} as Record<string, number>,
    }

    // Process leads in batches for better performance
    const batchSize = 50
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)

      // Filter out duplicates before insertion
      const leadsToInsert = []

      for (const leadData of batch) {
        // Skip leads without required company_name
        if (!leadData.company_name) {
          results.failed++
          results.errors.push('Lead missing company_name (required field)')
          continue
        }

        // Check for duplicates using PostgreSQL function (exact + fuzzy matching)
        const { data: duplicateId, error: dupCheckError } = await supabase
          .rpc('check_lead_duplicate', {
            p_company_name: leadData.company_name,
            p_email: leadData.email || null,
            p_linkedin_url: leadData.linkedin_url || null,
            p_phone: leadData.phone || null,
            p_workspace_id: targetWorkspaceId,
            p_use_fuzzy_matching: true,
          })

        if (dupCheckError) {
          console.error('[Audience Labs Webhook] Duplicate check error:', dupCheckError)
          // Continue anyway - better to potentially insert duplicate than skip valid lead
        }

        if (duplicateId) {
          console.log(`[Audience Labs Webhook] Skipping duplicate lead: ${leadData.company_name} (matches ${duplicateId})`)
          results.duplicates_skipped++
          continue
        }

        // Calculate hash for deduplication
        const hashKey = calculateHashKey(
          leadData.email || '',
          null, // company_domain not provided by Audience Labs
          leadData.phone || null
        )

        leadsToInsert.push({
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
          dedupe_hash: hashKey,
          raw_data: {
            import_job_id,
            webhook_received_at: new Date().toISOString(),
          },
        })
      }

      // Insert non-duplicate leads
      if (leadsToInsert.length > 0) {
        const { data: insertedLeads, error: batchError } = await supabase
          .from('leads')
          .insert(leadsToInsert)
          .select('id')

        if (batchError) {
          console.error('[Audience Labs Webhook] Batch insert error:', batchError)
          results.failed += leadsToInsert.length
          results.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${batchError.message}`)
          continue
        }

        results.successful += insertedLeads?.length || 0
        results.failed += leadsToInsert.length - (insertedLeads?.length || 0)

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

    // Send email notification to workspace owner about completed import
    try {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name, owner_user_id')
        .eq('id', targetWorkspaceId)
        .single()

      if (workspace?.owner_user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', workspace.owner_user_id)
          .single()

        if (user && results.successful > 0) {
          await sendNewLeadEmail(
            user.email,
            user.full_name || 'User',
            {
              leadCount: results.successful,
              workspaceName: workspace.name,
              source: 'Audience Labs',
              viewLeadsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/leads`,
            }
          )
          console.log(`✅ Lead import notification sent to ${user.email}`)
        }
      }
    } catch (emailError) {
      console.error('[Audience Labs Webhook] Failed to send notification email:', emailError)
      // Don't fail the webhook if email fails
    }

    return NextResponse.json({
      success: true,
      import_job_id,
      results: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        duplicates_skipped: results.duplicates_skipped,
        lead_ids: results.lead_ids,
        routing_summary: results.routing_summary,
      },
      message: `Processed ${results.successful} of ${results.total} leads (${results.duplicates_skipped} duplicates skipped)`,
    })
  } catch (error: any) {
    console.error('[Audience Labs Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
