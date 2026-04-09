export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Top Recipient Domains
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/domains
 *
 * Groups email_sends by recipient domain (extracted from to_email) for the
 * last 30 days and returns the top 20 domains by send volume with per-domain
 * open rate and bounce rate.
 *
 * Response shape per domain:
 *   domain       — e.g. "gmail.com"
 *   sent_count   — total sends to this domain
 *   open_count   — sends with opened_at set
 *   bounce_count — sends with bounced_at set
 *   open_rate    — percentage
 *   bounce_rate  — percentage
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- Types ----

interface DomainStats {
  sent_count: number
  open_count: number
  bounce_count: number
}

// ---- Helpers ----

function extractDomain(email: string): string {
  try {
    const at = email.lastIndexOf('@')
    if (at === -1) return 'unknown'
    return email.slice(at + 1).toLowerCase().trim()
  } catch {
    return 'unknown'
  }
}

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Domains] Querying email_sends for last 30 days')

    const { data: sends, error: sendsError } = await adminClient
      .from('email_sends')
      .select('to_email, opened_at, bounced_at')
      .gte('created_at', since)

    if (sendsError) {
      safeError('[EmailDeliverability/Domains] email_sends query error:', sendsError)
      return NextResponse.json({
        success: true,
        data: {
          domains: [],
          period_days: 30,
          total_rows_scanned: 0,
          note: 'email_sends table unavailable',
        },
      })
    }

    const rows = sends ?? []
    safeLog('[EmailDeliverability/Domains] Rows fetched:', rows.length)

    // Aggregate by recipient domain
    const domainMap = new Map<string, DomainStats>()

    for (const row of rows) {
      const domain = extractDomain(row.to_email ?? '')
      const entry = domainMap.get(domain) ?? { sent_count: 0, open_count: 0, bounce_count: 0 }
      entry.sent_count += 1
      if (row.opened_at != null) entry.open_count += 1
      if (row.bounced_at != null) entry.bounce_count += 1
      domainMap.set(domain, entry)
    }

    // Sort by volume descending, take top 20
    const sorted = Array.from(domainMap.entries())
      .sort((a, b) => b[1].sent_count - a[1].sent_count)
      .slice(0, 20)
      .map(([domain, stats]) => ({
        domain,
        sent_count: stats.sent_count,
        open_count: stats.open_count,
        bounce_count: stats.bounce_count,
        open_rate: Number(
          (stats.sent_count > 0 ? (stats.open_count / stats.sent_count) * 100 : 0).toFixed(2)
        ),
        bounce_rate: Number(
          (stats.sent_count > 0 ? (stats.bounce_count / stats.sent_count) * 100 : 0).toFixed(2)
        ),
      }))

    safeLog('[EmailDeliverability/Domains] Returning', sorted.length, 'domains')

    return NextResponse.json({
      success: true,
      data: {
        domains: sorted,
        period_days: 30,
        total_rows_scanned: rows.length,
      },
    })
  } catch (error: unknown) {
    safeError('[EmailDeliverability/Domains] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch domain stats' }, { status: 500 })
  }
}
