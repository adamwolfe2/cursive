import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const webhookUrl = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          timestamp: new Date().toISOString(),
          source: 'superpixel_calculator',
        }),
      }).catch((err) => safeError('[LeadCapture] Pixel notify failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 })
  }
}
