/**
 * GET /api/funnel/[token]/visitors
 *
 * Returns identified visitors for the order's pixel, deduped by hashed
 * email. Token-gated AND scoped strictly to the order's own pixel_id,
 * so one buyer can never see another buyer's visitor stream.
 *
 * Query params:
 *   ?limit=50   — max recent visitors (default 50, capped at 200)
 *   ?days=90    — lookback window (default 90, capped at 365)
 *   ?format=csv — return a CSV download instead of JSON
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderByToken,
  getOrderVisitors,
} from '@/lib/funnel/order.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const DEFAULT_DAYS = 90
const MAX_DAYS = 365

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const lookup = await getOrderByToken(token)

    if (!lookup.ok) {
      return NextResponse.json(
        { error: 'Link no longer valid' },
        { status: lookup.error === 'not_found' ? 404 : 403 }
      )
    }

    const { order } = lookup.data

    // Audience-only orders have no pixel → no visitor stream
    if (!order.pixel_audiencelab_id) {
      return NextResponse.json({
        total: 0,
        recent: [],
        last_seen_at: null,
        has_pixel: false,
      })
    }

    const url = req.nextUrl
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') ?? '', 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )
    const days = Math.min(
      Math.max(parseInt(url.searchParams.get('days') ?? '', 10) || DEFAULT_DAYS, 1),
      MAX_DAYS
    )
    const format = url.searchParams.get('format')

    const feed = await getOrderVisitors(order.pixel_audiencelab_id, {
      limit,
      sinceDays: days,
    })

    if (format === 'csv') {
      const csv = toCsv(feed.recent)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="cursive-visitors-${order.id.slice(0, 8)}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json({
      ...feed,
      has_pixel: true,
    })
  } catch (err) {
    safeError('[funnel/visitors] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function toCsv(rows: Awaited<ReturnType<typeof getOrderVisitors>>['recent']): string {
  const headers = [
    'received_at',
    'first_name',
    'last_name',
    'full_name',
    'email',
    'company_name',
    'company_domain',
    'job_title',
    'city',
    'state',
    'country',
    'linkedin_url',
  ]
  const escape = (v: string | null | undefined): string => {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.received_at,
        r.first_name,
        r.last_name,
        r.full_name,
        r.email,
        r.company_name,
        r.company_domain,
        r.job_title,
        r.city,
        r.state,
        r.country,
        r.linkedin_url,
      ]
        .map(escape)
        .join(',')
    )
  }
  return lines.join('\n')
}
