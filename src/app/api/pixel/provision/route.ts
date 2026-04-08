
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { processEventInline } from '@/lib/audiencelab/edge-processor'

// Note: edge runtime — fire Inngest events via HTTP API, not SDK

/** Fire a pixel/provisioned event to Inngest (edge-safe, non-blocking) */
async function firePixelProvisionedEvent(data: {
  workspace_id: string
  pixel_id: string
  domain: string
  trial_ends_at: string
}) {
  const eventKey = process.env.INNGEST_EVENT_KEY
  if (!eventKey) return

  fetch('https://inn.gs/e/' + eventKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'pixel/provisioned',
      data,
    }),
  }).catch((err) => safeError('[PixelProvision] Fire-and-forget failed:', err)) // fire-and-forget, errors logged only
}

/**
 * Backfill orphaned visitor events to a newly-claimed pixel's workspace.
 *
 * When a pixel is installed during a sales call BEFORE the user signs up,
 * events flow to the webhook while `workspace_id` is still null. Those events
 * get stored with `workspace_id = null, processed = false` and are never
 * materialized into leads.
 *
 * When the user finally signs up and claims the pixel, we run this helper to:
 *   1. Flip those orphaned events onto the new workspace
 *   2. Re-run processEventInline on each one so they become real leads
 *
 * Best-effort — failures are logged but don't break the claim flow.
 */
async function backfillOrphanedEvents(
  supabase: SupabaseClient,
  pixelId: string,
  workspaceId: string,
): Promise<{ assigned: number; processed: number }> {
  try {
    // Find orphaned events for this pixel (up to 500 — if there are more,
    // the user had serious traffic during their trial and we'll handle the
    // rest via a separate backfill job)
    const { data: orphans, error: fetchErr } = await supabase
      .from('audiencelab_events')
      .select('id, processed')
      .eq('pixel_id', pixelId)
      .is('workspace_id', null)
      .limit(500)

    if (fetchErr) {
      safeError('[PixelProvision] Backfill fetch failed:', fetchErr)
      return { assigned: 0, processed: 0 }
    }
    if (!orphans || orphans.length === 0) {
      return { assigned: 0, processed: 0 }
    }

    // Flip workspace_id on all orphans at once
    const { error: updateErr } = await supabase
      .from('audiencelab_events')
      .update({ workspace_id: workspaceId })
      .eq('pixel_id', pixelId)
      .is('workspace_id', null)

    if (updateErr) {
      safeError('[PixelProvision] Backfill workspace update failed:', updateErr)
      return { assigned: 0, processed: 0 }
    }

    safeLog(`[PixelProvision] Backfilled ${orphans.length} orphan events to workspace ${workspaceId}`)

    // Re-run inline processing for each unprocessed orphan
    let processedCount = 0
    for (const orphan of orphans) {
      if (orphan.processed) continue
      try {
        const result = await processEventInline(orphan.id, workspaceId, 'superpixel')
        if (result.success) processedCount++
      } catch (err) {
        safeError('[PixelProvision] Backfill processing failed for event:', err)
      }
    }

    return { assigned: orphans.length, processed: processedCount }
  } catch (err) {
    safeError('[PixelProvision] Backfill unexpected error:', err)
    return { assigned: 0, processed: 0 }
  }
}

const provisionSchema = z.object({
  website_url: z.string().url().refine((url) => {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname
      // Reject localhost, raw IPs, and internal hostnames
      if (hostname === 'localhost' || hostname === '127.0.0.1') return false
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false
      if (!hostname.includes('.')) return false
      return true
    } catch {
      return false
    }
  }, 'Please enter a valid public website URL'),
  website_name: z.string().max(200).optional(),
  /**
   * When present, claim this specific pixel_id for the current workspace
   * instead of relying on email-domain matching. Used by the post-sales-call
   * signup flow to deterministically claim the pixel the prospect was given
   * during the call, regardless of whether the prospect's signup email
   * happens to match the pixel's domain.
   */
  claim_pixel_id: z.string().trim().min(1).max(200).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    // Only workspace owners/admins can provision pixels
    if (user.role && !['owner', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners or admins can create pixels' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = provisionSchema.parse(body)

    const adminSupabase = createAdminClient()

    // Extract input domain — strip www. so comparisons / demo lookups match
    // regardless of prefix.
    const domain = new URL(validated.website_url).hostname.replace(/^www\./, '')
    const websiteName = validated.website_name || domain

    // ─── Deterministic claim-by-ID path ─────────────────────────────────
    // If the signup flow passed a specific pixel_id (from the post-sales-call
    // recap email link), claim THAT exact pixel, regardless of whether the
    // user's email domain matches. This is the only way to guarantee a
    // prospect who installed a demo pixel during a sales call keeps the same
    // pixel after they sign up — email-domain matching is fragile (breaks on
    // gmail signups, mismatched email vs site domains, etc).
    if (validated.claim_pixel_id) {
      const { data: claimablePixel } = await adminSupabase
        .from('audiencelab_pixels')
        .select('id, pixel_id, workspace_id, domain, snippet, install_url, trial_status, trial_ends_at, label')
        .eq('pixel_id', validated.claim_pixel_id)
        .maybeSingle()

      if (claimablePixel) {
        // Already claimed by this workspace → idempotent return
        if (claimablePixel.workspace_id === user.workspace_id) {
          return NextResponse.json({
            pixel_id: claimablePixel.pixel_id,
            snippet: claimablePixel.snippet,
            install_url: claimablePixel.install_url,
            domain: claimablePixel.domain,
            existing: true,
            claimed_by_id: false,
          })
        }

        // Claimable → claim it, backfill orphaned events, return
        if (claimablePixel.workspace_id === null) {
          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

          const { error: claimErr } = await adminSupabase
            .from('audiencelab_pixels')
            .update({
              workspace_id: user.workspace_id,
              trial_status: 'trial',
              trial_ends_at: trialEndsAt,
              is_active: true,
              label: claimablePixel.label || websiteName,
            })
            .eq('id', claimablePixel.id)
            .is('workspace_id', null) // guard against race condition

          if (!claimErr) {
            // Backfill any events that came in before the claim
            const backfill = await backfillOrphanedEvents(
              adminSupabase,
              claimablePixel.pixel_id,
              user.workspace_id,
            )

            firePixelProvisionedEvent({
              workspace_id: user.workspace_id,
              pixel_id: claimablePixel.pixel_id,
              domain: claimablePixel.domain || domain,
              trial_ends_at: trialEndsAt,
            })

            sendSlackAlert({
              type: 'pipeline_update',
              severity: 'info',
              message: `Pixel claimed by ID: ${claimablePixel.domain} — ${backfill.assigned} orphan events backfilled (${backfill.processed} processed into leads)`,
              metadata: {
                workspace_id: user.workspace_id,
                user: user.full_name || user.email,
                pixel_id: claimablePixel.pixel_id,
                domain: claimablePixel.domain,
                backfilled_assigned: backfill.assigned,
                backfilled_processed: backfill.processed,
              },
            }).catch((error) => {
              safeError('[Pixel Provision] Slack notification failed:', error)
            })

            return NextResponse.json({
              pixel_id: claimablePixel.pixel_id,
              snippet: claimablePixel.snippet,
              install_url: claimablePixel.install_url,
              domain: claimablePixel.domain || domain,
              claimed_by_id: true,
              backfilled_events: backfill.assigned,
              backfilled_leads: backfill.processed,
            })
          }

          // Claim update failed — log and fall through to normal flow
          safeError('[Pixel Provision] Claim-by-id update failed:', claimErr)
        } else {
          // Pixel is already claimed by a DIFFERENT workspace. Don't steal
          // it. Log for visibility, fall through to normal flow so the user
          // still gets a working pixel (for their own domain).
          safeError('[Pixel Provision] Claim-by-id rejected — pixel already claimed by another workspace', {
            attempted_by: user.workspace_id,
            owned_by: claimablePixel.workspace_id,
            pixel_id: claimablePixel.pixel_id,
          })
        }
      } else {
        // Pixel ID not found — log and fall through
        safeError('[Pixel Provision] Claim-by-id target not found:', {
          claim_pixel_id: validated.claim_pixel_id,
        })
      }
    }

    // Check if workspace already has an active pixel
    const { data: existingPixel } = await adminSupabase
      .from('audiencelab_pixels')
      .select('id, pixel_id, domain, is_active, snippet, install_url, label, created_at, trial_status, trial_ends_at')
      .eq('workspace_id', user.workspace_id)
      .eq('is_active', true)
      .maybeSingle()

    // Domain matches → idempotent return. The /setup wizard hits this path on
    // every step-1 submit so users can confirm their pre-filled URL without
    // re-provisioning anything in AL.
    if (existingPixel && existingPixel.domain === domain) {
      return NextResponse.json({
        pixel_id: existingPixel.pixel_id,
        snippet: existingPixel.snippet,
        install_url: existingPixel.install_url,
        domain: existingPixel.domain,
        existing: true,
      })
    }

    // Domain CHANGED → user is correcting a wrong default (most often: their
    // email domain ≠ their actual marketing site). Deactivate the old pixel
    // so its events stop routing to this workspace, then fall through to
    // provision a fresh one. Trial status carries over so users don't get a
    // free trial reset by simply changing the URL.
    const replacedPixel = existingPixel && existingPixel.domain !== domain
      ? existingPixel
      : null

    if (replacedPixel) {
      const { error: deactivateError } = await adminSupabase
        .from('audiencelab_pixels')
        .update({ is_active: false })
        .eq('id', replacedPixel.id)
        .eq('workspace_id', user.workspace_id)

      if (deactivateError) {
        // Non-fatal — log and continue. Worst case: workspace ends up with two
        // pixel rows, only the new one routing events.
        safeError('[Pixel Provision] Failed to deactivate replaced pixel:', deactivateError)
      }

      sendSlackAlert({
        type: 'pipeline_update',
        severity: 'info',
        message: `Workspace replaced pixel domain: ${replacedPixel.domain} → ${domain}`,
        metadata: {
          workspace_id: user.workspace_id,
          user: user.full_name || user.email,
          old_pixel_id: replacedPixel.pixel_id,
          old_domain: replacedPixel.domain,
          new_domain: domain,
        },
      }).catch((error) => {
        safeError('[Pixel Provision] Slack notification failed:', error)
      })
    }

    // Check for an unclaimed demo pixel from a sales call — claim it instead of creating new
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: demoPixel } = await adminSupabase
      .from('audiencelab_pixels')
      .select('id, pixel_id, snippet, install_url, domain, label')
      .is('workspace_id', null)
      .eq('domain', domain)
      .eq('trial_status', 'demo')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (demoPixel) {
      // If we just deactivated a replaced pixel, inherit its trial state so
      // the user doesn't get a fresh 14-day trial just by changing their URL.
      const trialEndsAt = replacedPixel?.trial_ends_at
        ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const trialStatus = replacedPixel?.trial_status ?? 'trial'

      const { error: claimError } = await adminSupabase
        .from('audiencelab_pixels')
        .update({
          workspace_id: user.workspace_id,
          trial_status: trialStatus,
          trial_ends_at: trialEndsAt,
          label: demoPixel.label || websiteName,
        })
        .eq('id', demoPixel.id)
        .is('workspace_id', null) // guard against race condition

      if (!claimError) {
        // Backfill any events received before the claim. For demo pixels
        // installed during a sales call, this migrates the visitor events
        // that arrived in the gap between install and signup into real,
        // processed leads on the new workspace.
        const backfill = await backfillOrphanedEvents(
          adminSupabase,
          demoPixel.pixel_id,
          user.workspace_id,
        )

        firePixelProvisionedEvent({
          workspace_id: user.workspace_id,
          pixel_id: demoPixel.pixel_id,
          domain: demoPixel.domain || domain,
          trial_ends_at: trialEndsAt,
        })

        sendSlackAlert({
          type: 'pipeline_update',
          severity: 'info',
          message: `Demo pixel claimed by ${domain} — ${backfill.assigned} orphan events backfilled (${backfill.processed} processed into leads) — trial ends ${trialEndsAt.split('T')[0]}`,
          metadata: {
            workspace_id: user.workspace_id,
            user: user.full_name || user.email,
            pixel_id: demoPixel.pixel_id,
            domain,
            backfilled_assigned: backfill.assigned,
            backfilled_processed: backfill.processed,
          },
        }).catch((error) => {
          safeError('[Pixel Provision] Slack notification failed:', error)
        })

        return NextResponse.json({
          pixel_id: demoPixel.pixel_id,
          snippet: demoPixel.snippet,
          install_url: demoPixel.install_url,
          domain: demoPixel.domain || domain,
          claimed_from_demo: true,
          backfilled_events: backfill.assigned,
          backfilled_leads: backfill.processed,
        })
      }

      // If claim failed (race condition — another request claimed it first), fall through to create new
      safeError('[Pixel Provision] Demo pixel claim race condition:', claimError)
    }

    // Provision pixel via AudienceLab API
    const result = await provisionCustomerPixel({
      websiteName,
      websiteUrl: validated.website_url,
    })

    // Build snippet from AL response — always trust AL's install_url so whichever pixel
    // version AudienceLab provisions (v3 today, v4 when they enable it on our account)
    // flows through without code changes. We only fall back to a derived snippet if AL
    // returns no install_url at all.
    const installUrl = result.install_url
    if (!installUrl && !result.script) {
      safeError('[API] Pixel provision: AL returned no install_url or script', { pixel_id: result.pixel_id })
      return NextResponse.json(
        { error: 'Pixel provisioning failed — upstream did not return an install URL. Our team has been notified.' },
        { status: 502 }
      )
    }
    const snippet = result.script || `<script src="${installUrl}" defer></script>`

    // Inherit trial status from a replaced pixel so changing the URL never
    // resets the trial clock. New users get a fresh 14-day trial.
    const trialEndsAt = replacedPixel?.trial_ends_at
      ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const trialStatus = replacedPixel?.trial_status ?? 'trial'

    // Store in audiencelab_pixels (install_url is primary, snippet is derived/optional)
    const { error: insertError } = await adminSupabase
      .from('audiencelab_pixels')
      .insert({
        pixel_id: result.pixel_id,
        workspace_id: user.workspace_id,
        domain,
        is_active: true,
        label: websiteName,
        install_url: installUrl,
        snippet,
        trial_ends_at: trialEndsAt,
        trial_status: trialStatus,
      })

    if (insertError) {
      // If it's a unique constraint violation (concurrent request), fetch and return existing
      if (insertError.code === '23505') {
        const { data: racePixel } = await adminSupabase
          .from('audiencelab_pixels')
          .select('pixel_id, domain, snippet, install_url')
          .eq('workspace_id', user.workspace_id)
          .eq('is_active', true)
          .maybeSingle()

        if (racePixel) {
          return NextResponse.json({
            pixel_id: racePixel.pixel_id,
            snippet: racePixel.snippet,
            install_url: racePixel.install_url,
            domain: racePixel.domain,
            existing: true,
          })
        }
      }

      safeError('[API] Pixel insert error:', insertError)
      // AL pixel was created but DB insert failed — log for recovery
      sendSlackAlert({
        type: 'webhook_failure',
        severity: 'error',
        message: `Pixel provisioned in AL but DB insert failed — needs manual recovery`,
        metadata: {
          workspace_id: user.workspace_id,
          al_pixel_id: result.pixel_id,
          domain,
          error: insertError.message,
        },
      }).catch((error) => {
        safeError('[Pixel Provision] Critical: Slack alert failed for DB insert error:', error)
      })

      return NextResponse.json(
        { error: 'Failed to save pixel. Our team has been notified.' },
        { status: 500 }
      )
    }

    // Fire pixel drip email sequence (non-blocking)
    firePixelProvisionedEvent({
      workspace_id: user.workspace_id,
      pixel_id: result.pixel_id,
      domain,
      trial_ends_at: trialEndsAt,
    })

    // Fire-and-forget Slack notification
    sendSlackAlert({
      type: 'pipeline_update',
      severity: 'info',
      message: `New pixel provisioned for ${domain} — trial ends ${trialEndsAt.split('T')[0]}`,
      metadata: {
        workspace_id: user.workspace_id,
        user: user.full_name || user.email,
        pixel_id: result.pixel_id,
        domain,
      },
    }).catch((error) => {
      safeError('[Pixel Provision] Slack notification failed:', error)
    })

    return NextResponse.json({
      pixel_id: result.pixel_id,
      snippet,
      install_url: installUrl,
      domain,
    })
  } catch (error) {
    safeError('[API] Pixel provision error:', error)
    return handleApiError(error)
  }
}
