import { describe, it, expect } from 'vitest'
import { sanitizeNext } from './safe-next'

describe('sanitizeNext', () => {
  it('keeps same-origin paths with query and hash', () => {
    expect(sanitizeNext('/start/leads?c=abc#top')).toBe('/start/leads?c=abc#top')
  })
  it('normalizes harmless dot segments', () => {
    expect(sanitizeNext('/a/../dashboard')).toBe('/dashboard')
  })
  it.each([
    null,
    undefined,
    '',
    'https://evil.com',
    '//evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    '/..//evil.com',
    '/./..//evil.com',
    '/%2e%2e//evil.com',
    'javascript:alert(1)',
  ])('rejects %j', (input) => {
    expect(sanitizeNext(input)).toBe('/dashboard')
  })
  it('never returns a protocol-relative or absolute target', () => {
    for (const p of ['/..//evil.com', '/\t/evil.com', '/x/..//..//evil.com']) {
      const out = sanitizeNext(p)
      expect(new URL(out, 'https://leads.meetcursive.com').origin).toBe('https://leads.meetcursive.com')
    }
  })
})
