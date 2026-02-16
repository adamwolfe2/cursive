// Email Verification Processor
// Process email verification queue with MillionVerifier/ZeroBounce

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'

// Support multiple verification providers
const verifyEmail = async (email: string): Promise<{
  status: 'valid' | 'invalid' | 'catch_all' | 'risky' | 'unknown'
  response: any
}> => {
  // MillionVerifier API
  if (process.env.MILLIONVERIFIER_API_KEY) {
    const res = await fetch(
      `https://api.millionverifier.com/api/v3/?api=${process.env.MILLIONVERIFIER_API_KEY}&email=${encodeURIComponent(email)}`,
      { method: 'GET' }
    )
    const data = await res.json()

    // Map MillionVerifier result to our status
    const statusMap: Record<string, string> = {
      ok: 'valid',
      catch_all: 'catch_all',
      unknown: 'unknown',
      invalid: 'invalid',
      disposable: 'invalid',
      role: 'risky',
    }

    return {
      status: (statusMap[data.result] || 'unknown') as any,
      response: data,
    }
  }

  // ZeroBounce API (alternative)
  if (process.env.ZEROBOUNCE_API_KEY) {
    const res = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`,
      { method: 'GET' }
    )
    const data = await res.json()

    const statusMap: Record<string, string> = {
      valid: 'valid',
      'catch-all': 'catch_all',
      unknown: 'unknown',
      invalid: 'invalid',
      spamtrap: 'invalid',
      abuse: 'risky',
      do_not_mail: 'invalid',
    }

    return {
      status: (statusMap[data.status] || 'unknown') as any,
      response: data,
    }
  }

  // No verification service configured - mark as unknown
  console.warn('No email verification service configured')
  return { status: 'unknown', response: { error: 'No service configured' } }
}

export const processEmailVerification = inngest.createFunction(
  {
    id: 'email-verification-processor',
    retries: 3,
    timeouts: { finish: "5m" },
    concurrency: {
      limit: 5, // Process 5 at a time to respect rate limits
    },
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    const adminClient = createAdminClient()

    // Step 1: Get batch of pending verifications
    const batch = await step.run('get-pending-batch', async () => {
      const { data } = await adminClient
        .from('email_verification_queue')
        .select('id, lead_id, email, attempts')
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(50)

      return data || []
    })

    if (batch.length === 0) {
      return { processed: 0, message: 'No pending verifications' }
    }

    // Step 2: Mark as processing
    await step.run('mark-processing', async () => {
      const ids = batch.map((b) => b.id)
      await adminClient
        .from('email_verification_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .in('id', ids)
    })

    // Step 3: Verify each email (with rate limiting)
    const results = await step.run('verify-emails', async () => {
      const verificationResults = []

      for (const item of batch) {
        try {
          // Rate limit: 200ms between requests
          await new Promise((resolve) => setTimeout(resolve, 200))

          const result = await verifyEmail(item.email)
          verificationResults.push({
            id: item.id,
            lead_id: item.lead_id,
            status: result.status,
            response: result.response,
          })
        } catch (error) {
          verificationResults.push({
            id: item.id,
            lead_id: item.lead_id,
            status: 'unknown' as const,
            response: { error: String(error) },
          })
        }
      }

      return verificationResults
    })

    // Step 4: Update verification queue (batch update)
    await step.run('update-queue', async () => {
      const queueUpdates = results.map((result) => ({
        id: result.id,
        status: 'completed',
        verification_result: result.status,
        verification_response: result.response,
        completed_at: new Date().toISOString(),
      }))

      // Batch upsert all updates at once
      await adminClient.from('email_verification_queue').upsert(queueUpdates)
    })

    // Step 5: Update leads with verification results (batch update)
    await step.run('update-leads', async () => {
      const leadUpdates = results.map((result) => ({
        id: result.lead_id,
        verification_status: result.status,
        verification_result: result.response,
        verified_at: new Date().toISOString(),
      }))

      // Batch upsert all lead updates at once
      await adminClient.from('leads').upsert(leadUpdates)
    })

    // Step 6: Recalculate prices and list on marketplace (optimized batch processing)
    await step.run('update-marketplace-listing', async () => {
      const validLeadIds = results
        .filter((r) => r.status === 'valid' || r.status === 'catch_all')
        .map((r) => r.lead_id)

      if (validLeadIds.length > 0) {
        // Batch fetch all valid leads at once
        const { data: leads } = await adminClient
          .from('leads')
          .select('id, intent_score_calculated, freshness_score, contact_data, verification_status')
          .in('id', validLeadIds)

        if (leads && leads.length > 0) {
          // Calculate prices in memory and prepare batch updates
          const priceUpdates = leads.map((lead) => {
            const hasPhone = lead.contact_data?.contacts?.some((c: any) => c.phone)

            // Calculate price in-app (avoiding N RPC calls)
            // Using simplified pricing logic matching the database function
            let basePrice = 50 // Default base price

            // Intent score bonus (0-50 points)
            const intentBonus = Math.round((lead.intent_score_calculated || 0) * 0.5)

            // Freshness bonus (0-30 points)
            const freshnessBonus = Math.round((lead.freshness_score || 0) * 0.3)

            // Phone bonus (+20)
            const phoneBonus = hasPhone ? 20 : 0

            // Verification bonus
            const verificationBonus = lead.verification_status === 'valid' ? 10 :
                                       lead.verification_status === 'catch_all' ? 5 : 0

            const price = basePrice + intentBonus + freshnessBonus + phoneBonus + verificationBonus

            return {
              id: lead.id,
              marketplace_price: price,
              is_marketplace_listed: true,
            }
          })

          // Batch update all prices at once
          await adminClient.from('leads').upsert(priceUpdates)
        }
      }

      // Mark invalid leads as not listable
      const invalidLeadIds = results.filter((r) => r.status === 'invalid').map((r) => r.lead_id)

      if (invalidLeadIds.length > 0) {
        await adminClient
          .from('leads')
          .update({ is_marketplace_listed: false })
          .in('id', invalidLeadIds)
      }
    })

    // Step 7: Update batch statistics
    await step.run('update-batch-stats', async () => {
      // Get unique batch IDs from the processed leads
      const { data: batches } = await adminClient
        .from('leads')
        .select('upload_batch_id')
        .in(
          'id',
          results.map((r) => r.lead_id)
        )
        .not('upload_batch_id', 'is', null)

      const uniqueBatchIds = [...new Set(batches?.map((b) => b.upload_batch_id))]

      for (const batchId of uniqueBatchIds) {
        // Count verification stats for this batch
        const { count: verified } = await adminClient
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('upload_batch_id', batchId)
          .not('verification_status', 'is', null)

        const { count: valid } = await adminClient
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('upload_batch_id', batchId)
          .eq('verification_status', 'valid')

        const { count: listed } = await adminClient
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('upload_batch_id', batchId)
          .eq('is_marketplace_listed', true)

        await adminClient
          .from('partner_upload_batches')
          .update({
            verification_complete: verified,
            verification_valid: valid,
            marketplace_listed: listed,
          })
          .eq('id', batchId)
      }
    })

    return {
      processed: results.length,
      valid: results.filter((r) => r.status === 'valid').length,
      invalid: results.filter((r) => r.status === 'invalid').length,
      catch_all: results.filter((r) => r.status === 'catch_all').length,
      unknown: results.filter((r) => r.status === 'unknown').length,
    }
  }
)
