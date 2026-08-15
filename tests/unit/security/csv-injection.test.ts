import { describe, it, expect } from 'vitest'
import { sanitizeCsvValue, isPotentialCsvInjection } from '@/lib/utils/csv-sanitizer'

// Regression coverage for the CSV formula-injection fix applied across the export
// endpoints (export.service, crm/export, leads/bulk, funnel visitors, partner
// leaderboard/payouts, campaign-builder). Each exporter now routes cell values
// through sanitizeCsvValue before quoting.
describe('CSV formula injection — sanitizeCsvValue', () => {
  it('neutralizes every dangerous formula prefix', () => {
    for (const payload of [
      '=SUM(A1:A10)',
      '+1234567890',
      '-2+3',
      '@SUM(1)',
      '=HYPERLINK("http://evil.tld","x")',
      '=cmd|\'/c calc\'!A1',
      '\t=1+1',
      '\r=1+1',
    ]) {
      const out = sanitizeCsvValue(payload)
      expect(out.startsWith("'")).toBe(true)
      expect(isPotentialCsvInjection(payload)).toBe(true)
    }
  })

  it('leaves ordinary values unchanged', () => {
    expect(sanitizeCsvValue('Acme Inc')).toBe('Acme Inc')
    expect(sanitizeCsvValue('john@example.com')).toBe('john@example.com')
    expect(sanitizeCsvValue('123 Main St')).toBe('123 Main St')
  })

  it('handles null/undefined safely', () => {
    expect(sanitizeCsvValue(null)).toBe('')
    expect(sanitizeCsvValue(undefined)).toBe('')
  })
})
