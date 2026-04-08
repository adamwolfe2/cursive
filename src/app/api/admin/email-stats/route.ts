export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * Admin Email Stats API
 * Cursive Platform
 *
 * Returns email deliverability metrics from Resend, aggregated by category tag.
 *
 * The installed Resend SDK (v4) does not expose an emails.list() method, so we
 * call Resend's REST API directly (GET /emails) to retrieve recent emails and
 * aggregate delivery stats in-memory.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// ============================================
// TYPES
// ============================================

interface CategoryStats {
  sent: number
  delivered: number
  bounced: number
  complained: number
}

interface RecentBounce {
  id: string
  to: string // redacted: only first 2 chars + domain
  subject: string
  created_at: string
  last_event: string
}

interface Alert {
  level: 'warning' | 'critical'
  message: string
}

// Shape of an email object returned by GET /emails
interface ResendEmailRecord {
  id: string
  object: string
  to: string | string[]
  from: string
  subject: string
  created_at: string
  last_event: string | null
  tags?: { name: string; value: string }[]
}

// ============================================
// HELPERS
// ============================================

function redactEmail(email: string): string {
  try {
    const [local, domain] = email.split('@')
    if (!local || !domain) return '***@***'
    const visible = local.slice(0, 2)
    const stars = '*'.repeat(Math.max(local.length - 2, 3))
    return `${visible}${stars}@${domain}`
  } catch {
    return '***@***'
  }
}

function getCategoryFromTags(tags: { name: string; value: string }[] | undefined): string {
  if (!tags || tags.length === 0) return 'other'
  const categoryTag = tags.find((t) => t.name === 'category')
  if (categoryTag) return categoryTag.value
  const typeTag = tags.find((t) => t.name === 'type')
  if (typeTag) return typeTag.value
  return 'other'
}

// Classify the Resend last_event field into our summary buckets.
function classifyEvent(lastEvent: string | null | undefined): 'delivered' | 'bounced' | 'complained' | 'sent' {
  if (!lastEvent) return 'sent'
  const e = lastEvent.toLowerCase()
  if (e === 'delivered') return 'delivered'
  if (e === 'bounced' || e === 'hard_bounced' || e === 'soft_bounced' || e === 'bounce') return 'bounced'
  if (e === 'complained' || e === 'spam_complaint' || e === 'complaint') return 'complained'
  return 'sent'
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET() {
  try {
    await requireAdmin()

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    // Call Resend REST API directly — SDK v4 does not expose emails.list()
    safeLog('[AdminEmailStats] Fetching emails from Resend REST API')

    let emails: ResendEmailRecord[] = []
    let apiNote = ''

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const resendRes = await fetch('https://api.resend.com/emails?limit=100', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!resendRes.ok) {
        const errBody = await resendRes.text().catch(() => '')
        safeError('[AdminEmailStats] Resend API error:', resendRes.status, errBody)
        apiNote = `Resend API returned ${resendRes.status}. Stats may be incomplete.`
      } else {
        const body = await resendRes.json()
        // Resend returns { data: [...], object: 'list' }
        const raw = body?.data ?? (Array.isArray(body) ? body : [])
        emails = raw as ResendEmailRecord[]
        apiNote = `Stats based on the ${emails.length} most recent emails returned by Resend.`
      }
    } catch (fetchErr) {
      safeError('[AdminEmailStats] Fetch error:', fetchErr)
      apiNote = 'Could not reach Resend API. Showing zeroed stats.'
    } finally {
      clearTimeout(timeout)
    }

    safeLog('[AdminEmailStats] Emails fetched:', emails.length)

    // ---- Aggregate stats ----
    const summary = { sent: 0, delivered: 0, bounced: 0, complained: 0 }
    const byCategory: Record<string, CategoryStats> = {}
    const recentBounces: RecentBounce[] = []

    for (const email of emails) {
      const classification = classifyEvent(email.last_event)
      const category = getCategoryFromTags(email.tags)

      if (!byCategory[category]) {
        byCategory[category] = { sent: 0, delivered: 0, bounced: 0, complained: 0 }
      }

      summary.sent++
      byCategory[category].sent++

      if (classification === 'delivered') {
        summary.delivered++
        byCategory[category].delivered++
      } else if (classification === 'bounced') {
        summary.bounced++
        byCategory[category].bounced++

        if (recentBounces.length < 10) {
          const toAddress = Array.isArray(email.to)
            ? (email.to[0] ?? '')
            : (email.to ?? '')
          recentBounces.push({
            id: email.id,
            to: redactEmail(String(toAddress)),
            subject: email.subject ?? '(no subject)',
            created_at: email.created_at,
            last_event: email.last_event ?? 'bounced',
          })
        }
      } else if (classification === 'complained') {
        summary.complained++
        byCategory[category].complained++
      }
    }

    // ---- Derived rates ----
    const totalSent = summary.sent
    const deliveryRate = totalSent > 0 ? (summary.delivered / totalSent) * 100 : 0
    const bounceRate = totalSent > 0 ? (summary.bounced / totalSent) * 100 : 0
    const complaintRate = totalSent > 0 ? (summary.complained / totalSent) * 100 : 0

    // ---- Alerts ----
    const alerts: Alert[] = []

    if (totalSent >= 10) {
      if (bounceRate >= 5) {
        alerts.push({
          level: 'critical',
          message: `Bounce rate is ${bounceRate.toFixed(2)}% — critically high (threshold: 5%). Resend may suspend sending.`,
        })
      } else if (bounceRate >= 2) {
        alerts.push({
          level: 'warning',
          message: `Bounce rate is ${bounceRate.toFixed(2)}% — above the 2% warning threshold.`,
        })
      }

      if (complaintRate >= 0.5) {
        alerts.push({
          level: 'critical',
          message: `Complaint rate is ${complaintRate.toFixed(3)}% — critically high (threshold: 0.5%).`,
        })
      } else if (complaintRate >= 0.1) {
        alerts.push({
          level: 'warning',
          message: `Complaint rate is ${complaintRate.toFixed(3)}% — above the 0.1% warning threshold.`,
        })
      }

      if (deliveryRate < 90 && totalSent >= 20) {
        alerts.push({
          level: 'critical',
          message: `Delivery rate is ${deliveryRate.toFixed(1)}% — below the 90% critical threshold.`,
        })
      } else if (deliveryRate < 95 && totalSent >= 20) {
        alerts.push({
          level: 'warning',
          message: `Delivery rate is ${deliveryRate.toFixed(1)}% — below the 95% target.`,
        })
      }
    }

    // ---- Build ordered category breakdown ----
    const KNOWN_CATEGORIES = ['welcome', 'auth', 'notification', 'billing', 'partner', 'marketplace', 'digest']
    const orderedByCategory: Record<string, CategoryStats> = {}
    for (const key of KNOWN_CATEGORIES) {
      if (byCategory[key]) orderedByCategory[key] = byCategory[key]
    }
    for (const key of Object.keys(byCategory)) {
      if (!orderedByCategory[key]) orderedByCategory[key] = byCategory[key]
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          sent: summary.sent,
          delivered: summary.delivered,
          bounced: summary.bounced,
          complained: summary.complained,
          delivery_rate: Number(deliveryRate.toFixed(2)),
          bounce_rate: Number(bounceRate.toFixed(2)),
          complaint_rate: Number(complaintRate.toFixed(3)),
        },
        by_category: orderedByCategory,
        recent_bounces: recentBounces,
        alerts,
        meta: {
          emails_sampled: emails.length,
          note: emails.length === 0
            ? (apiNote || 'No emails returned from Resend. Verify RESEND_API_KEY is correct.')
            : apiNote,
        },
      },
    })
  } catch (error: unknown) {
    safeError('[AdminEmailStats] Route error:', error)

    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unauthorized') || msg.includes('forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch email stats' }, { status: 500 })
  }
}
