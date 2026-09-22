import { describe, it, expect } from 'vitest'
import { publicLeadSource, publicLeadSourceLabel } from '@/lib/leads/public-source'

describe('public lead source', () => {
  it.each([
    ['superpixel', 'pixel'],
    ['audiencelab_superpixel', 'pixel'],
    ['audiencelab_pixel_v4', 'pixel'],
    ['audiencelab_pull', 'daily_audience'],
    ['audiencelab_database', 'daily_audience'],
    ['audiencelab', 'daily_audience'],
    ['audience_labs_import', 'daily_audience'],
    ['Audience Labs', 'daily_audience'],
    ['marketplace', 'marketplace'],
    ['ingest', 'import'],
    ['demo', 'unknown'],
    ['clay', 'unknown'],
    ['prospeo_enrich', 'unknown'],
    ['reseller_test_matrix', 'unknown'],
    [null, 'unknown'],
  ])('maps %s to %s', (input, expected) => {
    expect(publicLeadSource(input)).toBe(expected)
  })

  // The point of the module: a provider name must never reach a customer,
  // including through a stored value nobody anticipated.
  it.each([
    'audiencelab_something_new_2027',
    'AUDIENCELAB_WEIRD',
    'audience-labs-beta',
    'partner_audiencelab_blend',
  ])('never leaks the provider name for %s', (input) => {
    // The vendor's name, not the ordinary word "audience" — `daily_audience`
    // is a fine thing for a customer to read.
    const vendor = /audience[\s_-]?labs?/i
    expect(publicLeadSource(input)).not.toMatch(vendor)
    expect(publicLeadSourceLabel(input)).not.toMatch(vendor)
  })

  it('title-cases for display', () => {
    expect(publicLeadSourceLabel('audiencelab_pull')).toBe('Daily Audience')
    expect(publicLeadSourceLabel('superpixel')).toBe('Pixel')
    expect(publicLeadSourceLabel(null)).toBe('—')
  })
})
