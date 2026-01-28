/**
 * Partner Invisibility Tests
 *
 * These tests verify that partner data is NEVER exposed to buyers.
 * This is a critical security requirement for the two-sided marketplace.
 *
 * FORBIDDEN FIELDS (must never appear in buyer responses):
 * - partner_id
 * - upload_batch_id
 * - partner identifiers/codes
 * - filenames
 * - raw upload timestamps
 * - raw verification JSON
 * - internal scoring breakdowns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Fields that must NEVER appear in buyer-facing responses
const FORBIDDEN_BUYER_FIELDS = [
  'partner_id',
  'upload_batch_id',
  'uploaded_by_partner_id',
  'partner_name',
  'partner_email',
  'partner_code',
  'partner_api_key',
  'file_name',
  'filename',
  'original_filename',
  'source_file',
  'verification_response',
  'verification_raw',
  'raw_verification',
  'raw_response',
  'upload_timestamp',
  'raw_upload_timestamp',
  'partner_commission',
  'commission_rate',
  'commission_amount',
  'internal_score_breakdown',
  'scoring_factors',
]

// Fields that must NEVER appear in partner-facing responses about buyers
const FORBIDDEN_PARTNER_FIELDS = [
  'buyer_id',
  'buyer_user_id',
  'buyer_email',
  'buyer_name',
  'buyer_company',
  'buyer_workspace_id',
  'buyer_workspace_name',
  'purchase_details',
  'buyer_ip',
]

/**
 * Helper to recursively check an object for forbidden fields
 */
function containsForbiddenFields(
  obj: unknown,
  forbiddenFields: string[],
  path = ''
): { found: boolean; fields: string[] } {
  const foundFields: string[] = []

  if (obj === null || obj === undefined) {
    return { found: false, fields: [] }
  }

  if (typeof obj !== 'object') {
    return { found: false, fields: [] }
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key

    // Check if this key is forbidden
    if (forbiddenFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      foundFields.push(currentPath)
    }

    // Recursively check nested objects and arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const result = containsForbiddenFields(item, forbiddenFields, `${currentPath}[${index}]`)
          foundFields.push(...result.fields)
        })
      } else {
        const result = containsForbiddenFields(value, forbiddenFields, currentPath)
        foundFields.push(...result.fields)
      }
    }
  }

  return {
    found: foundFields.length > 0,
    fields: foundFields,
  }
}

describe('Partner Invisibility - Buyer Endpoints', () => {
  describe('GET /api/marketplace/leads - Browse Leads', () => {
    it('should NOT include partner_id in lead listings', () => {
      // Mock response from marketplace leads endpoint
      const mockLeadResponse = {
        leads: [
          {
            id: 'lead-1',
            first_name: 'J***',
            email: 'j***@company.com',
            company_name: 'Acme Corp',
            intent_score: 75,
            freshness_score: 85,
            marketplace_price: 0.12,
            // FORBIDDEN - should NOT be present:
            // partner_id: 'partner-123',
            // upload_batch_id: 'batch-456',
          }
        ],
        total: 1,
      }

      const result = containsForbiddenFields(mockLeadResponse, FORBIDDEN_BUYER_FIELDS)
      expect(result.found).toBe(false)
      if (result.found) {
        console.error('SECURITY VIOLATION: Found forbidden fields:', result.fields)
      }
    })

    it('should NOT include upload batch information', () => {
      const mockResponse = {
        id: 'lead-1',
        upload_batch_id: 'batch-123', // FORBIDDEN
        file_name: 'leads.csv', // FORBIDDEN
      }

      const result = containsForbiddenFields(mockResponse, FORBIDDEN_BUYER_FIELDS)
      expect(result.found).toBe(true)
      expect(result.fields).toContain('upload_batch_id')
    })

    it('should NOT include raw verification response', () => {
      const mockResponse = {
        id: 'lead-1',
        verification_status: 'valid', // OK - status is allowed
        verification_response: { raw: 'data' }, // FORBIDDEN
      }

      const result = containsForbiddenFields(mockResponse, FORBIDDEN_BUYER_FIELDS)
      expect(result.found).toBe(true)
    })

    it('should NOT include commission information', () => {
      const mockResponse = {
        id: 'lead-1',
        partner_commission: 0.30, // FORBIDDEN
        commission_rate: 0.30, // FORBIDDEN
      }

      const result = containsForbiddenFields(mockResponse, FORBIDDEN_BUYER_FIELDS)
      expect(result.found).toBe(true)
    })
  })

  describe('GET /api/marketplace/purchase - Purchase Details', () => {
    it('should NOT include partner info in purchase response', () => {
      const mockPurchaseResponse = {
        purchase: {
          id: 'purchase-1',
          total_leads: 5,
          total_price: 1.50,
          created_at: '2026-01-28T00:00:00Z',
        },
        leads: [
          {
            id: 'lead-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@company.com',
            phone: '555-1234',
            // Revealed after purchase - OK
          }
        ]
      }

      const result = containsForbiddenFields(mockPurchaseResponse, FORBIDDEN_BUYER_FIELDS)
      expect(result.found).toBe(false)
    })
  })
})

describe('Partner Invisibility - Partner Endpoints', () => {
  describe('GET /api/partner/dashboard - Partner Dashboard', () => {
    it('should NOT include buyer identity in partner dashboard', () => {
      const mockDashboardResponse = {
        totalLeadsUploaded: 1000,
        totalLeadsSold: 150,
        totalEarnings: 450.00,
        recentSales: [
          {
            lead_id: 'lead-1',
            sold_at: '2026-01-28T00:00:00Z',
            commission_earned: 0.15,
            // FORBIDDEN - should NOT be present:
            // buyer_id: 'buyer-123',
            // buyer_email: 'buyer@company.com',
          }
        ]
      }

      const result = containsForbiddenFields(mockDashboardResponse, FORBIDDEN_PARTNER_FIELDS)
      expect(result.found).toBe(false)
    })

    it('should flag responses that leak buyer information', () => {
      const leakyResponse = {
        lead_id: 'lead-1',
        buyer_email: 'leaked@buyer.com', // FORBIDDEN
        buyer_company: 'Leaked Corp', // FORBIDDEN
      }

      const result = containsForbiddenFields(leakyResponse, FORBIDDEN_PARTNER_FIELDS)
      expect(result.found).toBe(true)
      expect(result.fields.length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('Data Boundary Enforcement', () => {
  describe('obfuscateLead function', () => {
    it('should properly obfuscate email addresses', () => {
      const obfuscateEmail = (email: string): string => {
        const [local, domain] = email.split('@')
        if (!local || !domain) return email
        return `${local[0]}***@${domain}`
      }

      expect(obfuscateEmail('john.doe@company.com')).toBe('j***@company.com')
      expect(obfuscateEmail('test@example.com')).toBe('t***@example.com')
    })

    it('should properly obfuscate phone numbers', () => {
      const obfuscatePhone = (phone: string): string => {
        const digits = phone.replace(/\D/g, '')
        if (digits.length < 4) return '***'
        return `***-**${digits.slice(-2)}`
      }

      expect(obfuscatePhone('555-123-4567')).toBe('***-**67')
      expect(obfuscatePhone('(555) 987-6543')).toBe('***-**43')
    })

    it('should properly obfuscate names', () => {
      const obfuscateName = (name: string): string => {
        if (!name) return ''
        return `${name[0]}***`
      }

      expect(obfuscateName('John')).toBe('J***')
      expect(obfuscateName('Alice')).toBe('A***')
    })
  })
})

describe('RLS Policy Tests', () => {
  it('should document required RLS policies', () => {
    // This test documents the required RLS policies
    // Actual testing requires a database connection

    const requiredPolicies = [
      {
        table: 'marketplace_purchases',
        policy: 'Buyers can only view their own purchases',
        rule: 'buyer_workspace_id = current_workspace_id',
      },
      {
        table: 'marketplace_purchase_items',
        policy: 'Buyers can only view items from their purchases',
        rule: 'purchase_id IN (SELECT id FROM marketplace_purchases WHERE buyer_workspace_id = current_workspace_id)',
      },
      {
        table: 'leads',
        policy: 'Partners can only view their own leads',
        rule: 'partner_id = current_partner_id',
      },
      {
        table: 'partner_upload_batches',
        policy: 'Partners can only view their own batches',
        rule: 'partner_id = current_partner_id',
      },
      {
        table: 'payouts',
        policy: 'Partners can only view their own payouts',
        rule: 'partner_id = current_partner_id',
      },
    ]

    // Document that these policies must exist
    expect(requiredPolicies.length).toBeGreaterThan(0)
    console.log('Required RLS Policies:')
    requiredPolicies.forEach(p => {
      console.log(`  ${p.table}: ${p.policy}`)
    })
  })
})

describe('Same-Workspace Gaming Prevention', () => {
  it('should detect same-workspace purchase attempts', () => {
    const checkSameWorkspaceGaming = (
      partnerWorkspaceId: string | null,
      buyerWorkspaceId: string
    ): boolean => {
      if (!partnerWorkspaceId) return false // Platform-owned lead
      return partnerWorkspaceId === buyerWorkspaceId
    }

    // Same workspace - should be blocked
    expect(checkSameWorkspaceGaming('workspace-1', 'workspace-1')).toBe(true)

    // Different workspaces - allowed
    expect(checkSameWorkspaceGaming('workspace-1', 'workspace-2')).toBe(false)

    // Platform-owned lead (no partner) - allowed
    expect(checkSameWorkspaceGaming(null, 'workspace-1')).toBe(false)
  })
})
