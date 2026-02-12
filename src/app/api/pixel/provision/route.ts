import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'edge'

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
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id and role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id, full_name, role')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    // Only workspace owners/admins can provision pixels
    if (userData.role && !['owner', 'admin'].includes(userData.role)) {
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
      .eq('workspace_id', userData.workspace_id)
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

    // Build snippet from AL response: prefer script if provided, else derive from install_url
    const installUrl = result.install_url
    const snippet = result.script ||
      (installUrl ? `<script src="${installUrl}" async></script>` : null)

    // Store in audiencelab_pixels (install_url is primary, snippet is derived/optional)
    const { error: insertError } = await adminSupabase
      .from('audiencelab_pixels')
      .insert({
        pixel_id: result.pixel_id,
        workspace_id: userData.workspace_id,
        domain,
        is_active: true,
        label: websiteName,
        install_url: installUrl,
        snippet,
      })

    if (insertError) {
      // If it's a unique constraint violation (concurrent request), fetch and return existing
      if (insertError.code === '23505') {
        const { data: racePixel } = await adminSupabase
          .from('audiencelab_pixels')
          .select('pixel_id, domain, snippet, install_url')
          .eq('workspace_id', userData.workspace_id)
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

      console.error('[API] Pixel insert error:', insertError)
      // AL pixel was created but DB insert failed — log for recovery
      sendSlackAlert({
        type: 'webhook_failure',
        severity: 'error',
        message: `Pixel provisioned in AL but DB insert failed — needs manual recovery`,
        metadata: {
          workspace_id: userData.workspace_id,
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

    // Fire-and-forget Slack notification
    sendSlackAlert({
      type: 'pipeline_update',
      severity: 'info',
      message: `New pixel provisioned for ${domain}`,
      metadata: {
        workspace_id: userData.workspace_id,
        user: userData.full_name || user.email,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('[API] Pixel provision error:', error)
    return NextResponse.json(
      { error: 'Failed to provision pixel. Please try again.' },
      { status: 500 }
    )
  }
}
