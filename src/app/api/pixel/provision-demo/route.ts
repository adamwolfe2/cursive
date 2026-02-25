/**
 * Public endpoint for generating a demo pixel during live sales calls.
 * No authentication required — called directly from the marketing site deck browser.
 * Stores the pixel in DB with workspace_id = null so it can be claimed on signup.
 */
import { NextRequest, NextResponse } from 'next/server'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export const maxDuration = 60 // Vercel Pro allows up to 60s

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

function parsePublicUrl(raw: string): { domain: string; fullUrl: string } | null {
  try {
    const full = raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`
    const parsed = new URL(full)
    const host = parsed.hostname
    if (
      host === 'localhost' ||
      /^127\.\d+\.\d+\.\d+$/.test(host) ||
      /^(\d+\.){3}\d+$/.test(host) ||
      !host.includes('.')
    ) return null
    return { domain: host, fullUrl: full }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { websiteUrl } = body as { websiteUrl?: string }

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400, headers: CORS })
    }

    const parsed = parsePublicUrl(websiteUrl)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Please enter a valid public website URL (e.g. yourcompany.com)' },
        { status: 400, headers: CORS }
      )
    }

    const { domain, fullUrl } = parsed
    const websiteName = domain.replace(/^www\./, '')
    const adminSupabase = createAdminClient()

    // Idempotency: if a recent unclaimed demo pixel exists for this domain, return it
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: existingDemo } = await adminSupabase
      .from('audiencelab_pixels')
      .select('pixel_id, snippet, install_url, domain')
      .is('workspace_id', null)
      .eq('domain', domain)
      .eq('trial_status', 'demo')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingDemo) {
      return NextResponse.json(
        {
          pixel_id: existingDemo.pixel_id,
          snippet: existingDemo.snippet,
          install_url: existingDemo.install_url,
          domain: existingDemo.domain,
          demo_claimed: false,
        },
        { headers: CORS }
      )
    }

    // Create a new pixel via AudienceLab API
    const result = await provisionCustomerPixel({
      websiteName,
      websiteUrl: fullUrl,
    })

    const installUrl = result.install_url
    const snippet =
      result.script ||
      (installUrl ? `<script src="${installUrl}" async></script>` :
        `<script src="https://cdn.v3.identitypxl.app/pixels/${result.pixel_id}/p.js" async></script>`)

    // Store in DB with workspace_id = null so it can be claimed on signup
    const { error: insertError } = await adminSupabase
      .from('audiencelab_pixels')
      .insert({
        pixel_id: result.pixel_id,
        workspace_id: null,
        domain,
        label: websiteName,
        is_active: true,
        install_url: installUrl,
        snippet,
        trial_status: 'demo',
        trial_ends_at: null, // trial clock starts when workspace claims it
      })

    if (insertError) {
      // DB storage failed but pixel was created in AL — still return it, just log the failure
      safeError('[provision-demo] DB insert failed (pixel still usable):', insertError)
    }

    return NextResponse.json(
      { pixel_id: result.pixel_id, snippet, install_url: installUrl, domain, demo_claimed: false },
      { headers: CORS }
    )
  } catch (err) {
    safeError('[provision-demo] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate pixel — please try again' },
      { status: 502, headers: CORS }
    )
  }
}
