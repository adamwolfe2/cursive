/**
 * Edge Processor Unit Tests
 *
 * Tests the processEventInline function from edge-processor.ts.
 * This is the core of the AL pipeline: normalize -> identity -> lead -> route -> notify.
 *
 * Since processEventInline is deeply coupled to Supabase, we test it via
 * mock-heavy integration. The pure logic (scoring, field mapping) is tested
 * in field-map.test.ts. Here we verify the orchestration flow:
 * - Fetches raw event from DB
 * - Skips already-processed events
 * - Normalizes payload fields
 * - Upserts identity (find existing vs. create new)
 * - Checks lead-worthiness before creating leads
 * - Routes new leads to matching users
 * - Marks events as processed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// MOCKS
// ============================================

// Track all DB operations for assertions
const dbOperations: Array<{ table: string; op: string; data?: any; filter?: any }> = []

function createChainMock(defaultResult?: any) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn((data: any) => {
    return chain
  })
  chain.update = vi.fn((data: any) => {
    return chain
  })
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.contains = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(defaultResult ?? { data: null, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue(defaultResult ?? { data: null, error: null })
  return chain
}

// Per-table mock behavior
let eventFetchResult: any = null
let identityFindResult: any = null
let identityInsertResult: any = null
let leadCheckResult: any = null
let leadInsertResult: any = null
let targetingResult: any = null
let leadFetchResult: any = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => {
    return {
      from: vi.fn((table: string) => {
        const chain = createChainMock()

        if (table === 'audiencelab_events') {
          chain.single.mockImplementation(() => {
            return Promise.resolve(eventFetchResult)
          })
          chain.update.mockImplementation((data: any) => {
            dbOperations.push({ table, op: 'update', data })
            return chain
          })
          return chain
        }

        if (table === 'audiencelab_identities') {
          // For find queries (select), return identityFindResult
          chain.single.mockImplementation(() => {
            return Promise.resolve(identityFindResult)
          })
          // For inserts, return identityInsertResult
          chain.insert.mockImplementation((data: any) => {
            dbOperations.push({ table, op: 'insert', data })
            const insertChain = createChainMock()
            insertChain.single.mockResolvedValue(identityInsertResult)
            return insertChain
          })
          chain.update.mockImplementation((data: any) => {
            dbOperations.push({ table, op: 'update', data })
            return chain
          })
          return chain
        }

        if (table === 'leads') {
          // For lead existence check
          chain.single.mockImplementation(() => {
            return Promise.resolve(leadCheckResult)
          })
          // For lead insert
          chain.insert.mockImplementation((data: any) => {
            dbOperations.push({ table, op: 'insert', data })
            const insertChain = createChainMock()
            insertChain.single.mockResolvedValue(leadInsertResult)
            return insertChain
          })
          chain.update.mockImplementation((data: any) => {
            dbOperations.push({ table, op: 'update', data })
            return chain
          })
          return chain
        }

        if (table === 'user_targeting') {
          chain.eq.mockReturnValue(chain)
          // Override final call in chain for targeting results
          const targetChain = createChainMock()
          targetChain.select.mockReturnValue(targetChain)
          targetChain.eq.mockReturnValue(targetChain)
          targetChain.single.mockResolvedValue(targetingResult)
          // The actual query doesn't use .single(), it returns array data
          chain.select.mockReturnValue(chain)

          return chain
        }

        if (table === 'user_lead_assignments') {
          chain.insert.mockImplementation((data: any) => {
            dbOperations.push({ table, op: 'insert', data })
            return Promise.resolve({ data: null, error: null })
          })
          return chain
        }

        return chain
      }),
    }
  }),
}))

vi.mock('@/lib/services/lead-notifications.service', () => ({
  notifyNewLead: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeLog: vi.fn(),
  safeError: vi.fn(),
}))

// Import after mocks
import { processEventInline } from '@/lib/audiencelab/edge-processor'

// ============================================
// HELPERS
// ============================================

function makeRawEvent(overrides: Record<string, any> = {}) {
  return {
    event: 'page_view',
    pixel_id: 'px-001',
    uid: 'uid-001',
    profile_id: 'prof-001',
    hem_sha256: 'hash-abc',
    FIRST_NAME: 'John',
    LAST_NAME: 'Doe',
    PERSONAL_EMAILS: 'john@acme.com',
    BUSINESS_EMAILS: 'john@business.com',
    PERSONAL_PHONE: '5125551234',
    PERSONAL_EMAIL_VALIDATION_STATUS: 'valid (esp)',
    PERSONAL_EMAIL_LAST_SEEN_BY_ESP_DATE: new Date().toISOString(),
    SKIPTRACE_MATCH_BY: 'name_address',
    COMPANY_NAME: 'Acme Corp',
    COMPANY_DOMAIN: 'acme.com',
    JOB_TITLE: 'VP Sales',
    STATE: 'TX',
    PERSONAL_CITY: 'Austin',
    ZIP: '78701',
    ip_address: '1.2.3.4',
    ...overrides,
  }
}

// ============================================
// TESTS
// ============================================

describe('processEventInline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbOperations.length = 0

    // Default mock results
    eventFetchResult = {
      data: {
        id: 'evt-001',
        raw: makeRawEvent(),
        processed: false,
        workspace_id: 'ws-001',
        lead_id: null,
        identity_id: null,
      },
      error: null,
    }

    // No existing identity (triggers insert)
    identityFindResult = {
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    }

    // Identity insert succeeds
    identityInsertResult = {
      data: { id: 'ident-001' },
      error: null,
    }

    // No existing lead (duplicate check)
    leadCheckResult = {
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    }

    // Lead insert succeeds
    leadInsertResult = {
      data: { id: 'lead-001' },
      error: null,
    }

    // No targeting users
    targetingResult = {
      data: [],
      error: null,
    }
  })

  describe('Event fetching', () => {
    it('should return error if event is not found', async () => {
      eventFetchResult = {
        data: null,
        error: { message: 'Not found' },
      }

      const result = await processEventInline('evt-999', 'ws-001', 'superpixel')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Event not found')
    })

    it('should return success for already-processed events', async () => {
      eventFetchResult = {
        data: {
          id: 'evt-001',
          raw: makeRawEvent(),
          processed: true,
          lead_id: 'lead-existing',
          identity_id: 'ident-existing',
        },
        error: null,
      }

      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      expect(result.success).toBe(true)
      expect(result.lead_id).toBe('lead-existing')
      expect(result.identity_id).toBe('ident-existing')
    })
  })

  describe('Events without identifiable info', () => {
    it('should mark event as processed when no email, profile_id, or hem', async () => {
      eventFetchResult = {
        data: {
          id: 'evt-anon',
          raw: { event: 'page_view', ip_address: '1.2.3.4' },
          processed: false,
          workspace_id: 'ws-001',
        },
        error: null,
      }

      const result = await processEventInline('evt-anon', 'ws-001', 'superpixel')

      expect(result.success).toBe(true)
      expect(result.error).toBe('no_identifiable_info')
    })
  })

  describe('Identity upsert', () => {
    it('should create a new identity when none exists', async () => {
      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      // Check that an identity insert was attempted
      const identityInserts = dbOperations.filter(
        op => op.table === 'audiencelab_identities' && op.op === 'insert'
      )
      expect(identityInserts.length).toBeGreaterThanOrEqual(1)
    })

    it('should update an existing identity when found by profile_id', async () => {
      identityFindResult = {
        data: { id: 'ident-existing', visit_count: 3, lead_id: null },
        error: null,
      }

      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      // Check that an identity update was attempted
      const identityUpdates = dbOperations.filter(
        op => op.table === 'audiencelab_identities' && op.op === 'update'
      )
      expect(identityUpdates.length).toBeGreaterThanOrEqual(1)
    })

    it('should return error when identity insert fails', async () => {
      identityInsertResult = {
        data: null,
        error: { message: 'Insert constraint violation' },
      }

      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Identity insert failed')
    })
  })

  describe('Lead creation', () => {
    it('should update existing lead when identity is already linked', async () => {
      identityFindResult = {
        data: { id: 'ident-linked', visit_count: 5, lead_id: 'lead-existing' },
        error: null,
      }

      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      // Should update the existing lead, not create a new one
      const leadUpdates = dbOperations.filter(
        op => op.table === 'leads' && op.op === 'update'
      )
      const leadInserts = dbOperations.filter(
        op => op.table === 'leads' && op.op === 'insert'
      )
      expect(leadUpdates.length).toBeGreaterThanOrEqual(1)
      expect(leadInserts.length).toBe(0)
    })
  })

  describe('Event marking', () => {
    it('should mark event as processed on success', async () => {
      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      // Check that audiencelab_events was updated with processed=true
      const eventUpdates = dbOperations.filter(
        op => op.table === 'audiencelab_events' && op.op === 'update'
      )
      // At minimum, the event should be updated
      expect(eventUpdates.length).toBeGreaterThanOrEqual(1)
      const lastUpdate = eventUpdates[eventUpdates.length - 1]
      expect(lastUpdate.data.processed).toBe(true)
    })

    it('should return success=true with identity_id', async () => {
      const result = await processEventInline('evt-001', 'ws-001', 'superpixel')

      expect(result.success).toBe(true)
      expect(result.identity_id).toBeDefined()
    })
  })

  describe('Error resilience', () => {
    it('should never throw — returns error in result instead', async () => {
      // Make everything fail
      eventFetchResult = {
        data: null,
        error: { message: 'DB connection lost' },
      }

      // processEventInline should never throw
      const result = await processEventInline('evt-broken', 'ws-001', 'superpixel')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
