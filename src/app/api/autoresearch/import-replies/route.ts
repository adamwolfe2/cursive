/**
 * Autoresearch Import Replies API
 * Import CSV of replies for manual sentiment classification
 */

import { type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

const replyRowSchema = z.object({
  email: z.string().email(),
  reply_body: z.string().min(1),
  reply_date: z.string().optional(),
})

const importRepliesSchema = z.object({
  experiment_id: z.string().uuid().optional(),
  replies: z.array(replyRowSchema).min(1).max(5000),
})

/**
 * Classify sentiment of a reply using keyword heuristics
 * Returns: positive, negative, neutral, or out_of_office
 */
function classifySentiment(body: string): 'positive' | 'negative' | 'neutral' | 'out_of_office' {
  const lower = body.toLowerCase()

  const oooPatterns = [
    'out of office',
    'out of the office',
    'on vacation',
    'on leave',
    'auto-reply',
    'autoreply',
    'automatic reply',
    'i am currently unavailable',
    'i will be out',
  ]
  if (oooPatterns.some((p) => lower.includes(p))) {
    return 'out_of_office'
  }

  const negativePatterns = [
    'unsubscribe',
    'remove me',
    'stop emailing',
    'not interested',
    'do not contact',
    'take me off',
    'opt out',
    'no thanks',
    'no thank you',
    'please remove',
    'stop sending',
    'leave me alone',
  ]
  if (negativePatterns.some((p) => lower.includes(p))) {
    return 'negative'
  }

  const positivePatterns = [
    'interested',
    'tell me more',
    'sounds good',
    'let\'s chat',
    'let\'s talk',
    'schedule a call',
    'set up a time',
    'love to learn more',
    'send me more info',
    'yes',
    'absolutely',
    'great',
    'sounds interesting',
    'would love to',
    'let me know when',
    'book a time',
  ]
  if (positivePatterns.some((p) => lower.includes(p))) {
    return 'positive'
  }

  return 'neutral'
}

/**
 * POST /api/autoresearch/import-replies
 * Import replies and classify sentiment
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = importRepliesSchema.parse(body)

    const supabase = await createClient()

    // If experiment_id provided, verify it belongs to workspace
    if (validated.experiment_id) {
      const { data: experiment, error: expError } = await supabase
        .from('autoresearch_experiments')
        .select('id, program_id')
        .eq('id', validated.experiment_id)
        .maybeSingle()

      if (expError || !experiment) {
        return badRequest('Experiment not found')
      }

      // Verify program belongs to workspace
      const { data: program, error: progError } = await supabase
        .from('autoresearch_programs')
        .select('id')
        .eq('id', experiment.program_id)
        .eq('workspace_id', user.workspace_id)
        .maybeSingle()

      if (progError || !program) {
        return badRequest('Experiment does not belong to your workspace')
      }
    }

    // Classify and prepare reply records
    const classifiedReplies = validated.replies.map((reply) => {
      const sentiment = classifySentiment(reply.reply_body)
      return {
        workspace_id: user.workspace_id,
        experiment_id: validated.experiment_id || null,
        lead_email: reply.email,
        reply_body: reply.reply_body,
        reply_date: reply.reply_date || new Date().toISOString(),
        sentiment,
        classification_method: 'keyword_heuristic',
      }
    })

    // Insert in batches of 500
    const batchSize = 500
    let insertedCount = 0
    const errors: string[] = []

    for (let i = 0; i < classifiedReplies.length; i += batchSize) {
      const batch = classifiedReplies.slice(i, i + batchSize)
      const { error } = await supabase
        .from('autoresearch_replies')
        .insert(batch)

      if (error) {
        safeError(`[Import Replies] Batch ${i / batchSize + 1} error:`, error)
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`)
      } else {
        insertedCount += batch.length
      }
    }

    // Compute sentiment summary
    const sentimentCounts = classifiedReplies.reduce(
      (acc, r) => {
        return { ...acc, [r.sentiment]: (acc[r.sentiment] || 0) + 1 }
      },
      { positive: 0, negative: 0, neutral: 0, out_of_office: 0 } as Record<string, number>
    )

    return success({
      message: `Imported ${insertedCount} of ${validated.replies.length} replies`,
      inserted: insertedCount,
      total_submitted: validated.replies.length,
      sentiment_summary: sentimentCounts,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
