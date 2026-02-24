/**
 * Public endpoint for generating a demo pixel during live sales calls.
 * No authentication required — called from the marketing site deck.
 * Does NOT store in DB (prospect hasn't signed up yet).
 */
import { NextRequest, NextResponse } from 'next/server'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

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
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    const parsed = parsePublicUrl(websiteUrl)
    if (!parsed) {
      return NextResponse.json(
        { error: 'Please enter a valid public website URL (e.g. yourcompany.com)' },
        { status: 400 }
      )
    }

    const { domain, fullUrl } = parsed
    const websiteName = domain.replace(/^www\./, '')

    const result = await provisionCustomerPixel({
      websiteName,
      websiteUrl: fullUrl,
    })

    const installUrl = result.install_url
    const snippet =
      result.script ||
      (installUrl ? `<script src="${installUrl}" async></script>` :
        `<script src="https://cdn.v3.identitypxl.app/pixels/${result.pixel_id}/p.js" async></script>`)

    return NextResponse.json({
      pixel_id: result.pixel_id,
      snippet,
      install_url: installUrl,
      domain,
    })
  } catch (err) {
    safeError('[provision-demo] error:', err)
    return NextResponse.json({ error: 'Failed to generate pixel — please try again' }, { status: 502 })
  }
}
