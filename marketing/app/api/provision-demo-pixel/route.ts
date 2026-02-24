import { NextRequest, NextResponse } from 'next/server'

const AL_API = 'https://api.audiencelab.io/pixels'

function parseUrl(raw: string): { domain: string; fullUrl: string } | null {
  try {
    const full = raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`
    const parsed = new URL(full)
    const host = parsed.hostname
    // Reject localhost / IPs / single-word hostnames
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

    const parsed = parseUrl(websiteUrl)
    if (!parsed) {
      return NextResponse.json({ error: 'Please enter a valid public website URL (e.g. yourcompany.com)' }, { status: 400 })
    }

    const { domain, fullUrl } = parsed
    const websiteName = domain.replace(/^www\./, '')

    const apiKey = process.env.AUDIENCELAB_ACCOUNT_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Pixel service not configured' }, { status: 503 })
    }

    const alRes = await fetch(AL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        website_name: websiteName,
        website_url: fullUrl,
      }),
    })

    if (!alRes.ok) {
      const errText = await alRes.text()
      console.error('[provision-demo-pixel] AL API error:', alRes.status, errText)
      return NextResponse.json({ error: 'Failed to generate pixel — please try again' }, { status: 502 })
    }

    const al = await alRes.json()
    const pixelId: string = al.pixel_id
    const installUrl: string = al.install_url
    const snippet: string =
      al.script ||
      `<script src="${installUrl}" async></script>`

    return NextResponse.json({ pixel_id: pixelId, snippet, install_url: installUrl, domain })
  } catch (err) {
    console.error('[provision-demo-pixel] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
