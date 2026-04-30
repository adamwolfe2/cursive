export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { withRateLimit, getRequestIdentifier } from '@/lib/middleware/rate-limiter'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await withRateLimit(req, 'ai-qualify', getRequestIdentifier(req, user.id))
  if (rateLimited) return rateLimited

  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 })
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    const url = `https://api.microlink.io?url=https://${cleanDomain}&screenshot=true`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    let res: Response
    try {
      res = await fetch(url, { signal: controller.signal, next: { revalidate: 86400 } })
    } finally {
      clearTimeout(timeout)
    }
    if (!res.ok) {
      return NextResponse.json({ error: true }, { status: 200 })
    }

    const data = await res.json()
    return NextResponse.json({
      title: data.data?.title,
      description: data.data?.description,
      image: data.data?.image?.url || data.data?.screenshot?.url,
      favicon: `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
    })
  } catch {
    return NextResponse.json({ error: true }, { status: 200 })
  }
}
