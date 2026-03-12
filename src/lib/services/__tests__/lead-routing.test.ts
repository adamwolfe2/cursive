/**
 * Lead Routing Service Tests
 *
 * Tests atomic routing operations, deduplication, retry queue, and lifecycle management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LeadRoutingService } from '../lead-routing.service'
import crypto from 'crypto'

// Mock Supabase client
let mockSupabase: any

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
  createAdminClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeLog: vi.fn(),
  safeError: vi.fn(),
  safeWarn: vi.fn(),
}))

describe('LeadRoutingService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock Supabase client with chainable methods
    // All chainable methods return `this` by default so arbitrary chains work
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      rpc: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('routeLead', () => {
    it('should route lead successfully when lock acquired', async () => {
      const leadId = crypto.randomUUID()
      const workspaceId = crypto.randomUUID()
      const destinationWorkspaceId = crypto.randomUUID()
      const ruleId = crypto.randomUUID()

      // Mock lock acquisition and complete_routing via rpc
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'acquire_routing_lock') {
          return Promise.resolve({ data: true, error: null })
        }
        if (funcName === 'complete_routing') {
          return Promise.resolve({ data: true, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // Mock from() to return table-specific chains
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leads') {
          const leadChain: any = {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: leadId,
                      workspace_id: workspaceId,
                      company_industry: 'Technology',
                      company_location: { country: 'US', state: 'CA' },
                      dedupe_hash: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }
          return leadChain
        }
        if (table === 'lead_routing_rules') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: ruleId,
                        rule_name: 'Tech Rule',
                        destination_workspace_id: destinationWorkspaceId,
                        priority: 100,
                        is_active: true,
                        conditions: {
                          industries: ['Technology'],
                        },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return mockSupabase
      })

      const result = await LeadRoutingService.routeLead({
        leadId,
        sourceWorkspaceId: workspaceId,
        userId: 'test-user',
      })

      expect(result.success).toBe(true)
      expect(result.destinationWorkspaceId).toBe(destinationWorkspaceId)
      expect(result.matchedRuleId).toBe(ruleId)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('acquire_routing_lock', expect.any(Object))
      expect(mockSupabase.rpc).toHaveBeenCalledWith('complete_routing', expect.any(Object))
    })

    it('should fail when lock cannot be acquired', async () => {
      const leadId = crypto.randomUUID()
      const workspaceId = crypto.randomUUID()

      // Mock lock acquisition failure
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null })

      const result = await LeadRoutingService.routeLead({
        leadId,
        sourceWorkspaceId: workspaceId,
        userId: 'test-user',
      })

      expect(result.success).toBe(false)
      expect(result.routingReason).toContain('already being processed')
    })

    it('should detect cross-partner duplicates', async () => {
      const leadId = crypto.randomUUID()
      const workspaceId = crypto.randomUUID()
      const duplicateLeadId = crypto.randomUUID()
      const duplicateWorkspaceId = crypto.randomUUID()

      // Mock rpc calls
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'acquire_routing_lock') {
          return Promise.resolve({ data: true, error: null })
        }
        if (funcName === 'check_cross_partner_duplicate') {
          return Promise.resolve({
            data: [
              {
                duplicate_lead_id: duplicateLeadId,
                duplicate_workspace_id: duplicateWorkspaceId,
              },
            ],
            error: null,
          })
        }
        if (funcName === 'complete_routing') {
          return Promise.resolve({ data: true, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // Mock lead fetch with dedupe_hash set (triggers duplicate check)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: leadId,
                      workspace_id: workspaceId,
                      dedupe_hash: 'abc123',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return mockSupabase
      })

      const result = await LeadRoutingService.routeLead({
        leadId,
        sourceWorkspaceId: workspaceId,
        userId: 'test-user',
      })

      expect(result.success).toBe(true)
      expect(result.isDuplicate).toBe(true)
      expect(result.duplicateLeadId).toBe(duplicateLeadId)
      expect(result.destinationWorkspaceId).toBe(workspaceId) // Kept in source
    })

    it('should handle routing errors and queue for retry', async () => {
      const leadId = crypto.randomUUID()
      const workspaceId = crypto.randomUUID()

      // Mock lock acquisition success, fail_routing
      mockSupabase.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'acquire_routing_lock') {
          return Promise.resolve({ data: true, error: null })
        }
        if (funcName === 'fail_routing') {
          return Promise.resolve({ data: true, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // Mock lead fetch failure
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Lead not found' },
                  }),
                }),
              }),
            }),
          }
        }
        return mockSupabase
      })

      const result = await LeadRoutingService.routeLead({
        leadId,
        sourceWorkspaceId: workspaceId,
        userId: 'test-user',
        maxRetries: 3,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Lead not found')
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'fail_routing',
        expect.objectContaining({
          p_lead_id: leadId,
          p_max_attempts: 3,
        })
      )
    })
  })

  describe('processRetryQueue', () => {
    // This test requires complex mock orchestration across multiple tables
    // Skip for now - covered by integration tests
    it.skip('should process retry queue items successfully', async () => {
      // Skipped - requires live database or very complex mock setup
    })
  })

  describe('cleanupStaleLocks', () => {
    it('should release stale routing locks', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 5, error: null })

      const result = await LeadRoutingService.cleanupStaleLocks()

      expect(result.released).toBe(5)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('release_stale_routing_locks')
    })

    it('should handle cleanup errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await LeadRoutingService.cleanupStaleLocks()

      expect(result.released).toBe(0)
    })
  })

  describe('markExpiredLeads', () => {
    it('should mark expired leads', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 10, error: null })

      const result = await LeadRoutingService.markExpiredLeads()

      expect(result.expired).toBe(10)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('mark_expired_leads')
    })
  })

  describe('getRoutingHealth', () => {
    it('should return routing health metrics', async () => {
      const workspaceId = crypto.randomUUID()

      // Mock the parallel queries used in getRoutingHealth
      // Each call to from() returns a chainable that eventually resolves with { count }
      let callIndex = 0
      mockSupabase.from.mockImplementation(() => {
        const chain: any = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.lt = vi.fn().mockReturnValue(chain)
        chain.is = vi.fn().mockReturnValue(chain)

        // getRoutingHealth uses Promise.all with 5 parallel queries.
        // Each resolves as a thenable with a count property.
        const counts = [3, 1, 2, 5, 0] // pending, routing, failed, retryQueue, staleLocks
        const count = counts[callIndex] ?? 0
        callIndex++

        // Make chain itself resolve like a promise with { count }
        chain.then = (resolve: any) => resolve({ count })
        chain.catch = () => chain

        return chain
      })

      const health = await LeadRoutingService.getRoutingHealth(workspaceId)

      expect(health).toHaveProperty('pendingCount')
      expect(health).toHaveProperty('routingCount')
      expect(health).toHaveProperty('failedCount')
      expect(health).toHaveProperty('retryQueueCount')
      expect(health).toHaveProperty('staleLockCount')
    })
  })

  describe('doesLeadMatchRule', () => {
    it('should match lead to rule with industry condition', () => {
      const lead = {
        id: crypto.randomUUID(),
        company_industry: 'Technology',
        company_size: '50-200',
      } as any

      const rule = {
        id: crypto.randomUUID(),
        conditions: {
          industries: ['Technology', 'Software'],
        },
      } as any

      // Access private method via type assertion
      const matches = (LeadRoutingService as any).doesLeadMatchRule(lead, rule)

      expect(matches).toBe(true)
    })

    it('should not match lead when industry does not match', () => {
      const lead = {
        id: crypto.randomUUID(),
        company_industry: 'Manufacturing',
      } as any

      const rule = {
        id: crypto.randomUUID(),
        conditions: {
          industries: ['Technology'],
        },
      } as any

      const matches = (LeadRoutingService as any).doesLeadMatchRule(lead, rule)

      expect(matches).toBe(false)
    })

    it('should match lead with multiple conditions', () => {
      const lead = {
        id: crypto.randomUUID(),
        company_industry: 'Technology',
        company_size: '50-200',
        company_location: { country: 'US', state: 'CA' },
      } as any

      const rule = {
        id: crypto.randomUUID(),
        conditions: {
          industries: ['Technology'],
          company_sizes: ['50-200'],
          us_states: ['CA', 'NY'],
        },
      } as any

      const matches = (LeadRoutingService as any).doesLeadMatchRule(lead, rule)

      expect(matches).toBe(true)
    })
  })
})
