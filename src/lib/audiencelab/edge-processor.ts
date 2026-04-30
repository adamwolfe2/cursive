/**
 * Edge-Compatible AudienceLab Event Processor
 *
 * Processes raw audiencelab_events inline (without Inngest callback) so that
 * events are handled even when Node.js serverless functions are unavailable.
 *
 * Pipeline: normalize → upsert identity → create lead → route to users → notify → mark processed
 *
 * Uses Web Crypto API instead of Node.js crypto for Edge runtime compatibility.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeALPayload, extractEventType, isLeadWorthy, isVerifiedEmail } from '@/lib/audiencelab/field-map'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { checkQuota, incrementQuota } from '@/lib/services/al-quota.service'

const LOG_PREFIX = '[AL EdgeProcessor]'

/**
 * Fire an Inngest event via the REST API (edge-safe, fire-and-forget).
 * Used instead of the SDK import to maintain Edge runtime compatibility.
 */
function fireInngestEvent(name: string, data: Record<string, unknown>): void {
  const eventKey = process.env.INNGEST_EVENT_KEY
  if (!eventKey) return
  fetch('https://inn.gs/e/' + eventKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  }).catch((err) => safeError(`${LOG_PREFIX} Inngest event fire failed (${name}):`, err))
}

// ============ Edge-Compatible Crypto Helpers ============

/**
 * SHA-256 hash using Web Crypto API (Edge-compatible).
 */
async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(input))
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function normalizeEmailForHash(email: string): string {
  if (!email) return ''
  const [local, domain] = email.toLowerCase().trim().split('@')
  if (!local || !domain) return email.toLowerCase().trim()
  const gmailDomains = ['gmail.com', 'googlemail.com']
  if (gmailDomains.includes(domain)) {
    return local.replace(/\./g, '') + '@' + domain
  }
  return local + '@' + domain
}

function extractDomainFromEmail(email: string): string {
  if (!email) return ''
  const parts = email.toLowerCase().trim().split('@')
  return parts[1] || ''
}

function normalizePhoneForHash(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  return digits
}

/**
 * Edge-compatible hash key calculation (replaces Node.js crypto.createHash).
 */
async function calculateHashKey(
  email: string,
  companyDomain: string | null,
  phone: string | null
): Promise<string> {
  const normalizedEmail = normalizeEmailForHash(email)
  const normalizedDomain = (companyDomain || extractDomainFromEmail(email)).toLowerCase().trim()
  const normalizedPhone = normalizePhoneForHash(phone)
  const hashInput = `${normalizedEmail}|${normalizedDomain}|${normalizedPhone}`
  return sha256(hashInput)
}

/**
 * Edge-compatible duplicate check.
 */
async function checkDuplicate(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  companyDomain: string | null,
  phone: string | null
): Promise<{ isDuplicate: boolean; existingLeadId?: string; hashKey: string }> {
  const hashKey = await calculateHashKey(email, companyDomain, phone)

  const { data: existingLead, error } = await supabase
    .from('leads')
    .select('id, partner_id, hash_key')
    .eq('hash_key', hashKey)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    safeError(`${LOG_PREFIX} Duplicate check error`, error)
  }

  if (!existingLead) {
    return { isDuplicate: false, hashKey }
  }

  return {
    isDuplicate: true,
    existingLeadId: existingLead.id,
    hashKey,
  }
}

// ============ Main Inline Processor ============

/**
 * Process an AudienceLab event inline (Edge-compatible).
 * Called from the webhook handler after storing the raw event.
 *
 * This function never throws — all errors are caught and logged.
 * The event is marked as processed regardless of partial failures.
 */
export async function processEventInline(
  eventId: string,
  workspaceId: string,
  source: string
): Promise<{ success: boolean; lead_id?: string; identity_id?: string; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Step 1: Fetch raw event
    const { data: rawEvent, error: fetchError } = await supabase
      .from('audiencelab_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle()

    if (fetchError || !rawEvent) {
      return { success: false, error: `Event not found: ${fetchError?.message}` }
    }

    if (rawEvent.processed) {
      return { success: true, lead_id: rawEvent.lead_id, identity_id: rawEvent.identity_id }
    }

    // Step 2: Normalize fields
    const normalized = normalizeALPayload(rawEvent.raw)

    if (!normalized.primary_email && !normalized.profile_id && !normalized.hem_sha256) {
      await supabase
        .from('audiencelab_events')
        .update({ processed: true, error: 'No identifiable information' })
        .eq('id', eventId)
      return { success: true, error: 'no_identifiable_info' }
    }

    // Step 3: Upsert identity
    let identityId: string | null = null
    let existingLeadId: string | null = null
    let _isNewIdentity = false

    // Find existing identity by priority: profile_id > uid > hem_sha256 > primary_email
    let existingIdentity: { id: string; visit_count: number; lead_id: string | null } | null = null

    if (normalized.profile_id) {
      const { data } = await supabase
        .from('audiencelab_identities')
        .select('id, visit_count, lead_id')
        .eq('profile_id', normalized.profile_id)
        .maybeSingle()
      existingIdentity = data
    }

    if (!existingIdentity && normalized.uid) {
      const { data } = await supabase
        .from('audiencelab_identities')
        .select('id, visit_count, lead_id')
        .eq('uid', normalized.uid)
        .limit(1)
        .maybeSingle()
      existingIdentity = data
    }

    if (!existingIdentity && normalized.hem_sha256) {
      const { data } = await supabase
        .from('audiencelab_identities')
        .select('id, visit_count, lead_id')
        .eq('hem_sha256', normalized.hem_sha256)
        .limit(1)
        .maybeSingle()
      existingIdentity = data
    }

    if (!existingIdentity && normalized.primary_email) {
      const { data } = await supabase
        .from('audiencelab_identities')
        .select('id, visit_count, lead_id')
        .contains('personal_emails', [normalized.primary_email])
        .limit(1)
        .maybeSingle()
      existingIdentity = data
    }

    const targetWorkspaceId = workspaceId || rawEvent.workspace_id

    if (existingIdentity) {
      // Update existing identity
      const { error: updateError } = await supabase
        .from('audiencelab_identities')
        .update({
          uid: normalized.uid || undefined,
          profile_id: normalized.profile_id || undefined,
          hem_sha256: normalized.hem_sha256 || undefined,
          personal_emails: normalized.personal_emails.length > 0 ? normalized.personal_emails : undefined,
          business_emails: normalized.business_emails.length > 0 ? normalized.business_emails : undefined,
          phones: normalized.phones.length > 0 ? normalized.phones : undefined,
          primary_email: normalized.primary_email || undefined,
          first_name: normalized.first_name || undefined,
          last_name: normalized.last_name || undefined,
          company_name: normalized.company_name || undefined,
          company_domain: normalized.company_domain || undefined,
          job_title: normalized.job_title || undefined,
          address1: normalized.address1 || undefined,
          city: normalized.city || undefined,
          state: normalized.state || undefined,
          zip: normalized.zip || undefined,
          email_validation_status: normalized.email_validation_status || undefined,
          email_last_seen: normalized.email_last_seen || undefined,
          skiptrace_match_by: normalized.skiptrace_match_by || undefined,
          deliverability_score: normalized.deliverability_score,
          raw_resolution: rawEvent.raw,
          last_seen_at: new Date().toISOString(),
          visit_count: (existingIdentity.visit_count || 0) + 1,
        })
        .eq('id', existingIdentity.id)

      if (updateError) {
        safeError(`${LOG_PREFIX} Failed to update identity`, updateError)
      }

      identityId = existingIdentity.id
      existingLeadId = existingIdentity.lead_id
    } else {
      // Insert new identity
      const { data: inserted, error: insertError } = await supabase
        .from('audiencelab_identities')
        .insert({
          uid: normalized.uid,
          profile_id: normalized.profile_id,
          hem_sha256: normalized.hem_sha256,
          personal_emails: normalized.personal_emails,
          business_emails: normalized.business_emails,
          phones: normalized.phones,
          primary_email: normalized.primary_email,
          first_name: normalized.first_name,
          last_name: normalized.last_name,
          company_name: normalized.company_name,
          company_domain: normalized.company_domain,
          job_title: normalized.job_title,
          address1: normalized.address1,
          city: normalized.city,
          state: normalized.state,
          zip: normalized.zip,
          email_validation_status: normalized.email_validation_status,
          email_last_seen: normalized.email_last_seen,
          skiptrace_match_by: normalized.skiptrace_match_by,
          deliverability_score: normalized.deliverability_score,
          raw_resolution: rawEvent.raw,
          workspace_id: targetWorkspaceId,
        })
        .select('id')
        .maybeSingle()

      if (insertError) {
        safeError(`${LOG_PREFIX} Failed to insert identity`, insertError)
        // Mark processed with error
        await supabase
          .from('audiencelab_events')
          .update({ processed: true, error: `Identity insert failed: ${insertError.message}` })
          .eq('id', eventId)
        return { success: false, error: `Identity insert failed: ${insertError.message}` }
      }

      identityId = inserted!.id
      _isNewIdentity = true
    }

    // Step 4: Create or update lead
    const eventType = extractEventType(rawEvent.raw || {})
    let leadId: string | null = existingLeadId
    let isNewLead = false

    if (existingLeadId) {
      // Update existing lead with fresh data
      const updateFields: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }
      if (normalized.first_name) updateFields.first_name = normalized.first_name
      if (normalized.last_name) updateFields.last_name = normalized.last_name
      if (normalized.first_name || normalized.last_name) {
        updateFields.full_name = [normalized.first_name, normalized.last_name].filter(Boolean).join(' ')
      }
      if (normalized.company_name) updateFields.company_name = normalized.company_name
      if (normalized.company_domain) updateFields.company_domain = normalized.company_domain
      if (normalized.job_title) updateFields.job_title = normalized.job_title
      if (normalized.phones.length > 0) updateFields.phone = normalized.phones[0]
      if (normalized.state) {
        updateFields.state = normalized.state
        updateFields.state_code = normalized.state
      }
      if (normalized.city) updateFields.city = normalized.city
      if (normalized.company_industry) updateFields.company_industry = normalized.company_industry
      if (normalized.department) updateFields.department = normalized.department
      if (normalized.seniority_level) updateFields.seniority_level = normalized.seniority_level
      if (normalized.company_revenue) updateFields.company_revenue = normalized.company_revenue
      if (normalized.company_employee_count) updateFields.company_employee_count = normalized.company_employee_count
      if (normalized.landing_url) updateFields.page_url = normalized.landing_url
      if (normalized.dnc_mobile) updateFields.dnc_mobile = normalized.dnc_mobile
      if (normalized.dnc_landline) updateFields.dnc_landline = normalized.dnc_landline

      await supabase
        .from('leads')
        .update(updateFields)
        .eq('id', existingLeadId)
    } else if (normalized.primary_email) {
      // Check lead-worthiness (all events including auth must pass quality gate)
      const worthy = isLeadWorthy({
        eventType,
        deliverabilityScore: normalized.deliverability_score,
        hasVerifiedEmail: isVerifiedEmail(normalized.email_validation_status),
        hasBusinessEmail: normalized.business_emails.length > 0,
        hasPhone: normalized.phones.length > 0,
        hasName: !!(normalized.first_name && normalized.last_name),
        hasCompany: !!normalized.company_name?.trim(),
      })

      if (worthy) {
        // Check for duplicates via hash key (covers same email+company+phone combo globally)
        const dedupResult = await checkDuplicate(
          supabase,
          normalized.primary_email,
          normalized.company_domain,
          normalized.phones[0] || null
        )

        // Global email dedup: also check raw email across all workspaces.
        // This catches same-email leads with different company/phone (different hash).
        // admin client bypasses RLS — no cross-workspace data is exposed, just the ID.
        let globalEmailDuplicate: { id: string; workspace_id: string } | null = null
        if (!dedupResult.isDuplicate) {
          const { data: emailMatch, error: emailErr } = await supabase
            .from('leads')
            .select('id, workspace_id')
            .eq('email', normalized.primary_email.toLowerCase())
            .limit(1)
            .maybeSingle()

          if (emailErr && emailErr.code !== 'PGRST116') {
            safeError(`${LOG_PREFIX} Global email dedup check error`, emailErr)
          } else if (emailMatch) {
            globalEmailDuplicate = emailMatch
          }
        }

        if (dedupResult.isDuplicate || globalEmailDuplicate) {
          const existingLeadId = dedupResult.existingLeadId || globalEmailDuplicate?.id
          const crossWorkspace = !dedupResult.isDuplicate && globalEmailDuplicate?.workspace_id !== targetWorkspaceId

          if (crossWorkspace) {
            safeLog(`${LOG_PREFIX} Cross-workspace duplicate skipped: email exists in workspace ${globalEmailDuplicate?.workspace_id}`)
          }

          // Link identity to existing lead (regardless of whether it's same-workspace or cross-workspace)
          if (existingLeadId) {
            await supabase
              .from('audiencelab_identities')
              .update({ lead_id: existingLeadId })
              .eq('id', identityId!)
            leadId = existingLeadId
          }
        } else {
          // Quota gate: check workspace daily AL quota before inserting
          const quotaAllowed = await checkQuota(targetWorkspaceId)
          if (!quotaAllowed) {
            safeLog(`${LOG_PREFIX} Workspace ${targetWorkspaceId} quota exhausted, skipping lead insert for event ${eventId}`)
            await supabase
              .from('audiencelab_events')
              .update({ processed: true, error: 'quota_exhausted' })
              .eq('id', eventId)
            return { success: false, error: 'quota_exhausted' }
          }

          // Create new lead
          const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert({
              workspace_id: targetWorkspaceId,
              email: normalized.primary_email,
              first_name: normalized.first_name,
              last_name: normalized.last_name,
              full_name: [normalized.first_name, normalized.last_name].filter(Boolean).join(' ') || null,
              company_name: normalized.company_name || 'Unknown',
              company_domain: normalized.company_domain,
              job_title: normalized.job_title,
              phone: normalized.phones[0] || null,
              state: normalized.state || null,
              state_code: normalized.state || null,
              city: normalized.city || null,
              company_industry: normalized.company_industry || null,
              company_location: (normalized.city || normalized.state) ? {
                city: normalized.city,
                state: normalized.state,
              } : null,
              source,
              enrichment_status: 'enriched',
              delivery_status: 'pending',
              hash_key: dedupResult.hashKey,
              qualification_score: normalized.deliverability_score,
              status: 'new',
                  // v4 enrichment fields (present when AL resolution data is rich)
                  ...(normalized.department && { department: normalized.department }),
                  ...(normalized.seniority_level && { seniority_level: normalized.seniority_level }),
                  ...(normalized.company_revenue && { company_revenue: normalized.company_revenue }),
                  ...(normalized.company_employee_count && { company_employee_count: normalized.company_employee_count }),
                  ...(normalized.landing_url && { page_url: normalized.landing_url }),
                  ...(normalized.dnc_mobile && { dnc_mobile: normalized.dnc_mobile }),
                  ...(normalized.dnc_landline && { dnc_landline: normalized.dnc_landline }),
            })
            .select('id')
            .maybeSingle()

          if (leadError) {
            safeError(`${LOG_PREFIX} Failed to create lead`, leadError)
          } else if (newLead) {
            leadId = newLead.id
            isNewLead = true

            // Increment daily quota counter for this workspace
            await incrementQuota(targetWorkspaceId, 1)

            // Link identity to new lead
            await supabase
              .from('audiencelab_identities')
              .update({ lead_id: newLead.id })
              .eq('id', identityId!)
          }
        }
      }
    }

    // Step 5: Route lead to users (only for new leads)
    if (leadId && isNewLead) {
      try {
        // Get lead data for matching
        const { data: lead } = await supabase
          .from('leads')
          .select('id, company_industry, state_code, state, city, postal_code')
          .eq('id', leadId)
          .maybeSingle()

        if (lead) {
          // Get all active user targeting for this workspace
          const { data: targetingUsers } = await supabase
            .from('user_targeting')
            .select('user_id, target_industries, target_states, target_cities, target_zips, daily_lead_cap, daily_lead_count, weekly_lead_cap, weekly_lead_count, monthly_lead_cap, monthly_lead_count')
            .eq('workspace_id', targetWorkspaceId)
            .eq('is_active', true)

          if (targetingUsers?.length) {
            const leadState = lead.state_code || lead.state
            const leadIndustry = lead.company_industry
            let assignedCount = 0

            for (const ut of targetingUsers) {
              // Check caps
              if (ut.daily_lead_cap && ut.daily_lead_count >= ut.daily_lead_cap) continue
              if (ut.weekly_lead_cap && ut.weekly_lead_count >= ut.weekly_lead_cap) continue
              if (ut.monthly_lead_cap && ut.monthly_lead_count >= ut.monthly_lead_cap) continue

              // Check geo match
              let matchedGeo: string | null = null
              const hasGeo = (ut.target_states?.length > 0) || (ut.target_cities?.length > 0) || (ut.target_zips?.length > 0)
              if (hasGeo) {
                if (leadState && ut.target_states?.includes(leadState)) {
                  matchedGeo = leadState
                } else if (lead.city && ut.target_cities?.some((c: string) => c.toLowerCase() === lead.city.toLowerCase())) {
                  matchedGeo = lead.city
                } else if (lead.postal_code && ut.target_zips?.includes(lead.postal_code)) {
                  matchedGeo = lead.postal_code
                } else {
                  continue
                }
              }

              // Check industry match
              let matchedIndustry: string | null = null
              const hasIndustry = (ut.target_industries?.length > 0)
              if (hasIndustry) {
                if (leadIndustry && ut.target_industries?.includes(leadIndustry)) {
                  matchedIndustry = leadIndustry
                } else {
                  continue
                }
              }

              if (!hasGeo && !hasIndustry) continue

              // Create user_lead_assignment
              const { error: assignErr } = await supabase
                .from('user_lead_assignments')
                .insert({
                  workspace_id: targetWorkspaceId,
                  lead_id: lead.id,
                  user_id: ut.user_id,
                  matched_industry: matchedIndustry,
                  matched_geo: matchedGeo,
                  source: `audiencelab_${source}`,
                  status: 'new',
                })

              if (assignErr) {
                if (assignErr.code === '23505') continue // Duplicate
                safeError(`${LOG_PREFIX} Failed to assign lead to user ${ut.user_id}`, assignErr)
                continue
              }

              // Set assigned_user_id on lead (first match wins)
              await supabase
                .from('leads')
                .update({ assigned_user_id: ut.user_id })
                .eq('id', lead.id)
                .is('assigned_user_id', null)

              // Increment user lead counts
              await supabase
                .from('user_targeting')
                .update({
                  daily_lead_count: (ut.daily_lead_count || 0) + 1,
                  weekly_lead_count: (ut.weekly_lead_count || 0) + 1,
                  monthly_lead_count: (ut.monthly_lead_count || 0) + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', ut.user_id)
                .eq('workspace_id', targetWorkspaceId)

              assignedCount++
            }

            if (assignedCount > 0) {
              safeLog(`${LOG_PREFIX} Lead ${leadId} assigned to ${assignedCount} user(s)`)
            }
          }
        }
      } catch (err) {
        safeError(`${LOG_PREFIX} User routing failed for lead ${leadId}`, err)
      }
    }

    // Step 6: Fire Inngest events for new leads (non-blocking, fire-and-forget)
    // This triggers: email notification, Slack/Zapier, old+new webhook delivery (with retries)
    if (leadId && isNewLead) {
      const leadPayload = {
        id: leadId,
        email: normalized.primary_email,
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        full_name: [normalized.first_name, normalized.last_name].filter(Boolean).join(' ') || null,
        company_name: normalized.company_name,
        company_domain: normalized.company_domain,
        job_title: normalized.job_title,
        phone: normalized.phones[0] || null,
        city: normalized.city,
        state: normalized.state,
        source: `audiencelab_${source}`,
        created_at: new Date().toISOString(),
      }

      // Triggers: sendLeadEmailNotification, deliverLeadWebhook, sendLeadNotifications
      fireInngestEvent('lead/created', {
        lead_id: leadId,
        workspace_id: targetWorkspaceId,
        source: `audiencelab_${source}`,
      })

      // Triggers: deliverOutboundWebhooks (fan-out to all user-configured endpoints)
      fireInngestEvent('outbound-webhook/deliver', {
        workspace_id: targetWorkspaceId,
        event_type: 'lead.received',
        payload: leadPayload,
      })

      // Triggers: ghlSyncContact — pushes lead to client's connected GHL account (if any)
      // The function gracefully no-ops when no GHL OAuth connection is configured.
      fireInngestEvent('ghl/sync-contact', {
        workspace_id: targetWorkspaceId,
        lead_id: leadId,
      })
    }

    // Step 7: Mark event as processed
    await supabase
      .from('audiencelab_events')
      .update({
        processed: true,
        lead_id: leadId || null,
        identity_id: identityId,
      })
      .eq('id', eventId)

    safeLog(`${LOG_PREFIX} Processed event ${eventId}: identity=${identityId}, lead=${leadId}, new_lead=${isNewLead}`)

    return { success: true, lead_id: leadId || undefined, identity_id: identityId || undefined }
  } catch (error) {
    safeError(`${LOG_PREFIX} Failed to process event ${eventId}`, error)
    // Try to mark as processed with error
    try {
      const supabase = createAdminClient()
      await supabase
        .from('audiencelab_events')
        .update({
          processed: true,
          error: error instanceof Error ? error.message : 'Unknown processing error',
        })
        .eq('id', eventId)
    } catch {
      // Last resort - can't even mark as processed
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
