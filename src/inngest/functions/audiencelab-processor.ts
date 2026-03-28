/**
 * Audience Labs Event Processor
 *
 * Inngest function that processes raw audiencelab_events:
 * 1. Parse raw payload using schemas
 * 2. Normalize fields → upsert audiencelab_identities
 * 3. Create/update lead in leads table
 * 4. Route lead via LeadRoutingService
 * 5. Send Slack notification via notifyNewLead
 * 6. Mark event as processed
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeALPayload, extractEventType, isLeadWorthy, isVerifiedEmail } from '@/lib/audiencelab/field-map'
import { meetsQualityBar } from '@/lib/services/lead-quality.service'
import { checkDuplicate } from '@/lib/services/deduplication.service'
import { LeadRoutingService } from '@/lib/services/lead-routing.service'
import { notifyNewLead } from '@/lib/services/lead-notifications.service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Processor]'

export const processAudienceLabEvent = inngest.createFunction(
  {
    id: 'audiencelab-process-event',
    name: 'Process Audience Labs Event',
    retries: 3,
    timeouts: { finish: '5m' },
    throttle: {
      limit: 50,
      period: '1m',
    },
  },
  { event: 'audiencelab/event-received' },
  async ({ event, step, logger }) => {
    const { event_id, workspace_id, source } = event.data
    const supabase = createAdminClient()

    // Step 1: Fetch raw event
    const rawEvent = await step.run('fetch-raw-event', async () => {
      const { data, error } = await supabase
        .from('audiencelab_events')
        .select('*')
        .eq('id', event_id)
        .maybeSingle()

      if (error || !data) {
        throw new Error(`Event not found: ${event_id} — ${error?.message}`)
      }

      // Idempotency: skip if already processed
      if (data.processed) {
        return { ...data, _skip: true }
      }

      return data
    })

    if ((rawEvent as any)._skip) {
      logger.info(`${LOG_PREFIX} Event ${event_id} already processed, skipping`)
      return { skipped: true, event_id }
    }

    // Step 2: Normalize fields → upsert identity
    const identity = await step.run('normalize-and-upsert-identity', async () => {
      const normalized = normalizeALPayload(rawEvent.raw)

      // Skip if no identifiable information
      if (!normalized.primary_email && !normalized.profile_id && !normalized.hem_sha256) {
        safeLog(`${LOG_PREFIX} No identifiable info in event ${event_id}, marking as processed`)
        await supabase
          .from('audiencelab_events')
          .update({ processed: true, error: 'No identifiable information' })
          .eq('id', event_id)
        return null
      }

      // Find existing identity by priority: profile_id > uid > hem_sha256 > primary_email
      let existingIdentity = null

      if (normalized.profile_id) {
        const { data } = await supabase
          .from('audiencelab_identities')
          .select('id, visit_count')
          .eq('profile_id', normalized.profile_id)
          .maybeSingle()
        existingIdentity = data
      }

      if (!existingIdentity && normalized.uid) {
        const { data } = await supabase
          .from('audiencelab_identities')
          .select('id, visit_count')
          .eq('uid', normalized.uid)
          .limit(1)
          .maybeSingle()
        existingIdentity = data
      }

      if (!existingIdentity && normalized.hem_sha256) {
        const { data } = await supabase
          .from('audiencelab_identities')
          .select('id, visit_count')
          .eq('hem_sha256', normalized.hem_sha256)
          .limit(1)
          .maybeSingle()
        existingIdentity = data
      }

      if (!existingIdentity && normalized.primary_email) {
        const { data } = await supabase
          .from('audiencelab_identities')
          .select('id, visit_count')
          .contains('personal_emails', [normalized.primary_email])
          .limit(1)
          .maybeSingle()
        existingIdentity = data
      }

      const targetWorkspaceId = workspace_id || rawEvent.workspace_id

      if (existingIdentity) {
        // Update existing identity
        const { data: updated, error: updateError } = await supabase
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
          .select('id, lead_id')
          .maybeSingle()

        if (updateError) {
          throw new Error(`Failed to update identity: ${updateError.message}`)
        }

        return { ...normalized, identity_id: updated!.id, existing_lead_id: updated!.lead_id, is_new: false }
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
          throw new Error(`Failed to insert identity: ${insertError.message}`)
        }

        return { ...normalized, identity_id: inserted!.id, existing_lead_id: null, is_new: true }
      }
    })

    // If no identity created (no identifiable info), we're done
    if (!identity) {
      return { skipped: true, event_id, reason: 'no_identifiable_info' }
    }

    // Determine event type for lead-worthiness check
    const eventType = extractEventType(rawEvent.raw || {})

    // Step 3: Create or update lead
    const leadResult = await step.run('upsert-lead', async () => {
      const targetWorkspaceId = workspace_id || rawEvent.workspace_id

      // If identity already has a lead, update it (always, regardless of event type)
      if (identity.existing_lead_id) {
        const updateFields: Record<string, any> = {
          updated_at: new Date().toISOString(),
        }

        if (identity.first_name) updateFields.first_name = identity.first_name
        if (identity.last_name) updateFields.last_name = identity.last_name
        if (identity.company_name) updateFields.company_name = identity.company_name
        if (identity.company_domain) updateFields.company_domain = identity.company_domain
        if (identity.job_title) updateFields.job_title = identity.job_title
        if (identity.phones.length > 0) updateFields.phone = identity.phones[0]
        if (identity.state) {
          updateFields.state = identity.state
          updateFields.state_code = identity.state // AL provides state codes (e.g. 'FL', 'CA')
        }
        if (identity.city) updateFields.city = identity.city
        if (identity.company_industry) updateFields.company_industry = identity.company_industry
        if (identity.city || identity.state) {
          updateFields.company_location = {
            city: identity.city,
            state: identity.state,
          }
        }

        await supabase
          .from('leads')
          .update(updateFields)
          .eq('id', identity.existing_lead_id)
          .eq('workspace_id', targetWorkspaceId)

        return { lead_id: identity.existing_lead_id, is_new_lead: false }
      }

      // No existing lead — check lead-worthiness policy before creating
      if (!identity.primary_email) {
        return { lead_id: null, is_new_lead: false, reason: 'no_email' }
      }

      // Lead-worthiness gate: all events must pass quality checks
      const worthy = isLeadWorthy({
        eventType,
        deliverabilityScore: identity.deliverability_score,
        hasVerifiedEmail: isVerifiedEmail(identity.email_validation_status),
        hasBusinessEmail: identity.business_emails.length > 0,
        hasPhone: identity.phones.length > 0,
        hasName: !!(identity.first_name && identity.last_name),
        hasCompany: !!identity.company_name?.trim(),
      })
      if (!worthy) {
        return { lead_id: null, is_new_lead: false, reason: 'not_lead_worthy' }
      }

      // Field-completeness gate: requires name, email, phone, and location
      const qualityCheck = meetsQualityBar({
        first_name: identity.first_name,
        last_name: identity.last_name,
        company_name: identity.company_name,
        email: identity.primary_email,
        phone: identity.phones[0] || null,
        city: identity.city || null,
        state: identity.state || null,
      })
      if (!qualityCheck.passes) {
        return { lead_id: null, is_new_lead: false, reason: `quality_gate_${qualityCheck.reason}` }
      }

      const dedupResult = await checkDuplicate(
        identity.primary_email,
        identity.company_domain,
        identity.phones[0] || null,
        'platform' // AL leads are platform-owned
      )

      if (dedupResult.isDuplicate) {
        // Link identity to existing lead
        await supabase
          .from('audiencelab_identities')
          .update({ lead_id: dedupResult.existingLeadId })
          .eq('id', identity.identity_id)

        return {
          lead_id: dedupResult.existingLeadId,
          is_new_lead: false,
          reason: 'duplicate',
        }
      }

      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          workspace_id: targetWorkspaceId,
          email: identity.primary_email,
          first_name: identity.first_name,
          last_name: identity.last_name,
          company_name: identity.company_name || null,
          company_domain: identity.company_domain,
          job_title: identity.job_title,
          phone: identity.phones[0] || null,
          state: identity.state || null,
          state_code: identity.state || null,  // AL provides state codes (e.g. 'FL', 'CA')
          city: identity.city || null,
          company_industry: identity.company_industry || null,
          company_location: identity.city || identity.state ? {
            city: identity.city,
            state: identity.state,
          } : null,
          source: 'audiencelab',
          enrichment_status: 'enriched',
          delivery_status: 'pending',
          hash_key: dedupResult.hashKey,
          intent_score: identity.deliverability_score,
          raw_data: {
            audiencelab_identity_id: identity.identity_id,
            deliverability_score: identity.deliverability_score,
            email_validation_status: identity.email_validation_status,
            source: source,
          },
          // v4-specific enrichment fields (already in schema from prior migrations)
          seniority_level: identity.seniority_level || null,
          department: identity.department || null,
          net_worth: identity.net_worth || null,
          income_range: identity.income_range || null,
          dnc_mobile: identity.dnc_mobile,
          dnc_landline: identity.dnc_landline,
          individual_linkedin_url: identity.individual_linkedin_url || null,
          job_title_history: identity.job_title_history || null,
          // Demographics (new in 20260226000001)
          age_range: identity.age_range || null,
          gender: identity.gender || null,
          children: identity.children || null,
          homeowner: identity.homeowner,
          married: identity.married,
          personal_zip4: identity.personal_zip4 || null,
          // Phone lists (new in 20260226000001)
          all_landlines: identity.all_landlines.length > 0 ? identity.all_landlines : undefined,
          all_mobiles: identity.all_mobiles.length > 0 ? identity.all_mobiles : undefined,
          // Professional (new in 20260226000001)
          headline: identity.headline || null,
          inferred_years_experience: identity.inferred_years_experience || null,
          company_name_history: identity.company_name_history.length > 0 ? identity.company_name_history : undefined,
          education_history: identity.education_history || null,
          // Company extended (new in 20260226000001)
          company_address: identity.company_address || null,
          company_city: identity.company_city || null,
          company_state: identity.company_state || null,
          company_zip: identity.company_zip || null,
          company_phone: identity.company_phone || null,
          company_sic: identity.company_sic || null,
          company_naics: identity.company_naics || null,
          // Social (new in 20260226000001)
          individual_twitter_url: identity.individual_twitter_url || null,
          individual_facebook_url: identity.individual_facebook_url || null,
          // Profile (new in 20260226000001)
          skills: identity.skills.length > 0 ? identity.skills : undefined,
          interests: identity.interests.length > 0 ? identity.interests : undefined,
          // Identity hashes (new in 20260226000001)
          sha256_personal_email: identity.sha256_personal_email || null,
          sha256_business_email: identity.sha256_business_email || null,
          personal_verified_emails: identity.personal_verified_emails.length > 0 ? identity.personal_verified_emails : undefined,
          business_verified_emails: identity.business_verified_emails.length > 0 ? identity.business_verified_emails : undefined,
        })
        .select('id')
        .maybeSingle()

      if (leadError) {
        throw new Error(`Failed to create lead: ${leadError.message}`)
      }

      // Link identity to new lead
      await supabase
        .from('audiencelab_identities')
        .update({ lead_id: newLead!.id })
        .eq('id', identity.identity_id)

      return { lead_id: newLead!.id, is_new_lead: true }
    })

    // Step 4: Route lead (only for new leads)
    if (leadResult.lead_id && leadResult.is_new_lead) {
      await step.run('route-lead', async () => {
        try {
          const targetWorkspaceId = workspace_id || rawEvent.workspace_id
          await LeadRoutingService.routeLead({
            leadId: leadResult.lead_id!,
            sourceWorkspaceId: targetWorkspaceId,
            userId: 'system', // platform-owned background job
          })
        } catch (err) {
          // Routing failure is non-fatal — lead is queued for retry
          safeError(`${LOG_PREFIX} Routing failed for lead ${leadResult.lead_id}`, err)
        }
      })

      // Also route to individual users based on their targeting preferences
      // NOTE: Uses admin client directly because UserLeadRouterService uses
      // createClient() which requires cookies (unavailable in Inngest context)
      await step.run('route-lead-to-users', async () => {
        try {
          const targetWorkspaceId = workspace_id || rawEvent.workspace_id

          // Get lead data for matching
          const { data: lead } = await supabase
            .from('leads')
            .select('id, company_industry, state_code, state, city, postal_code')
            .eq('id', leadResult.lead_id!)
            .maybeSingle()

          if (!lead) return

          // Get all active user targeting for this workspace (cap at 200 users)
          const { data: targetingUsers } = await supabase
            .from('user_targeting')
            .select('user_id, target_industries, target_states, target_cities, target_zips, daily_lead_cap, daily_lead_count, weekly_lead_cap, weekly_lead_count, monthly_lead_cap, monthly_lead_count')
            .eq('workspace_id', targetWorkspaceId)
            .eq('is_active', true)
            .limit(200)

          if (!targetingUsers?.length) return

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

            // Create user_lead_assignment (junction record for My Leads page)
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
              .eq('workspace_id', targetWorkspaceId)
              .is('assigned_user_id', null)

            // Increment user lead counts atomically to avoid race conditions
            // when multiple Inngest invocations process leads simultaneously
            await supabase.rpc('increment_user_targeting_counts', {
              p_user_id: ut.user_id,
              p_workspace_id: targetWorkspaceId,
            })

            assignedCount++
          }

          if (assignedCount > 0) {
            safeLog(`${LOG_PREFIX} Lead ${leadResult.lead_id} assigned to ${assignedCount} user(s)`)
          }
        } catch (err) {
          // User routing failure is non-fatal
          safeError(`${LOG_PREFIX} User routing failed for lead ${leadResult.lead_id}`, err)
        }
      })
    }

    // Step 4b: Auto-enrich new leads with free intelligence tier (BuiltWith + EmailRep)
    if (leadResult.lead_id && leadResult.is_new_lead) {
      await step.run('auto-enrich-free-tier', async () => {
        try {
          await inngest.send({
            name: 'enrichment/batch',
            data: {
              workspace_id: workspace_id || rawEvent.workspace_id,
              lead_ids: [leadResult.lead_id!],
              providers: ['builtwith', 'emailrep'],
              priority: 'normal',
            },
          })
        } catch (err) {
          // Non-fatal — enrichment is background
          safeError(`${LOG_PREFIX} Auto-enrich trigger failed`, err)
        }
      })
    }

    // Step 5: Send notifications (only for new leads)
    if (leadResult.lead_id && leadResult.is_new_lead) {
      await step.run('notify', async () => {
        const targetWorkspaceId = workspace_id || rawEvent.workspace_id
        try {
          await notifyNewLead(targetWorkspaceId, {
            lead_id: leadResult.lead_id!,
            email: identity.primary_email || undefined,
            first_name: identity.first_name || undefined,
            last_name: identity.last_name || undefined,
            company_name: identity.company_name || undefined,
            title: identity.job_title || undefined,
            phone: identity.phones[0] || undefined,
            city: identity.city || undefined,
            state: identity.state || undefined,
            intent_score: identity.deliverability_score,
            source: `audiencelab_${source}`,
          })
        } catch (err) {
          // Notification failure is non-fatal
          safeError(`${LOG_PREFIX} Notification failed`, err)
        }
      })
    }

    // Step 6: Mark event as processed
    await step.run('mark-processed', async () => {
      await supabase
        .from('audiencelab_events')
        .update({
          processed: true,
          lead_id: leadResult.lead_id || null,
          identity_id: identity.identity_id,
        })
        .eq('id', event_id)
    })

    // Emit identity-updated event
    if (identity.identity_id) {
      await step.sendEvent('identity-updated', {
        name: 'audiencelab/identity-updated',
        data: {
          identity_id: identity.identity_id,
          workspace_id: workspace_id || rawEvent.workspace_id || '',
          lead_id: leadResult.lead_id || undefined,
        },
      })
    }

    logger.info(`${LOG_PREFIX} Processed event ${event_id}`, {
      identity_id: identity.identity_id,
      lead_id: leadResult.lead_id,
      is_new_lead: leadResult.is_new_lead,
      source,
    })

    return {
      event_id,
      identity_id: identity.identity_id,
      lead_id: leadResult.lead_id,
      is_new_lead: leadResult.is_new_lead,
    }
  }
)
