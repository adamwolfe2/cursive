
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

    // Check if workspace already has an active pixel — return it (idempotent)
    const { data: existingPixel } = await adminSupabase
      .from('audiencelab_pixels')
      .select('pixel_id, domain, is_active, snippet, install_url, label, created_at')
      .eq('workspace_id', user.workspace_id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingPixel) {
      // Idempotent: return existing pixel instead of 409
      return NextResponse.json({
        pixel_id: existingPixel.pixel_id,
        snippet: existingPixel.snippet,
        install_url: existingPixel.install_url,
        domain: existingPixel.domain,
        existing: true,
      })
    }

    // Extract domain from URL
    const domain = new URL(validated.website_url).hostname

    // Provision pixel via AudienceLab API
    const websiteName = validated.website_name || domain
    const result = await provisionCustomerPixel({
      websiteName,
      websiteUrl: validated.website_url,
    })

    // Build snippet from AL response: prefer script if provided, else derive from install_url,
    // else fallback to V3 SuperPixel CDN format using pixel_id
    const installUrl = result.install_url
    const snippet = result.script ||
      (installUrl ? `<script src="${installUrl}" defer></script>` :
        `<script src="https://cdn.v3.identitypxl.app/pixels/${result.pixel_id}/p.js" defer></script>`)

    // Trial ends 14 days from now
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

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
        trial_status: 'trial',
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
