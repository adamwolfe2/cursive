export const runtime = 'nodejs'

/**
 * Admin Email Deliverability — Domain-Level Stats
 * Cursive Platform
 *
 * GET /api/admin/email-deliverability/domains
 *
 * Aggregates email open/bounce rates by recipient domain (gmail.com, yahoo.com, etc.)
 * from the email_sends table over the last 30 days. Returns top 20 domains.
 *
 * Auth: requireAdmin()
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ---- Types ----

interface DomainStat {
  domain: string
  sent_count: number
  open_count: number
  bounce_count: number
  open_rate: number
  bounce_rate: number
}

// ---- Helper ----

function extractDomain(email: string): string {
  try {
    const atIndex = email.lastIndexOf('@')
    if (atIndex === -1) return '(unknown)'
    return email.slice(atIndex + 1).toLowerCase().trim() || '(unknown)'
  } catch {
    return '(unknown)'
  }
}

// ---- GET handler ----

export async function GET() {
  try {
    await requireAdmin()

    const adminClient = createAdminClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    safeLog('[EmailDeliverability/Domains] Querying email_sends for last 30 days')

    // Fetch all sends in the period with only the fields we need
    const { data: rows, error } = await adminClient
      .from('email_sends')
      .select('to_email, opened_at, bounced_at')
      .gte('created_at', since)

    if (error) {
      safeError('[EmailDeliverability/Domains] Query error:', error)
      // Return empty data rather than a 500 so the dashboard still loads
      return NextResponse.json({
        success: true,
        data: {
          domains: [],
          period_days: 30,
          note: 'email_sends table query failed — data unavailable',
        },
      })
    }

    // Aggregate by domain in-memory
    const domainMap = new Map<string, { sent: number; opened: number; bounced: number }>()

    for (const row of rows ?? []) {
      if (!row.to_email) continue
      const domain = extractDomain(row.to_email)
      const existing = domainMap.get(domain) ?? { sent: 0, opened: 0, bounced: 0 }
      existing.sent += 1
      if (row.opened_at) existing.opened += 1
      if (row.bounced_at) existing.bounced += 1
      domainMap.set(domain, existing)
    }

    // Build sorted result (top 20 by sent count)
    const domains: DomainStat[] = Array.from(domainMap.entries())
      .map(([domain, stats]) => ({
        domain,
        sent_count: stats.sent,
        open_count: stats.opened,
        bounce_count: stats.bounced,
        open_rate: stats.sent > 0 ? Number(((stats.opened / stats.sent) * 100).toFixed(2)) : 0,
        bounce_rate: stats.sent > 0 ? Number(((stats.bounced / stats.sent) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.sent_count - a.sent_count)
      .slice(0, 20)

    safeLog('[EmailDeliverability/Domains] Returning', domains.length, 'domains')

    return NextResponse.json({
      success: true,
      data: {
        domains,
        period_days: 30,
        total_rows_scanned: (rows ?? []).length,
      },
    })
  } catch (error: unknown) {
    safeError('[EmailDeliverability/Domains] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch domain deliverability stats' },
      { status: 500 }
    )
  }
}
