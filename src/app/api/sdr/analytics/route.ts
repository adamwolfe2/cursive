/**
 * SDR Analytics API
 * GET: Return AI SDR performance stats for the current workspace (last 30 days)
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, success } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const supabase = await createClient()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.toISOString()

    const [
      classificationLogsResult,
      autoSentResult,
      needsApprovalResult,
      approvedResult,
      rejectedResult,
      positiveRepliesResult,
      intentBreakdownResult,
      methodBreakdownResult,
    ] = await Promise.all([
      // Total replies classified in last 30d
      supabase
        .from('reply_classification_logs')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .gte('created_at', cutoff),

      // Auto-sent conversations
      supabase
        .from('sdr_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'auto_sent')
        .gte('created_at', cutoff),

      // Needs-approval conversations
      supabase
        .from('sdr_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'needs_approval')
        .gte('created_at', cutoff),

      // Approved drafts
      supabase
        .from('sdr_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'approved')
        .gte('created_at', cutoff),

      // Rejected drafts
      supabase
        .from('sdr_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'rejected')
        .gte('created_at', cutoff),

      // Positive reply intents
      supabase
        .from('reply_classification_logs')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', user.workspace_id)
        .in('intent', ['interested', 'meeting_request', 'positive'])
        .gte('created_at', cutoff),

      // Intent breakdown — fetch all intents in the window
      supabase
        .from('reply_classification_logs')
        .select('intent')
        .eq('workspace_id', user.workspace_id)
        .gte('created_at', cutoff),

      // Method breakdown — fetch all methods in the window
      supabase
        .from('reply_classification_logs')
        .select('method')
        .eq('workspace_id', user.workspace_id)
        .gte('created_at', cutoff),
    ])

    if (classificationLogsResult.error) {
      safeError('[SDR Analytics] classification logs query error', classificationLogsResult.error)
    }

    const totalReplies = classificationLogsResult.count ?? 0
    const autoSent = autoSentResult.count ?? 0
    const needsApproval = needsApprovalResult.count ?? 0
    const approved = approvedResult.count ?? 0
    const rejected = rejectedResult.count ?? 0
    const positiveReplies = positiveRepliesResult.count ?? 0

    const positiveRate = totalReplies > 0 ? Math.round((positiveReplies / totalReplies) * 100) : 0
    const autoRate =
      autoSent + needsApproval > 0
        ? Math.round((autoSent / (autoSent + needsApproval)) * 100)
        : 0

    // Build intent breakdown map
    const intentCounts: Record<string, number> = {}
    for (const row of intentBreakdownResult.data ?? []) {
      const intent = (row.intent as string) ?? 'unknown'
      intentCounts[intent] = (intentCounts[intent] ?? 0) + 1
    }

    // Build method breakdown map
    const methodCounts: Record<string, number> = {}
    for (const row of methodBreakdownResult.data ?? []) {
      const method = (row.method as string) ?? 'unknown'
      methodCounts[method] = (methodCounts[method] ?? 0) + 1
    }

    const keywordCount = methodCounts['keyword'] ?? 0
    const claudeCount = methodCounts['claude'] ?? 0

    return success({
      period_days: 30,
      total_replies: totalReplies,
      auto_sent: autoSent,
      needs_approval: needsApproval,
      approved,
      rejected,
      positive_replies: positiveReplies,
      positive_rate: positiveRate,
      auto_rate: autoRate,
      intent_breakdown: intentCounts,
      method_breakdown: {
        keyword: keywordCount,
        claude: claudeCount,
        keyword_pct: totalReplies > 0 ? Math.round((keywordCount / totalReplies) * 100) : 0,
        claude_pct: totalReplies > 0 ? Math.round((claudeCount / totalReplies) * 100) : 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
