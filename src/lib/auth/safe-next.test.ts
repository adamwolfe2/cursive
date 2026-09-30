import { describe, it, expect } from 'vitest'
import { sanitizeNext } from './safe-next'

const APP = 'https://leads.meetcursive.com'

describe('sanitizeNext', () => {
  it('keeps same-origin paths with query and hash', () => {
    expect(sanitizeNext('/start/leads?x=1#top', APP)).toBe('/start/leads?x=1#top')
  })
  it.each([
    null,
    '',
    'https://evil.com',
    '//evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    'javascript:alert(1)',
  ])('rejects %j', (input) => {
    expect(sanitizeNext(input, APP)).toBe('/dashboard')
  })
})
