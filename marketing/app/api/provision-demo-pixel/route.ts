/**
 * Proxies pixel provisioning requests to the dashboard app.
 * The dashboard app has AUDIENCELAB_ACCOUNT_API_KEY configured.
 */
import { NextRequest, NextResponse } from 'next/server'

const DASHBOARD_URL = 'https://leads.meetcursive.com'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { websiteUrl } = body as { websiteUrl?: string }

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    const res = await fetch(`${DASHBOARD_URL}/api/pixel/provision-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to generate pixel — please try again' },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[provision-demo-pixel] proxy error:', err)
    return NextResponse.json({ error: 'Network error — please try again' }, { status: 502 })
  }
}
