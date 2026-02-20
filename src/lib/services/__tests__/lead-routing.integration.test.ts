/**
 * Lead Routing Integration Tests
 *
 * Tests actual database operations, PostgreSQL functions, and RLS policies.
 * Requires a test database with migrations applied.
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { LeadRoutingService } from '../lead-routing.service'
import crypto from 'crypto'

/**
 * IMPORTANT: These tests require:
 * 1. Test database configured (SUPABASE_TEST_URL)
 * 2. Migration 20260131000001_lead_routing_fixes.sql applied
 * 3. Test workspaces and routing rules set up
 */

describe('Lead Routing Integration Tests', () => {
  let testWorkspaceId: string
  let testWorkspaceId2: string
  let testRuleId: string
  let testLeadId: string
  let supabase: ReturnType<typeof createAdminClient>

  beforeAll(async () => {
    supabase = createAdminClient()

    // Create test workspaces
    const { data: workspace1 } = await supabase
      .from('workspaces')
      .insert({
        name: 'Test Workspace 1',
        workspace_type: 'standard',
        allowed_industries: ['Technology'],
        allowed_regions: ['US'],
      })
      .select('id')
      .maybeSingle()

    const { data: workspace2 } = await supabase
      .from('workspaces')
      .insert({
        name: 'Test Workspace 2 (Tech Partner)',
        workspace_type: 'partner',
        allowed_industries: ['Technology'],
        allowed_regions: ['US'],
      })
      .select('id')
      .maybeSingle()

    testWorkspaceId = workspace1!.id
    testWorkspaceId2 = workspace2!.id

    // Create test routing rule
    const { data: rule } = await supabase
      .from('lead_routing_rules')
      .insert({
        workspace_id: testWorkspaceId,
        rule_name: 'Tech Companies to Partner',
        destination_workspace_id: testWorkspaceId2,
        priority: 100,
        is_active: true,
        conditions: {
          industries: ['Technology'],
        },
      })
      .select('id')
      .maybeSingle()

    testRuleId = rule!.id
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('leads').delete().eq('workspace_id', testWorkspaceId)
    await supabase.from('leads').delete().eq('workspace_id', testWorkspaceId2)
    await supabase.from('lead_routing_rules').delete().eq('id', testRuleId)
    await supabase.from('workspaces').delete().eq('id', testWorkspaceId)
    await supabase.from('workspaces').delete().eq('id', testWorkspaceId2)
  })

  beforeEach(async () => {
    // Create a fresh test lead for each test
    const { data: lead } = await supabase
      .from('leads')
      .insert({
        workspace_id: testWorkspaceId,
        name: 'Test Lead',
        company_industry: 'Technology',
        company_location: { country: 'US', state: 'CA' },
        contact_data: {
          email: 'test@example.com',
        },
        routing_status: 'pending',
        dedupe_hash: crypto
          .createHash('sha256')
          .update(`test@example.com|Technology|${Date.now()}`)
          .digest('hex'),
      })
      .select('id')
      .maybeSingle()

    testLeadId = lead!.id
  })

  describe('PostgreSQL Functions', () => {
    it('should acquire routing lock successfully', async () => {
      const lockOwner = crypto.randomUUID()

      const { data: acquired } = await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner,
      })

      expect(acquired).toBe(true)

      // Verify lead status updated
      const { data: lead } = await supabase
        .from('leads')
        .select('routing_status, routing_locked_by, routing_attempts')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.routing_status).toBe('routing')
      expect(lead?.routing_locked_by).toBe(lockOwner)
      expect(lead?.routing_attempts).toBe(1)
    })

    it('should prevent duplicate lock acquisition', async () => {
      const lockOwner1 = crypto.randomUUID()
      const lockOwner2 = crypto.randomUUID()

      // First lock acquisition
      await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner1,
      })

      // Second lock acquisition should fail
      const { data: acquired } = await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner2,
      })

      expect(acquired).toBe(false)
    })

    it('should complete routing successfully', async () => {
      const lockOwner = crypto.randomUUID()

      // Acquire lock
      await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner,
      })

      // Complete routing
      const { data: completed } = await supabase.rpc('complete_routing', {
        p_lead_id: testLeadId,
        p_destination_workspace_id: testWorkspaceId2,
        p_matched_rule_id: testRuleId,
        p_lock_owner: lockOwner,
      })

      expect(completed).toBe(true)

      // Verify lead updated
      const { data: lead } = await supabase
        .from('leads')
        .select('routing_status, workspace_id, routing_locked_by')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.routing_status).toBe('routed')
      expect(lead?.workspace_id).toBe(testWorkspaceId2)
      expect(lead?.routing_locked_by).toBeNull()

      // Verify routing log created
      const { data: logs } = await supabase
        .from('lead_routing_logs')
        .select('*')
        .eq('lead_id', testLeadId)

      expect(logs).toHaveLength(1)
      expect(logs![0].routing_result).toBe('success')
      expect(logs![0].matched_rule_id).toBe(testRuleId)
    })

    it('should fail routing and queue for retry', async () => {
      const lockOwner = crypto.randomUUID()

      // Acquire lock
      await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner,
      })

      // Fail routing (within retry limit)
      const { data: failed } = await supabase.rpc('fail_routing', {
        p_lead_id: testLeadId,
        p_error_message: 'Test error',
        p_lock_owner: lockOwner,
        p_max_attempts: 3,
      })

      expect(failed).toBe(true)

      // Verify lead back to pending
      const { data: lead } = await supabase
        .from('leads')
        .select('routing_status, routing_error')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.routing_status).toBe('pending')
      expect(lead?.routing_error).toBe('Test error')

      // Verify retry queue entry created
      const { data: queueItems } = await supabase
        .from('lead_routing_queue')
        .select('*')
        .eq('lead_id', testLeadId)

      expect(queueItems).toHaveLength(1)
      expect(queueItems![0].last_error).toBe('Test error')
    })

    it('should mark as failed after max retries', async () => {
      const lockOwner = crypto.randomUUID()

      // Set attempts to max
      await supabase
        .from('leads')
        .update({ routing_attempts: 3 })
        .eq('id', testLeadId)

      // Acquire lock (will increment to 4)
      await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner,
      })

      // Fail routing (exceeds retry limit)
      await supabase.rpc('fail_routing', {
        p_lead_id: testLeadId,
        p_error_message: 'Final error',
        p_lock_owner: lockOwner,
        p_max_attempts: 3,
      })

      // Verify lead marked as failed
      const { data: lead } = await supabase
        .from('leads')
        .select('routing_status, routing_error')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.routing_status).toBe('failed')
      expect(lead?.routing_error).toBe('Final error')

      // Verify routing log created
      const { data: logs } = await supabase
        .from('lead_routing_logs')
        .select('*')
        .eq('lead_id', testLeadId)
        .eq('routing_result', 'failed')

      expect(logs).toHaveLength(1)
    })

    it('should detect cross-partner duplicates', async () => {
      const dedupeHash = crypto
        .createHash('sha256')
        .update('duplicate@test.com|TestCorp')
        .digest('hex')

      // Create lead in partner workspace
      const { data: partnerLead } = await supabase
        .from('leads')
        .insert({
          workspace_id: testWorkspaceId2,
          name: 'Partner Lead',
          dedupe_hash: dedupeHash,
          routing_status: 'routed',
          contact_data: { email: 'duplicate@test.com' },
        })
        .select('id')
        .maybeSingle()

      // Check for duplicate from different workspace
      const { data: duplicates } = await supabase.rpc('check_cross_partner_duplicate', {
        p_dedupe_hash: dedupeHash,
        p_source_workspace_id: testWorkspaceId,
      })

      expect(duplicates).toHaveLength(1)
      expect(duplicates![0].duplicate_lead_id).toBe(partnerLead!.id)
      expect(duplicates![0].duplicate_workspace_id).toBe(testWorkspaceId2)
    })

    it('should release stale locks', async () => {
      const lockOwner = crypto.randomUUID()

      // Acquire lock
      await supabase.rpc('acquire_routing_lock', {
        p_lead_id: testLeadId,
        p_lock_owner: lockOwner,
      })

      // Manually set lock time to > 5 minutes ago
      await supabase
        .from('leads')
        .update({
          routing_locked_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        })
        .eq('id', testLeadId)

      // Release stale locks
      const { data: released } = await supabase.rpc('release_stale_routing_locks')

      expect(released).toBeGreaterThan(0)

      // Verify lock released
      const { data: lead } = await supabase
        .from('leads')
        .select('routing_status, routing_locked_by')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.routing_status).toBe('pending')
      expect(lead?.routing_locked_by).toBeNull()
    })

    it('should mark expired leads', async () => {
      // Set lead expiration to past
      await supabase
        .from('leads')
        .update({
          lead_expires_at: new Date(Date.now() - 1000).toISOString(),
        })
        .eq('id', testLeadId)

      // Mark expired
      const { data: expired } = await supabase.rpc('mark_expired_leads')

      expect(expired).toBeGreaterThan(0)

      // Verify lead marked as expired
      const { data: lead } = await supabase
        .from('leads')
        .select('routing_status')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.routing_status).toBe('expired')
    })
  })

  describe('End-to-End Routing', () => {
    it('should route lead through complete workflow', async () => {
      const result = await LeadRoutingService.routeLead({
        leadId: testLeadId,
        sourceWorkspaceId: testWorkspaceId,
        userId: 'test-user',
        maxRetries: 3,
      })

      expect(result.success).toBe(true)
      expect(result.destinationWorkspaceId).toBe(testWorkspaceId2)
      expect(result.matchedRuleId).toBe(testRuleId)

      // Verify lead routed
      const { data: lead } = await supabase
        .from('leads')
        .select('workspace_id, routing_status')
        .eq('id', testLeadId)
        .maybeSingle()

      expect(lead?.workspace_id).toBe(testWorkspaceId2)
      expect(lead?.routing_status).toBe('routed')
    })
  })

  describe('RLS Policies', () => {
    it('should enforce workspace isolation on routing queue', async () => {
      const userClient = await createClient()

      // Attempt to access routing queue without proper workspace access
      const { data, error } = await userClient
        .from('lead_routing_queue')
        .select('*')
        .eq('workspace_id', testWorkspaceId)

      // Should either return empty or error based on RLS
      expect(data?.length === 0 || error !== null).toBe(true)
    })

    it('should enforce workspace isolation on routing logs', async () => {
      const userClient = await createClient()

      const { data, error } = await userClient
        .from('lead_routing_logs')
        .select('*')
        .eq('source_workspace_id', testWorkspaceId)

      expect(data?.length === 0 || error !== null).toBe(true)
    })
  })
})
