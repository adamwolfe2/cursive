/**
 * AL Prospecting Service — unit tests
 *
 * Covers:
 *  - buildAlFilters() — flat -> nested AL shape
 *  - cap_per_run hard-cap and HARD_CAP_PER_RUN ceiling
 *  - dev mock branch (OUTBOUND_DEV_MOCK_AL=1)
 *  - dedupe by email
 *  - empty preview / overly broad filter errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the AudienceLab client BEFORE importing the service under test
vi.mock('@/lib/audiencelab/api-client', async () => {
  const actual = await vi.importActual<any>('@/lib/audiencelab/api-client')
  return {
    ...actual,
    previewAudience: vi.fn(),
    createAudience: vi.fn(),
    fetchAudienceRecords: vi.fn(),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import {
  prospectAndIngest,
  buildAlFilters,
  EmptyPreviewError,
  OverlyBroadFilterError,
  CREDIT_COST_PER_LEAD,
  HARD_CAP_PER_RUN,
} from '@/lib/services/outbound/al-prospecting.service'
import * as alClient from '@/lib/audiencelab/api-client'
import { createAdminClient } from '@/lib/supabase/admin'

const mockedPreview = alClient.previewAudience as unknown as ReturnType<typeof vi.fn>
const mockedCreate = alClient.createAudience as unknown as ReturnType<typeof vi.fn>
const mockedFetch = alClient.fetchAudienceRecords as unknown as ReturnType<typeof vi.fn>
const mockedAdmin = createAdminClient as unknown as ReturnType<typeof vi.fn>

// Helper: build a fake supabase admin client. Each chain call records params.
function makeFakeSupabase(opts: {
  workspaceCreditBalance?: number
  existingEmails?: string[]
  insertReturnIds?: string[]
  insertError?: { message: string } | null
  rpcResult?: any[]
  rpcError?: { message: string } | null
}) {
  const balance = opts.workspaceCreditBalance ?? 1000
  const existing = opts.existingEmails ?? []
  const insertedIds = opts.insertReturnIds ?? ['lead-1', 'lead-2', 'lead-3']
  const insertError = opts.insertError ?? null
  const rpcResult = opts.rpcResult ?? [{ success: true, new_balance: balance - 1 }]

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'workspaces') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'ws-1', credits_balance: balance },
            error: null,
          }),
        }
      }
      if (table === 'leads') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: existing.map(e => ({ email: e })),
            error: null,
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: insertError ? null : insertedIds.map(id => ({ id, email: `${id}@example.com` })),
              error: insertError,
            }),
          }),
        }
      }
      return {}
    }),
    rpc: vi.fn().mockResolvedValue({
      data: rpcResult,
      error: opts.rpcError ?? null,
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.OUTBOUND_DEV_MOCK_AL
})

afterEach(() => {
  delete process.env.OUTBOUND_DEV_MOCK_AL
})

// ============================================================================
// buildAlFilters
// ============================================================================
describe('buildAlFilters', () => {
  it('returns empty object for empty filters', () => {
    expect(buildAlFilters({})).toEqual({})
  })

  it('groups industry/seniority/job_titles under business', () => {
    const result = buildAlFilters({
      industries: ['Software', 'Marketing'],
      seniority_levels: ['Director', 'VP'],
      job_titles: ['Head of Growth'],
    })
    expect(result.business).toEqual({
      industry: ['Software', 'Marketing'],
      seniority: ['Director', 'VP'],
      jobTitle: ['Head of Growth'],
    })
  })

  it('groups state/city/zip under location', () => {
    const result = buildAlFilters({
      states: ['CA', 'TX'],
      cities: ['San Francisco'],
      zips: ['94105'],
    })
    expect(result.location).toEqual({
      state: ['CA', 'TX'],
      city: ['San Francisco'],
      zip: ['94105'],
    })
  })

  it('handles employee_count and company_revenue range objects', () => {
    const result = buildAlFilters({
      employee_count: { min: 50, max: 500 },
      company_revenue: { min: 1_000_000, max: 50_000_000 },
    })
    expect(result.business?.employeeCount).toEqual({ min: 50, max: 500 })
    expect(result.business?.companyRevenue).toEqual({ min: 1_000_000, max: 50_000_000 })
  })

  it('omits empty arrays', () => {
    const result = buildAlFilters({
      industries: [],
      states: [],
      cities: ['SF'],
    })
    expect(result.business).toBeUndefined()
    expect(result.location).toEqual({ city: ['SF'] })
  })

  it('handles departments / sic / naics arrays', () => {
    const result = buildAlFilters({
      departments: ['Engineering'],
      sic: ['7372'],
      naics: ['541511'],
    })
    expect(result.business).toEqual({
      department: ['Engineering'],
      sic: ['7372'],
      naics: ['541511'],
    })
  })
})

// ============================================================================
// dev mock branch
// ============================================================================
describe('prospectAndIngest — dev mock', () => {
  it('returns 5 mock leads when OUTBOUND_DEV_MOCK_AL=1, regardless of target', async () => {
    process.env.OUTBOUND_DEV_MOCK_AL = '1'
    mockedAdmin.mockReturnValue(makeFakeSupabase({}) as any)

    const result = await prospectAndIngest({
      workspaceId: 'ws-1',
      agentId: 'a-1',
      filters: { industries: ['Software'], cap_per_run: 5 },
      targetCount: 50,
    })

    expect(result.devMock).toBe(true)
    expect(result.newLeads).toBe(5)
    expect(result.creditsCharged).toBe(0)
    expect(mockedPreview).not.toHaveBeenCalled()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('mock count is capped to min(target, cap_per_run, 5)', async () => {
    process.env.OUTBOUND_DEV_MOCK_AL = '1'
    mockedAdmin.mockReturnValue(makeFakeSupabase({}) as any)

    const result = await prospectAndIngest({
      workspaceId: 'ws-1',
      agentId: 'a-1',
      filters: { cap_per_run: 3 },
      targetCount: 100,
    })

    expect(result.newLeads).toBe(3)
  })
})

// ============================================================================
// real branch — preview validation
// ============================================================================
describe('prospectAndIngest — preview errors', () => {
  it('throws EmptyPreviewError when count === 0', async () => {
    mockedPreview.mockResolvedValue({ count: 0, result: [] })

    await expect(
      prospectAndIngest({
        workspaceId: 'ws-1',
        agentId: 'a-1',
        filters: { industries: ['Nonexistent'] },
        targetCount: 5,
      })
    ).rejects.toBeInstanceOf(EmptyPreviewError)
  })

  it('throws OverlyBroadFilterError when count > UNFILTERED_PREVIEW_THRESHOLD', async () => {
    mockedPreview.mockResolvedValue({ count: 200_000, result: [] })

    await expect(
      prospectAndIngest({
        workspaceId: 'ws-1',
        agentId: 'a-1',
        filters: {},
        targetCount: 5,
      })
    ).rejects.toBeInstanceOf(OverlyBroadFilterError)
  })
})

// ============================================================================
// real branch — happy path with dedupe + credit deduction
// ============================================================================
describe('prospectAndIngest — happy path', () => {
  it('dedupes existing emails and charges only for new leads', async () => {
    mockedPreview.mockResolvedValue({ count: 100, result: [] })
    mockedCreate.mockResolvedValue({ audienceId: 'aud-1' })
    mockedFetch.mockResolvedValue({
      data: [
        { BUSINESS_EMAIL: 'a@new.com', FIRST_NAME: 'A', LAST_NAME: 'X', COMPANY_NAME: 'Co' },
        { BUSINESS_EMAIL: 'b@new.com', FIRST_NAME: 'B', LAST_NAME: 'Y', COMPANY_NAME: 'Co' },
        { BUSINESS_EMAIL: 'c@dup.com', FIRST_NAME: 'C', LAST_NAME: 'Z', COMPANY_NAME: 'Co' },
      ],
      total_records: 3,
      page: 1,
      page_size: 5,
      total_pages: 1,
    })

    mockedAdmin.mockReturnValue(
      makeFakeSupabase({
        existingEmails: ['c@dup.com'],
        insertReturnIds: ['lead-a', 'lead-b'],
      }) as any
    )

    const result = await prospectAndIngest({
      workspaceId: 'ws-1',
      agentId: 'a-1',
      filters: { industries: ['Software'], cap_per_run: 5 },
      targetCount: 5,
    })

    expect(result.fetched).toBe(3)
    expect(result.newLeads).toBe(2)
    expect(result.duplicatesSkipped).toBe(1)
    expect(result.creditsCharged).toBe(2 * CREDIT_COST_PER_LEAD)
    expect(result.insertedLeadIds).toEqual(['lead-a', 'lead-b'])
  })

  it('caps requestedCount to HARD_CAP_PER_RUN even when cap_per_run is huge', async () => {
    mockedPreview.mockResolvedValue({ count: 5000, result: [] })
    mockedCreate.mockResolvedValue({ audienceId: 'aud-2' })
    mockedFetch.mockResolvedValue({
      data: [],
      total_records: 0,
      page: 1,
      page_size: HARD_CAP_PER_RUN,
      total_pages: 0,
    })
    mockedAdmin.mockReturnValue(makeFakeSupabase({}) as any)

    await prospectAndIngest({
      workspaceId: 'ws-1',
      agentId: 'a-1',
      filters: { cap_per_run: 500 }, // intentionally above HARD_CAP_PER_RUN
      targetCount: 999,
    })

    expect(mockedFetch).toHaveBeenCalledWith('aud-2', 1, HARD_CAP_PER_RUN)
  })

  it('honors cap_per_run when smaller than HARD_CAP_PER_RUN', async () => {
    mockedPreview.mockResolvedValue({ count: 5000, result: [] })
    mockedCreate.mockResolvedValue({ audienceId: 'aud-cap' })
    mockedFetch.mockResolvedValue({
      data: [],
      total_records: 0,
      page: 1,
      page_size: 25,
      total_pages: 0,
    })
    mockedAdmin.mockReturnValue(makeFakeSupabase({}) as any)

    await prospectAndIngest({
      workspaceId: 'ws-1',
      agentId: 'a-1',
      filters: { cap_per_run: 25 },
      targetCount: 999,
    })

    expect(mockedFetch).toHaveBeenCalledWith('aud-cap', 1, 25)
  })

  it('returns zeros when no new leads after dedupe', async () => {
    mockedPreview.mockResolvedValue({ count: 50, result: [] })
    mockedCreate.mockResolvedValue({ audienceId: 'aud-3' })
    mockedFetch.mockResolvedValue({
      data: [
        { BUSINESS_EMAIL: 'x@dup.com', FIRST_NAME: 'X', LAST_NAME: 'Y', COMPANY_NAME: 'Co' },
      ],
      total_records: 1,
      page: 1,
      page_size: 5,
      total_pages: 1,
    })

    mockedAdmin.mockReturnValue(
      makeFakeSupabase({ existingEmails: ['x@dup.com'] }) as any
    )

    const result = await prospectAndIngest({
      workspaceId: 'ws-1',
      agentId: 'a-1',
      filters: { industries: ['Software'] },
      targetCount: 5,
    })

    expect(result.newLeads).toBe(0)
    expect(result.duplicatesSkipped).toBe(1)
    expect(result.creditsCharged).toBe(0)
  })
})
