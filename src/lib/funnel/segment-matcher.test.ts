import { describe, it, expect, vi, beforeEach } from 'vitest'

const searchMock = vi.fn()
const previewMock = vi.fn()
vi.mock('@/lib/copilot/retrieval', () => ({ searchSegments: (...a: unknown[]) => searchMock(...a) }))
vi.mock('@/lib/audiencelab/api-client', () => ({ previewAudience: (...a: unknown[]) => previewMock(...a) }))

import { autoMatchSegments, icpToQuery } from './segment-matcher'

beforeEach(() => {
  searchMock.mockReset()
  previewMock.mockReset()
})

describe('icpToQuery', () => {
  it('composes the ICP fields into one query', () => {
    const q = icpToQuery({
      icp_description: 'We help dentists fill chairs',
      solution: 'patient acquisition',
      titles: ['Practice Owner', 'Dentist'],
      industries: ['Dental'],
    })
    expect(q).toContain('dentists')
    expect(q).toContain('Practice Owner')
    expect(q).toContain('Dental')
  })

  it('drops empty fields and returns empty for no input', () => {
    expect(icpToQuery({})).toBe('')
    expect(icpToQuery({ titles: [], industries: [''] })).toBe('')
  })
})

describe('autoMatchSegments', () => {
  it('returns the top N matched segments ranked', async () => {
    searchMock.mockResolvedValue([
      { segment_id: '1', name: 'Dentists', category: 'Health', similarity: 0.91 },
      { segment_id: '2', name: 'Dental Practices', category: 'Health', similarity: 0.84 },
    ])
    const out = await autoMatchSegments({ icp_description: 'dentists' }, { topN: 5 })
    expect(out.segments).toHaveLength(2)
    expect(out.segments[0].segment_id).toBe('1')
    expect(searchMock).toHaveBeenCalledWith({ query: 'dentists', limit: 5 })
    expect(previewMock).not.toHaveBeenCalled() // counts not requested
  })

  it('marks confidence high when top match is strong', async () => {
    searchMock.mockResolvedValue([{ segment_id: '1', name: 'X', category: 'C', similarity: 0.88 }])
    const out = await autoMatchSegments({ icp_description: 'x' })
    expect(out.confidence).toBe('high')
  })

  it('marks confidence low when the best match is weak', async () => {
    searchMock.mockResolvedValue([{ segment_id: '1', name: 'X', category: 'C', similarity: 0.41 }])
    const out = await autoMatchSegments({ icp_description: 'x' })
    expect(out.confidence).toBe('low')
  })

  it('enriches with live counts and downgrades a strong match with no volume', async () => {
    searchMock.mockResolvedValue([{ segment_id: '9', name: 'Niche', category: 'C', similarity: 0.95 }])
    previewMock.mockResolvedValue({ count: 0 })
    const out = await autoMatchSegments({ icp_description: 'niche' }, { withCounts: true })
    expect(out.segments[0].inMarketCount).toBe(0)
    expect(previewMock).toHaveBeenCalledWith({ days_back: 30, limit: 1, segment: '9' })
    expect(out.confidence).not.toBe('high') // strong fit but zero volume
  })

  it('returns empty + low confidence for an empty ICP (no search call)', async () => {
    const out = await autoMatchSegments({})
    expect(out.segments).toEqual([])
    expect(out.confidence).toBe('low')
    expect(searchMock).not.toHaveBeenCalled()
  })
})
