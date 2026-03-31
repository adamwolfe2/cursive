import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { withRateLimit } from '@/lib/middleware/rate-limiter'

const BASE_URL = 'https://api.similarweb.com/v1/website'
const API_KEY = process.env.SIMILARWEB_API_KEY

const SAFE_SLUG_SEGMENT = /^[a-zA-Z0-9._-]+$/

function isValidSlug(segments: string[]): boolean {
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment.length <= 200 &&
      SAFE_SLUG_SEGMENT.test(segment) &&
      !segment.includes('..') &&
      !segment.startsWith('.')
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const rateLimited = await withRateLimit(req, 'default')
  if (rateLimited) return rateLimited

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: true, message: 'API key not configured' }, { status: 200 })
  }

  const { slug } = await params

  if (!slug.length || !isValidSlug(slug)) {
    return NextResponse.json(
      { error: 'Invalid path segments' },
      { status: 400 }
    )
  }

  const path = slug.join('/')
  const searchParams = req.nextUrl.searchParams
  const apiParams = new URLSearchParams(searchParams)
  apiParams.set('api_key', API_KEY)

  const url = `${BASE_URL}/${path}?${apiParams.toString()}`

  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: true, status: res.status }, { status: 200 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: true }, { status: 200 })
  }
}
