import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ALEnrichedProfile } from '@/lib/audiencelab/api-client'

vi.mock('@/lib/audiencelab/api-client', async (importActual) => ({
  ...(await importActual<typeof import('@/lib/audiencelab/api-client')>()),
  enrich: vi.fn(),
}))

import { enrich } from '@/lib/audiencelab/api-client'
import { enrichTopUp, maybeEnrichTopUp } from './lead-enrichment.service'

const mockedEnrich = enrich as unknown as ReturnType<typeof vi.fn>

const sparse = {
  BUSINESS_VERIFIED_EMAILS: 'jane@acme.com',
  FIRST_NAME: 'Jane',
  LAST_NAME: 'Doe',
  COMPANY_NAME: '', // missing -> should be filled
  JOB_TITLE: '', // missing -> should be filled
} as unknown as ALEnrichedProfile

beforeEach(() => mockedEnrich.mockReset())

describe('enrichTopUp', () => {
  it('fills only the missing fields, never overwriting existing data', async () => {
    mockedEnrich.mockResolvedValue({
      found: 1,
      result: [{ FIRST_NAME: 'WRONG', COMPANY_NAME: 'Acme Inc', JOB_TITLE: 'VP Sales' }],
    })
    const out = (await enrichTopUp(sparse)) as Record<string, unknown>
    expect(out.COMPANY_NAME).toBe('Acme Inc')
    expect(out.JOB_TITLE).toBe('VP Sales')
    expect(out.FIRST_NAME).toBe('Jane') // existing value preserved
    expect(mockedEnrich).toHaveBeenCalledWith({ filter: { email: 'jane@acme.com' } })
  })

  it('returns the original record when AL finds no match', async () => {
    mockedEnrich.mockResolvedValue({ found: 0, result: [] })
    expect(await enrichTopUp(sparse)).toEqual(sparse)
  })

  it('returns the original record when AL returns a malformed response', async () => {
    mockedEnrich.mockResolvedValue({ found: 1, result: undefined })
    expect(await enrichTopUp(sparse)).toEqual(sparse)
  })

  it('never throws / blocks delivery when processing the response fails (try/catch)', async () => {
    // A resolved value whose access throws exercises the catch block, without a
    // mock-thrown error (Vitest 4 surfaces those as uncaught even when caught).
    const exploding = {
      get found(): number {
        throw new Error('AL 500')
      },
    }
    mockedEnrich.mockResolvedValue(exploding)
    expect(await enrichTopUp(sparse)).toEqual(sparse)
  })

  it('falls back to company_domain when there is no email', async () => {
    const noEmail = { COMPANY_DOMAIN: 'acme.com', COMPANY_NAME: '' } as unknown as ALEnrichedProfile
    mockedEnrich.mockResolvedValue({ found: 1, result: [{ COMPANY_NAME: 'Acme Inc' }] })
    const out = (await enrichTopUp(noEmail)) as Record<string, unknown>
    expect(mockedEnrich).toHaveBeenCalledWith({ filter: { company_domain: 'acme.com' } })
    expect(out.COMPANY_NAME).toBe('Acme Inc')
  })

  it('does not call enrich when there is neither email nor domain', async () => {
    const bare = { FIRST_NAME: 'Jane' } as unknown as ALEnrichedProfile
    const out = await enrichTopUp(bare)
    expect(mockedEnrich).not.toHaveBeenCalled()
    expect(out).toEqual(bare)
  })
})

describe('maybeEnrichTopUp (gating)', () => {
  const env = process.env.LEAD_ENRICH_TOPUP
  beforeEach(() => mockedEnrich.mockReset())
  afterEach(() => {
    if (env === undefined) delete process.env.LEAD_ENRICH_TOPUP
    else process.env.LEAD_ENRICH_TOPUP = env
  })

  it('skips the enrich call when the record does not need enrichment', async () => {
    const out = await maybeEnrichTopUp(sparse, false)
    expect(mockedEnrich).not.toHaveBeenCalled()
    expect(out).toBe(sparse)
  })

  it('skips the enrich call when killed via LEAD_ENRICH_TOPUP=off', async () => {
    process.env.LEAD_ENRICH_TOPUP = 'off'
    const out = await maybeEnrichTopUp(sparse, true)
    expect(mockedEnrich).not.toHaveBeenCalled()
    expect(out).toBe(sparse)
  })

  it('enriches when needed and not killed', async () => {
    delete process.env.LEAD_ENRICH_TOPUP
    mockedEnrich.mockResolvedValue({ found: 1, result: [{ COMPANY_NAME: 'Acme Inc' }] })
    const out = (await maybeEnrichTopUp(sparse, true)) as Record<string, unknown>
    expect(mockedEnrich).toHaveBeenCalledTimes(1)
    expect(out.COMPANY_NAME).toBe('Acme Inc')
  })
})
