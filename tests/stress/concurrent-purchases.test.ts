/**
 * Concurrent Purchase Stress Tests
 *
 * Tests atomic payment functions under high concurrency to prove:
 * 1. Only ONE purchase succeeds when 100+ users try to buy the same lead
 * 2. All other attempts get 409 Conflict
 * 3. sold_count is exactly 1 (no double-selling)
 * 4. Proper conflict rate reporting
 *
 * These tests simulate real-world race conditions that would cause:
 * - Negative credit balances
 * - Leads sold twice
 * - Lost revenue
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTestUuid } from '../helpers/api-test-utils'

// Increase test timeout for stress tests
const STRESS_TEST_TIMEOUT = 60000 // 60 seconds

describe('Concurrent Purchase Stress Tests', () => {
  let testLeadId: string
  let testWorkspaces: string[]

  beforeEach(() => {
    testLeadId = generateTestUuid()
    testWorkspaces = Array.from({ length: 200 }, () => generateTestUuid())
  })

  describe('Race Condition Prevention', () => {
    it('should allow only 1 of 10 concurrent purchases to succeed', async () => {
      const concurrency = 10
      const results = await simulateConcurrentPurchases(testLeadId, concurrency)

      // Count successes and conflicts
      const successes = results.filter(r => r.status === 200)
      const conflicts = results.filter(r => r.status === 409)

      // CRITICAL: Only 1 should succeed
      expect(successes.length).toBe(1)

      // All others should get 409 Conflict
      expect(conflicts.length).toBe(concurrency - 1)

      // Verify conflict rate
      const conflictRate = (conflicts.length / concurrency) * 100
      expect(conflictRate).toBe(90) // 90% conflict rate expected

      console.log(`\n  ✓ Concurrency ${concurrency}: ${successes.length} success, ${conflicts.length} conflicts (${conflictRate}% conflict rate)`)
    }, STRESS_TEST_TIMEOUT)

    it('should allow only 1 of 50 concurrent purchases to succeed', async () => {
      const concurrency = 50
      const results = await simulateConcurrentPurchases(testLeadId, concurrency)

      const successes = results.filter(r => r.status === 200)
      const conflicts = results.filter(r => r.status === 409)

      expect(successes.length).toBe(1)
      expect(conflicts.length).toBe(concurrency - 1)

      const conflictRate = (conflicts.length / concurrency) * 100
      console.log(`\n  ✓ Concurrency ${concurrency}: ${successes.length} success, ${conflicts.length} conflicts (${conflictRate}% conflict rate)`)
    }, STRESS_TEST_TIMEOUT)

    it('should allow only 1 of 100 concurrent purchases to succeed', async () => {
      const concurrency = 100
      const results = await simulateConcurrentPurchases(testLeadId, concurrency)

      const successes = results.filter(r => r.status === 200)
      const conflicts = results.filter(r => r.status === 409)

      expect(successes.length).toBe(1)
      expect(conflicts.length).toBe(concurrency - 1)

      const conflictRate = (conflicts.length / concurrency) * 100
      console.log(`\n  ✓ Concurrency ${concurrency}: ${successes.length} success, ${conflicts.length} conflicts (${conflictRate}% conflict rate)`)
    }, STRESS_TEST_TIMEOUT)

    it('should allow only 1 of 200 concurrent purchases to succeed', async () => {
      const concurrency = 200
      const results = await simulateConcurrentPurchases(testLeadId, concurrency)

      const successes = results.filter(r => r.status === 200)
      const conflicts = results.filter(r => r.status === 409)

      expect(successes.length).toBe(1)
      expect(conflicts.length).toBe(concurrency - 1)

      const conflictRate = (conflicts.length / concurrency) * 100
      console.log(`\n  ✓ Concurrency ${concurrency}: ${successes.length} success, ${conflicts.length} conflicts (${conflictRate}% conflict rate)`)
    }, STRESS_TEST_TIMEOUT)
  })

  describe('Database Consistency', () => {
    it('should ensure sold_count is exactly 1 after concurrent attempts', async () => {
      const concurrency = 100

      // Simulate concurrent purchases
      await simulateConcurrentPurchases(testLeadId, concurrency)

      // Check database state
      const adminClient = createAdminClient()
      const { data: lead, error } = await adminClient
        .from('leads')
        .select('sold_count, marketplace_status, sold_at')
        .eq('id', testLeadId)
        .single()

      if (error) {
        console.error('Failed to fetch lead:', error)
        throw error
      }

      // CRITICAL: sold_count must be exactly 1 (not 100!)
      expect(lead.sold_count).toBe(1)

      // Lead should be marked as sold
      expect(lead.marketplace_status).toBe('sold')
      expect(lead.sold_at).toBeTruthy()

      console.log(`\n  ✓ Lead ${testLeadId} sold_count: ${lead.sold_count} (expected: 1)`)
    }, STRESS_TEST_TIMEOUT)

    it('should ensure no double credit deductions', async () => {
      const concurrency = 50
      const workspaceId = generateTestUuid()

      // Set initial credit balance
      const initialBalance = 100
      await setWorkspaceCredits(workspaceId, initialBalance)

      // Simulate concurrent purchases from SAME workspace
      const results = await simulateConcurrentPurchasesFromWorkspace(testLeadId, workspaceId, concurrency)

      const successes = results.filter(r => r.status === 200)
      expect(successes.length).toBe(1) // Only 1 should succeed

      // Check final balance
      const finalBalance = await getWorkspaceCredits(workspaceId)

      // Balance should only be deducted once (for the 1 successful purchase)
      const leadPrice = 0.05 // Assume $0.05 per lead
      const expectedBalance = initialBalance - leadPrice

      expect(finalBalance).toBe(expectedBalance)

      console.log(`\n  ✓ Workspace ${workspaceId} balance: ${finalBalance} (expected: ${expectedBalance})`)
    }, STRESS_TEST_TIMEOUT)
  })

  describe('Performance Metrics', () => {
    it('should complete 100 concurrent attempts within reasonable time', async () => {
      const concurrency = 100
      const startTime = Date.now()

      await simulateConcurrentPurchases(testLeadId, concurrency)

      const duration = Date.now() - startTime

      // Should complete in < 10 seconds even under heavy load
      expect(duration).toBeLessThan(10000)

      console.log(`\n  ✓ ${concurrency} concurrent purchases completed in ${duration}ms`)
    }, STRESS_TEST_TIMEOUT)

    it('should report conflict detection latency', async () => {
      const attempts = 50
      const latencies: number[] = []

      for (let i = 0; i < attempts; i++) {
        const startTime = Date.now()
        await purchaseLead(testLeadId, generateTestUuid())
        const latency = Date.now() - startTime
        latencies.push(latency)
      }

      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      const maxLatency = Math.max(...latencies)
      const minLatency = Math.min(...latencies)

      console.log(`\n  ✓ Latency stats (${attempts} attempts):`)
      console.log(`    - Average: ${avgLatency.toFixed(2)}ms`)
      console.log(`    - Min: ${minLatency}ms`)
      console.log(`    - Max: ${maxLatency}ms`)

      // Average latency should be reasonable (< 500ms)
      expect(avgLatency).toBeLessThan(500)
    }, STRESS_TEST_TIMEOUT)
  })
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simulate concurrent purchase attempts
 */
async function simulateConcurrentPurchases(
  leadId: string,
  concurrency: number
): Promise<Array<{ status: number; data: any }>> {
  // Create unique workspace for each attempt
  const attempts = Array.from({ length: concurrency }, (_, i) =>
    purchaseLead(leadId, `workspace-${i}`)
  )

  // Execute all attempts in parallel
  const results = await Promise.allSettled(attempts)

  // Extract status codes
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return { status: 500, data: { error: result.reason.message } }
    }
  })
}

/**
 * Simulate concurrent purchases from SAME workspace
 * Tests credit deduction race condition
 */
async function simulateConcurrentPurchasesFromWorkspace(
  leadId: string,
  workspaceId: string,
  concurrency: number
): Promise<Array<{ status: number; data: any }>> {
  const attempts = Array.from({ length: concurrency }, () =>
    purchaseLead(leadId, workspaceId)
  )

  const results = await Promise.allSettled(attempts)

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return { status: 500, data: { error: result.reason.message } }
    }
  })
}

/**
 * Purchase a lead using atomic database functions
 * This directly tests the database functions, bypassing API routes
 */
async function purchaseLead(
  leadId: string,
  workspaceId: string
): Promise<{ status: number; data: any }> {
  const adminClient = createAdminClient()

  try {
    // Call validate_and_lock_leads_for_purchase (THE ATOMIC FUNCTION)
    const { data: leads, error: lockError } = await adminClient.rpc(
      'validate_and_lock_leads_for_purchase',
      {
        p_lead_ids: [leadId],
        p_buyer_workspace_id: workspaceId,
      }
    )

    if (lockError) {
      // Lock failed - lead already purchased or locked
      if (lockError.code === '55P03' || lockError.message.includes('no longer available')) {
        return { status: 409, data: { error: 'Lead no longer available' } }
      }
      return { status: 500, data: { error: lockError.message } }
    }

    if (!leads || leads.length === 0) {
      return { status: 409, data: { error: 'Lead no longer available' } }
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await adminClient
      .from('marketplace_purchases')
      .insert({
        buyer_workspace_id: workspaceId,
        buyer_user_id: 'test-user',
        total_leads: 1,
        total_price: 0.05,
        payment_method: 'credits',
        status: 'pending',
      })
      .select()
      .single()

    if (purchaseError) {
      return { status: 500, data: { error: purchaseError.message } }
    }

    // Add purchase items
    await adminClient
      .from('marketplace_purchase_items')
      .insert({
        purchase_id: purchase.id,
        lead_id: leadId,
        price_at_purchase: 0.05,
      })

    // Complete purchase atomically (THE ATOMIC FUNCTION)
    const { data: result, error: completeError } = await adminClient.rpc(
      'complete_credit_lead_purchase',
      {
        p_purchase_id: purchase.id,
        p_workspace_id: workspaceId,
        p_credit_amount: 0.05,
      }
    )

    if (completeError || !result || result.length === 0) {
      return { status: 500, data: { error: 'Completion failed' } }
    }

    const completionResult = result[0]
    if (!completionResult.success) {
      return { status: 400, data: { error: completionResult.error_message } }
    }

    return {
      status: 200,
      data: {
        purchase_id: purchase.id,
        credits_remaining: completionResult.new_credit_balance,
      },
    }
  } catch (error: any) {
    return { status: 500, data: { error: error.message } }
  }
}

/**
 * Set workspace credits for testing
 */
async function setWorkspaceCredits(workspaceId: string, balance: number): Promise<void> {
  const adminClient = createAdminClient()

  await adminClient
    .from('workspace_credits')
    .upsert({
      workspace_id: workspaceId,
      balance,
      total_purchased: balance,
      total_used: 0,
    })
}

/**
 * Get workspace credit balance
 */
async function getWorkspaceCredits(workspaceId: string): Promise<number> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', workspaceId)
    .single()

  if (error) throw error

  return data.balance
}
