/**
 * POST /api/outbound/sample/create
 *
 * One-click Outbound Agent sample workflow — the aha-moment endpoint.
 *
 * Creates a pre-configured "Sample" workflow for the caller's workspace,
 * reuses the workspace's existing enriched leads (no AudienceLab cost, no
 * credit burn), generates 3 real Claude drafts in parallel, and returns
 * the new workflow's id so the UI can redirect the user straight into a
 * populated detail page with real prospects + real drafts ready to review.
 *
 * Why this exists: the standard Outbound Agent flow (create workflow →
 * configure ICP → connect Gmail → run → wait for enrichment → wait for
 * Claude drafts → review) is too long for a first-time user. This endpoint
 * collapses the "see it work" loop into one API call.
 *
 * Constraints:
 *   - Takes no body. Uses the caller's workspace as the input.
 *   - Requires the workspace to already have ≥1 enriched lead. Users who
 *     haven't completed the /setup wizard yet get a clear error pointing
 *     them there.
 *   - Creates an agent named "Sample: [ICP]" — easy to identify in the UI.
 *   - If a sample workflow already exists for this workspace, returns it
 *     idempotently instead of creating a second one.
 *   - Drafts land in email_sends.status='pending_approval' — same place
 *     as real workflow drafts, so the existing review modal just works.
 *   - No sending happens here. The email-connect gate stays enforced at
 *     send time, never at review time.
 */

export const maxDuration = 45

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, ApiError } from '@/lib/utils/api-error-handler'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSalesEmail } from '@/lib/services/ai/claude.service'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import type { OutboundFilters } from '@/types/outbound'

const SAMPLE_NAME = 'Sample: SaaS VPs of Marketing'
const SAMPLE_PRODUCT = 'AI-powered lead generation that identifies anonymous website visitors and automatically drafts personalized outreach.'
const SAMPLE_ICP = 'B2B SaaS companies scaling outbound. Teams that are frustrated by low cold-email reply rates and want deterministic identity data instead of guessing at intent.'
const SAMPLE_PERSONA = 'VPs of Marketing, Heads of Demand Gen, and Directors of Growth at 50–500 person SaaS companies.'
const SAMPLE_VALUE_PROP = 'Cursive identifies 40–60% of anonymous website visitors deterministically — so you can turn pricing-page traffic into booked meetings, not guesswork.'
const SAMPLE_CTA = 'Worth a 15-min look this week?'
const SAMPLE_LEAD_COUNT = 3 // 3 leads × ~4s Claude call = ~12s total in parallel

const SAMPLE_FILTERS: OutboundFilters = {
  industries: ['B2B Software'],
  seniority_levels: ['VP', 'Director'],
  job_titles: ['VP of Marketing', 'Head of Demand Gen', 'Director of Growth'],
  cap_per_run: SAMPLE_LEAD_COUNT,
}

interface SampleResponse {
  workflow_id: string
  draft_count: number
  prospect_count: number
  already_existed: boolean
}

const agentRepo = new AgentRepository()

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.workspace_id) return unauthorized()

    const supabase = createAdminClient()

    // ── 1. Idempotency: reuse an existing sample if one already exists ──
    // We identify sample agents by the exact name prefix "Sample:". If the
    // user already ran the sample path in this workspace, bounce them back
    // to it instead of creating a second.
    const { data: existingSample } = await supabase
      .from('agents')
      .select('id')
      .eq('workspace_id', user.workspace_id)
      .eq('outbound_enabled', true)
      .ilike('name', 'Sample:%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSample?.id) {
      // Count the existing drafts so the UI can still show "N drafts ready"
      const campaign = await agentRepo.ensureOutboundCampaign(existingSample.id)
      const { count: draftCount } = await supabase
        .from('email_sends')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .eq('campaign_id', campaign)
        .eq('status', 'pending_approval')

      const { count: prospectCount } = await supabase
        .from('campaign_leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign)

      const response: SampleResponse = {
        workflow_id: existingSample.id,
        draft_count: draftCount ?? 0,
        prospect_count: prospectCount ?? 0,
        already_existed: true,
      }
      return NextResponse.json({ data: response })
    }

    // ── 2. Workspace + user context for the email sender fields ──────────
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', user.workspace_id)
      .maybeSingle()

    const senderName = user.full_name || user.email?.split('@')[0] || 'there'
    const senderCompany = workspace?.name || 'Cursive'

    // ── 3. Find 3 enriched leads from this workspace to draft against ────
    // Prefer enriched leads (better data = better drafts). Fall back to any
    // leads if no enriched ones exist. Require at least one email present
    // otherwise there's nothing for the draft to address.
    const { data: sampleLeads } = await supabase
      .from('leads')
      .select('id, full_name, first_name, last_name, email, job_title, company_name, metadata, enrichment_status, created_at')
      .eq('workspace_id', user.workspace_id)
      .not('email', 'is', null)
      .order('enrichment_status', { ascending: false }) // 'enriched' sorts after 'pending'
      .order('created_at', { ascending: false })
      .limit(SAMPLE_LEAD_COUNT)

    if (!sampleLeads || sampleLeads.length === 0) {
      // Return a structured error so the client can detect this specific
      // case and route the user to /setup. Substring matching on error
      // messages was the previous approach and broke on copy drift.
      return NextResponse.json(
        {
          error:
            'No leads available for a sample. Complete the setup wizard first — it pulls your first batch of enriched leads, and the Outbound Agent sample drafts emails against them.',
          code: 'NO_LEADS',
          setup_url: '/setup',
        },
        { status: 409 },
      )
    }

    // ── 4. Create the sample agent ───────────────────────────────────────
    const agent = await agentRepo.createOutboundAgent({
      workspaceId: user.workspace_id,
      name: SAMPLE_NAME,
      tone: 'professional',
      icp_text: SAMPLE_ICP,
      persona_text: SAMPLE_PERSONA,
      product_text: SAMPLE_PRODUCT,
      outbound_filters: SAMPLE_FILTERS,
      outbound_auto_approve: false,
    })

    // ── 5. Create the synthetic email_campaign that backs the agent ──────
    const campaignId = await agentRepo.ensureOutboundCampaign(agent.id)

    // ── 6. Link the leads into the campaign as campaign_leads rows ───────
    const { data: campaignLeads, error: clError } = await supabase
      .from('campaign_leads')
      .insert(
        sampleLeads.map((lead) => ({
          campaign_id: campaignId,
          lead_id: lead.id,
          status: 'pending',
        })),
      )
      .select('id, lead_id')

    if (clError || !campaignLeads) {
      safeError('[sample] Failed to insert campaign_leads:', clError)
      throw new ApiError('Failed to link sample leads to workflow', 500)
    }

    // ── 7. Generate Claude drafts in parallel ────────────────────────────
    // 3 leads × ~4s each (Haiku) in parallel = ~5s total, well within the
    // 45s maxDuration. Each draft is a best-effort — if one Claude call
    // fails, we still insert the template fallback from generateSalesEmail.
    const draftsInserted = await Promise.all(
      sampleLeads.map((lead) =>
        generateAndInsertDraft({
          supabase,
          workspaceId: user.workspace_id!,
          campaignId,
          lead,
          senderName,
          senderCompany,
          senderProduct: SAMPLE_PRODUCT,
          valueProposition: SAMPLE_VALUE_PROP,
          cta: SAMPLE_CTA,
        }),
      ),
    )

    const draftCount = draftsInserted.filter((x) => x === true).length

    // ── 8. Mark campaign_leads status='awaiting_approval' for the rows we
    //      successfully drafted. CRITICAL: must be 'awaiting_approval', not
    //      'drafted'. The campaign_leads CHECK constraint only allows
    //      ('pending','enriching','ready','awaiting_approval','in_sequence',
    //       'replied','positive','negative','completed','skipped',
    //       'unsubscribed','bounced','paused'). Using 'drafted' silently
    //      fails the update — supabase-js returns {error}, we don't throw,
    //      and the row stays 'pending'. The /prospects endpoint then maps
    //      'pending' → display_stage='enriching', and the prospects-list
    //      only opens the draft modal when display_stage === 'drafting'.
    //      Net effect: sample shows "3 drafted" in the pipeline but every
    //      row in the list shows "Enriching" and is unclickable. This is
    //      what was killing the aha moment.
    if (draftCount > 0) {
      await supabase
        .from('campaign_leads')
        .update({ status: 'awaiting_approval' })
        .in(
          'lead_id',
          sampleLeads.map((l) => l.id),
        )
        .eq('campaign_id', campaignId)
    }

    // ── 9. Insert a completed outbound_runs row so the detail page
    //      shows "last run: N prospects, N drafts" immediately ──────────
    await supabase.from('outbound_runs').insert({
      workspace_id: user.workspace_id,
      agent_id: agent.id,
      triggered_by: user.id,
      status: 'completed',
      prospects_target: sampleLeads.length,
      prospects_found: sampleLeads.length,
      prospects_enriched: sampleLeads.filter((l) => l.enrichment_status === 'enriched').length,
      drafts_created: draftCount,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: { sample: true },
    })

    // ── 10. Update the agent's last_run_at so the list shows it as "just ran"
    await supabase
      .from('agents')
      .update({ outbound_last_run_at: new Date().toISOString() })
      .eq('id', agent.id)

    safeLog(`[sample] Created sample workflow for workspace ${user.workspace_id}: ${draftCount}/${sampleLeads.length} drafts`)

    const response: SampleResponse = {
      workflow_id: agent.id,
      draft_count: draftCount,
      prospect_count: sampleLeads.length,
      already_existed: false,
    }
    return NextResponse.json({ data: response })
  } catch (error) {
    safeError('[sample] create failed:', error)
    return handleApiError(error)
  }
}

// ─── Helper: generate a Claude draft + insert it into email_sends ────────

interface GenerateDraftArgs {
  supabase: SupabaseClient
  workspaceId: string
  campaignId: string
  lead: {
    id: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    email: string | null
    job_title: string | null
    company_name: string | null
    metadata: Record<string, unknown> | null
  }
  senderName: string
  senderCompany: string
  senderProduct: string
  valueProposition: string
  cta: string
}

async function generateAndInsertDraft(args: GenerateDraftArgs): Promise<boolean> {
  const { supabase, workspaceId, campaignId, lead, senderName, senderCompany, senderProduct, valueProposition, cta } = args

  if (!lead.email) return false

  const recipientName =
    lead.full_name ||
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    'there'

  try {
    const draft = await generateSalesEmail({
      senderName,
      senderCompany,
      senderProduct,
      recipientName,
      recipientTitle: lead.job_title || 'your role',
      recipientCompany: lead.company_name || 'your company',
      recipientIndustry:
        (lead.metadata as { industry?: string } | null)?.industry || undefined,
      valueProposition,
      callToAction: cta,
      tone: 'professional',
    })

    // Idempotency: skip if a draft already exists for this lead + campaign
    const { data: existing } = await supabase
      .from('email_sends')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('lead_id', lead.id)
      .in('status', ['pending_approval', 'approved', 'sending', 'sent'])
      .maybeSingle()

    if (existing) return true

    const { error: insertErr } = await supabase.from('email_sends').insert({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      template_id: null,
      lead_id: lead.id,
      recipient_email: lead.email,
      recipient_name: recipientName,
      subject: draft.subject,
      body_html: draft.body.replace(/\n/g, '<br/>'),
      body_text: draft.body,
      status: 'pending_approval',
      step_number: 1,
      composition_metadata: {
        sample: true,
        cta: draft.callToAction,
        alternativeSubjects: draft.alternativeSubjects,
        followUpTiming: draft.followUpTiming,
      },
    } as never)

    if (insertErr) {
      safeError('[sample] draft insert failed:', insertErr)
      return false
    }
    return true
  } catch (err) {
    safeError('[sample] Claude generation failed for lead:', err)
    return false
  }
}
