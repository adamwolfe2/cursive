/**
 * Admin Monitoring — Email Metrics API
 * GET /api/admin/monitoring/emails
 *
 * Returns real-time email delivery metrics computed from the email_sends table:
 * - sentPerHour: emails sent in the last hour
 * - deliveryRate: delivered / (sent + delivered) over last 24h
 * - failedLast24h: count of failed/bounced sends in last 24h
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

interface EmailMetrics {
  sentPerHour: number
  deliveryRate: number
  failedLast24h: number
}

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requireAdmin()

    const supabase = createAdminClient()
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [sentLastHour, deliveredLast24h, totalTerminalLast24h, failedLast24h] =
      await Promise.all([
        // Emails sent in the last hour (status moved past pending)
        supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .not('status', 'eq', 'pending')
          .gte('created_at', oneHourAgo.toISOString()),

        // Successfully delivered in last 24h
        supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .in('status', ['delivered', 'opened', 'clicked', 'replied'])
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // Total terminal (sent + delivered + bounced + failed) in last 24h — denominator for delivery rate
        supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '(pending)')
          .gte('created_at', twentyFourHoursAgo.toISOString()),

        // Failed or bounced in last 24h
        supabase
          .from('email_sends')
          .select('*', { count: 'exact', head: true })
          .in('status', ['failed', 'bounced'])
          .gte('created_at', twentyFourHoursAgo.toISOString()),
      ])

    const sentPerHour = sentLastHour.count ?? 0
    const delivered = deliveredLast24h.count ?? 0
    const total = totalTerminalLast24h.count ?? 0
    const failed = failedLast24h.count ?? 0

    const deliveryRate = total > 0 ? delivered / total : 1

    const metrics: EmailMetrics = {
      sentPerHour,
      deliveryRate,
      failedLast24h: failed,
    }

    return NextResponse.json({ data: metrics })
  } catch (error) {
    safeError('Failed to fetch email metrics:', error)
    return handleApiError(error)
  }
}
