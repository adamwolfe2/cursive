
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

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
        // Fire the same pixel provisioned event and Slack notification
        firePixelProvisionedEvent({
          workspace_id: user.workspace_id,
          pixel_id: demoPixel.pixel_id,
          domain: demoPixel.domain || domain,
          trial_ends_at: trialEndsAt,
        })

        sendSlackAlert({
          type: 'pipeline_update',
          severity: 'info',
          message: `Demo pixel claimed by ${domain} — trial ends ${trialEndsAt.split('T')[0]}`,
          metadata: {
            workspace_id: user.workspace_id,
            user: user.full_name || user.email,
            pixel_id: demoPixel.pixel_id,
            domain,
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
