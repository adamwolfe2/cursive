/**
 * Website URL normalization + pixel version detection unit tests.
 * Tests the real production module in src/lib/funnel/website-url.ts.
 */

import { describe, it, expect } from 'vitest'
import { normalizeWebsiteUrl, isPixelV4, isPixelV3 } from '@/lib/funnel/website-url'

describe('normalizeWebsiteUrl', () => {
  describe('scheme handling', () => {
    it('prepends https:// to a bare domain', () => {
      expect(normalizeWebsiteUrl('yoursite.com')).toBe('https://yoursite.com/')
    })

    it('prepends https:// to a www subdomain', () => {
      expect(normalizeWebsiteUrl('www.yoursite.com')).toBe('https://www.yoursite.com/')
    })

    it('coerces http:// to https://', () => {
      expect(normalizeWebsiteUrl('http://yoursite.com')).toBe('https://yoursite.com/')
    })

    it('leaves an explicit https:// URL alone (including its path)', () => {
      expect(normalizeWebsiteUrl('https://yoursite.com/some/path')).toBe('https://yoursite.com/some/path')
    })

    it('is case-insensitive on the http:// scheme', () => {
      expect(normalizeWebsiteUrl('HTTP://yoursite.com')).toBe('https://yoursite.com/')
    })
  })

  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace before normalizing', () => {
      expect(normalizeWebsiteUrl('  yoursite.com  ')).toBe('https://yoursite.com/')
    })

    it('returns null for an empty string', () => {
      expect(normalizeWebsiteUrl('')).toBeNull()
    })

    it('returns null for a whitespace-only string', () => {
      expect(normalizeWebsiteUrl('   ')).toBeNull()
    })
  })

  describe('bad host rejection', () => {
    it('rejects localhost', () => {
      expect(normalizeWebsiteUrl('localhost')).toBeNull()
    })

    it('rejects http://localhost', () => {
      expect(normalizeWebsiteUrl('http://localhost')).toBeNull()
    })

    it('rejects 127.0.0.1', () => {
      expect(normalizeWebsiteUrl('127.0.0.1')).toBeNull()
    })

    it('rejects 0.0.0.0', () => {
      expect(normalizeWebsiteUrl('0.0.0.0')).toBeNull()
    })

    it('rejects a raw IPv4 literal', () => {
      expect(normalizeWebsiteUrl('192.168.1.5')).toBeNull()
    })

    it('rejects an IPv6 literal', () => {
      expect(normalizeWebsiteUrl('[::1]')).toBeNull()
    })

    it('rejects a .internal host', () => {
      expect(normalizeWebsiteUrl('server.internal')).toBeNull()
    })

    it('rejects a .local host', () => {
      expect(normalizeWebsiteUrl('myapp.local')).toBeNull()
    })

    it('rejects a .localhost host', () => {
      expect(normalizeWebsiteUrl('foo.localhost')).toBeNull()
    })

    it('rejects a bare word with no dot (not a resolvable domain)', () => {
      expect(normalizeWebsiteUrl('bareword')).toBeNull()
    })
  })

  describe('malformed input', () => {
    it('returns null for unparseable input', () => {
      expect(normalizeWebsiteUrl('http://')).toBeNull()
    })

    it('returns null for input that is just a scheme separator', () => {
      expect(normalizeWebsiteUrl('://')).toBeNull()
    })
  })

  describe('valid real-world inputs', () => {
    it('normalizes a domain with a trailing slash unchanged', () => {
      expect(normalizeWebsiteUrl('https://yoursite.com/')).toBe('https://yoursite.com/')
    })

    it('lowercases the host but preserves path casing', () => {
      expect(normalizeWebsiteUrl('HTTPS://YourSite.COM/Path')).toBe('https://yoursite.com/Path')
    })

    it('accepts a subdomain', () => {
      expect(normalizeWebsiteUrl('app.example.com')).toBe('https://app.example.com/')
    })
  })
})

describe('isPixelV4', () => {
  it('returns true for a cdn.idpixel.app install URL', () => {
    expect(isPixelV4('https://cdn.idpixel.app/v1/idp-analytics-123.min.js')).toBe(true)
  })

  it('returns true for any URL containing /v4/', () => {
    expect(isPixelV4('https://some-other-cdn.example.com/v4/pixel.js')).toBe(true)
  })

  it('returns false for a v3 legacy install URL', () => {
    expect(isPixelV4('https://cdn.v3.identitypxl.app/pixel.js')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isPixelV4(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isPixelV4(undefined)).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isPixelV4('')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isPixelV4('https://CDN.IDPIXEL.APP/v1/x.min.js')).toBe(true)
  })
})

describe('isPixelV3', () => {
  it('returns true for a cdn.v3.identitypxl.app install URL', () => {
    expect(isPixelV3('https://cdn.v3.identitypxl.app/pixel.js')).toBe(true)
  })

  it('returns false for a v4 install URL', () => {
    expect(isPixelV3('https://cdn.idpixel.app/v1/idp-analytics-123.min.js')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isPixelV3(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isPixelV3(undefined)).toBe(false)
  })

  it('returns false for an unrelated URL', () => {
    expect(isPixelV3('https://example.com/script.js')).toBe(false)
  })
})
