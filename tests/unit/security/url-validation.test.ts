/**
 * URL Validation Security Tests
 * Tests for open redirect prevention in the click tracking API
 */

import { describe, it, expect } from 'vitest'

// Recreate the validation logic from /api/track/click for testing
const ALLOWED_REDIRECT_DOMAINS = [
  'meetcursive.com',
  'cursive.com',
  'localhost',
  '127.0.0.1',
]

function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    // Check if hostname matches allowed domains
    const hostname = parsed.hostname.toLowerCase()
    return ALLOWED_REDIRECT_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

describe('URL Validation - Open Redirect Prevention', () => {
  describe('Valid URLs', () => {
    it('should accept URLs from meetcursive.com', () => {
      expect(isValidRedirectUrl('https://meetcursive.com/page')).toBe(true)
      expect(isValidRedirectUrl('https://www.meetcursive.com/page')).toBe(true)
      expect(isValidRedirectUrl('https://app.meetcursive.com/dashboard')).toBe(true)
      expect(isValidRedirectUrl('http://meetcursive.com')).toBe(true)
    })

    it('should accept URLs from cursive.com', () => {
      expect(isValidRedirectUrl('https://cursive.com')).toBe(true)
      expect(isValidRedirectUrl('https://www.cursive.com/about')).toBe(true)
      expect(isValidRedirectUrl('https://blog.cursive.com/post')).toBe(true)
    })

    it('should accept localhost URLs for development', () => {
      expect(isValidRedirectUrl('http://localhost:3000')).toBe(true)
      expect(isValidRedirectUrl('http://localhost/callback')).toBe(true)
      expect(isValidRedirectUrl('https://localhost:8080/test')).toBe(true)
    })

    it('should accept 127.0.0.1 URLs for development', () => {
      expect(isValidRedirectUrl('http://127.0.0.1:3000')).toBe(true)
      expect(isValidRedirectUrl('http://127.0.0.1/api')).toBe(true)
    })

    it('should accept URLs with query parameters', () => {
      expect(isValidRedirectUrl('https://meetcursive.com/page?ref=email')).toBe(true)
      expect(isValidRedirectUrl('https://app.cursive.com/dashboard?tab=leads&sort=asc')).toBe(true)
    })

    it('should accept URLs with fragments', () => {
      expect(isValidRedirectUrl('https://meetcursive.com/docs#section')).toBe(true)
    })
  })

  describe('Invalid URLs - Malicious Domains', () => {
    it('should reject URLs from unknown domains', () => {
      expect(isValidRedirectUrl('https://evil.com/phishing')).toBe(false)
      expect(isValidRedirectUrl('https://attacker.io/steal')).toBe(false)
      expect(isValidRedirectUrl('https://google.com')).toBe(false)
    })

    it('should reject URLs with similar-looking domains', () => {
      expect(isValidRedirectUrl('https://meetcursive.com.evil.com/fake')).toBe(false)
      expect(isValidRedirectUrl('https://cursive.com.attacker.org')).toBe(false)
    })

    it('should reject URLs with domain suffix attacks', () => {
      expect(isValidRedirectUrl('https://notmeetcursive.com')).toBe(false)
      expect(isValidRedirectUrl('https://fakecursive.com')).toBe(false)
      expect(isValidRedirectUrl('https://meetcursive.com-evil.com')).toBe(false)
    })
  })

  describe('Invalid URLs - Protocol Attacks', () => {
    it('should reject javascript: protocol', () => {
      expect(isValidRedirectUrl('javascript:alert(1)')).toBe(false)
    })

    it('should reject data: protocol', () => {
      expect(isValidRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should reject file: protocol', () => {
      expect(isValidRedirectUrl('file:///etc/passwd')).toBe(false)
    })

    it('should reject ftp: protocol', () => {
      expect(isValidRedirectUrl('ftp://ftp.example.com')).toBe(false)
    })

    it('should reject vbscript: protocol', () => {
      expect(isValidRedirectUrl('vbscript:msgbox(1)')).toBe(false)
    })
  })

  describe('Invalid URLs - Malformed Input', () => {
    it('should reject empty strings', () => {
      expect(isValidRedirectUrl('')).toBe(false)
    })

    it('should reject malformed URLs', () => {
      expect(isValidRedirectUrl('not-a-url')).toBe(false)
      expect(isValidRedirectUrl('://no-protocol')).toBe(false)
    })

    it('should reject URLs without hostname', () => {
      expect(isValidRedirectUrl('https://')).toBe(false)
    })

    it('should reject relative URLs', () => {
      expect(isValidRedirectUrl('/relative/path')).toBe(false)
      expect(isValidRedirectUrl('../parent/path')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle URL encoding in hostname', () => {
      // URL-encoded hostname attack
      expect(isValidRedirectUrl('https://%65%76%69%6c.com')).toBe(false) // 'evil.com' encoded
    })

    it('should be case-insensitive for hostnames', () => {
      expect(isValidRedirectUrl('https://MEETCURSIVE.COM')).toBe(true)
      expect(isValidRedirectUrl('https://MeetCursive.Com')).toBe(true)
    })

    it('should handle URLs with authentication credentials', () => {
      // User info in URL attack
      expect(isValidRedirectUrl('https://meetcursive.com@evil.com')).toBe(false)
    })

    it('should handle very long URLs', () => {
      const longPath = 'a'.repeat(5000)
      expect(isValidRedirectUrl(`https://meetcursive.com/${longPath}`)).toBe(true)
    })
  })
})
