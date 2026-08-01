/**
 * Unit tests for SSRF guard utilities.
 * resolvesToBlockedAddress is intentionally skipped — it hits DNS.
 */

import { describe, it, expect } from 'vitest'
import {
  isBlockedHost,
  isBlockedIpv4,
  isBlockedIpv6,
  isValidWebhookUrl,
} from '@/lib/utils/ssrf-guard'

describe('isBlockedHost', () => {
  describe('protocol checks', () => {
    it('allows http and https', () => {
      expect(isBlockedHost('http://example.com')).toBe(false)
      expect(isBlockedHost('https://example.com')).toBe(false)
    })

    it('blocks non-http(s) protocols', () => {
      expect(isBlockedHost('ftp://example.com')).toBe(true)
      expect(isBlockedHost('file:///etc/passwd')).toBe(true)
      expect(isBlockedHost('javascript:alert(1)')).toBe(true)
      expect(isBlockedHost('gopher://example.com')).toBe(true)
    })
  })

  describe('localhost and unspecified', () => {
    it('blocks localhost and 0.0.0.0', () => {
      expect(isBlockedHost('http://localhost')).toBe(true)
      expect(isBlockedHost('http://0.0.0.0')).toBe(true)
    })

    it('blocks bracketed IPv6 loopback', () => {
      expect(isBlockedHost('http://[::1]')).toBe(true)
    })
  })

  describe('IPv4 private ranges', () => {
    it('blocks 10.0.0.0/8', () => {
      expect(isBlockedHost('http://10.0.0.1')).toBe(true)
      expect(isBlockedHost('http://10.255.255.255')).toBe(true)
    })

    it('blocks 127.0.0.0/8', () => {
      expect(isBlockedHost('http://127.0.0.1')).toBe(true)
    })

    it('blocks 172.16.0.0/12 and confirms 172.32.x is NOT blocked', () => {
      expect(isBlockedHost('http://172.16.0.1')).toBe(true)
      expect(isBlockedHost('http://172.31.255.255')).toBe(true)
      expect(isBlockedHost('http://172.15.255.255')).toBe(false)
      expect(isBlockedHost('http://172.32.0.1')).toBe(false)
    })

    it('blocks 192.168.0.0/16', () => {
      expect(isBlockedHost('http://192.168.1.1')).toBe(true)
    })

    it('blocks 169.254.0.0/16 including cloud metadata', () => {
      expect(isBlockedHost('http://169.254.1.1')).toBe(true)
      expect(isBlockedHost('http://169.254.169.254')).toBe(true)
    })

    it('blocks 100.64.0.0/10 CGNAT boundaries', () => {
      expect(isBlockedHost('http://100.63.255.255')).toBe(false)
      expect(isBlockedHost('http://100.64.0.0')).toBe(true)
      expect(isBlockedHost('http://100.127.255.255')).toBe(true)
      expect(isBlockedHost('http://100.128.0.0')).toBe(false)
    })
  })

  describe('malformed input', () => {
    it('fails closed (blocked) on unparseable URL', () => {
      expect(isBlockedHost('not a url')).toBe(true)
      expect(isBlockedHost('')).toBe(true)
    })
  })

  describe('public URLs', () => {
    it('does not block a normal public URL', () => {
      expect(isBlockedHost('https://example.com')).toBe(false)
      expect(isBlockedHost('https://api.stripe.com/v1/webhooks')).toBe(false)
    })
  })
})

describe('isBlockedIpv4', () => {
  it('returns false for non-IPv4-literal hosts', () => {
    expect(isBlockedIpv4('example.com')).toBe(false)
    expect(isBlockedIpv4('localhost')).toBe(false)
  })

  it('blocks 10.0.0.0/8', () => {
    expect(isBlockedIpv4('10.0.0.1')).toBe(true)
    expect(isBlockedIpv4('10.255.255.255')).toBe(true)
  })

  it('blocks 172.16.0.0/12 and allows 172.15.x / 172.32.x', () => {
    expect(isBlockedIpv4('172.16.0.1')).toBe(true)
    expect(isBlockedIpv4('172.31.255.255')).toBe(true)
    expect(isBlockedIpv4('172.15.255.255')).toBe(false)
    expect(isBlockedIpv4('172.32.0.1')).toBe(false)
  })

  it('blocks 192.168.0.0/16', () => {
    expect(isBlockedIpv4('192.168.0.1')).toBe(true)
  })

  it('blocks 127.0.0.0/8', () => {
    expect(isBlockedIpv4('127.0.0.1')).toBe(true)
  })

  it('blocks 169.254.0.0/16 and the cloud metadata address specifically', () => {
    expect(isBlockedIpv4('169.254.169.254')).toBe(true)
    expect(isBlockedIpv4('169.254.1.1')).toBe(true)
  })

  it('blocks 0.0.0.0/8', () => {
    expect(isBlockedIpv4('0.0.0.0')).toBe(true)
    expect(isBlockedIpv4('0.1.2.3')).toBe(true)
  })

  it('blocks 100.64.0.0/10 CGNAT boundaries precisely', () => {
    expect(isBlockedIpv4('100.63.255.255')).toBe(false)
    expect(isBlockedIpv4('100.64.0.0')).toBe(true)
    expect(isBlockedIpv4('100.127.255.255')).toBe(true)
    expect(isBlockedIpv4('100.128.0.0')).toBe(false)
  })

  it('does not block a public IPv4 address', () => {
    expect(isBlockedIpv4('8.8.8.8')).toBe(false)
    expect(isBlockedIpv4('1.1.1.1')).toBe(false)
  })
})

describe('isBlockedIpv6', () => {
  it('blocks unspecified and loopback', () => {
    expect(isBlockedIpv6('::')).toBe(true)
    expect(isBlockedIpv6('::1')).toBe(true)
  })

  it('blocks unique local addresses (fc00::/7)', () => {
    expect(isBlockedIpv6('fc00::1')).toBe(true)
    expect(isBlockedIpv6('fd00::1')).toBe(true)
  })

  it('blocks link-local addresses (fe80::/10)', () => {
    expect(isBlockedIpv6('fe80::1')).toBe(true)
    expect(isBlockedIpv6('fe80::')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isBlockedIpv6('FC00::1')).toBe(true)
    expect(isBlockedIpv6('FE80::1')).toBe(true)
  })

  it('blocks IPv4-mapped IPv6 addresses that embed a private IPv4', () => {
    expect(isBlockedIpv6('::ffff:10.0.0.1')).toBe(true)
    expect(isBlockedIpv6('::ffff:127.0.0.1')).toBe(true)
    expect(isBlockedIpv6('::ffff:169.254.169.254')).toBe(true)
  })

  it('does not block IPv4-mapped IPv6 addresses that embed a public IPv4', () => {
    expect(isBlockedIpv6('::ffff:8.8.8.8')).toBe(false)
  })

  it('does not block a normal public IPv6 address', () => {
    expect(isBlockedIpv6('2001:4860:4860::8888')).toBe(false)
  })
})

describe('isValidWebhookUrl', () => {
  it('accepts a normal public https URL', () => {
    expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true)
  })

  it('rejects non-https protocols', () => {
    expect(isValidWebhookUrl('http://example.com/webhook')).toBe(false)
    expect(isValidWebhookUrl('ftp://example.com/webhook')).toBe(false)
  })

  it('rejects malformed URLs', () => {
    expect(isValidWebhookUrl('not a url')).toBe(false)
  })

  it('rejects known internal hostnames', () => {
    expect(isValidWebhookUrl('https://localhost/webhook')).toBe(false)
    expect(isValidWebhookUrl('https://metadata.google.internal/webhook')).toBe(false)
  })

  it('rejects private IPv4 ranges', () => {
    expect(isValidWebhookUrl('https://10.0.0.1/webhook')).toBe(false)
    expect(isValidWebhookUrl('https://127.0.0.1/webhook')).toBe(false)
    expect(isValidWebhookUrl('https://172.16.0.1/webhook')).toBe(false)
    expect(isValidWebhookUrl('https://192.168.1.1/webhook')).toBe(false)
    expect(isValidWebhookUrl('https://169.254.169.254/webhook')).toBe(false)
  })

  it('accepts 172.32.x (outside the 172.16-31/12 private block)', () => {
    expect(isValidWebhookUrl('https://172.32.0.1/webhook')).toBe(true)
  })

  // KNOWN GAP: unlike isBlockedHost/isBlockedIpv4, isValidWebhookUrl's
  // PRIVATE_IP_PATTERNS list has no 100.64.0.0/10 (CGNAT) entry, so a CGNAT
  // literal is currently accepted as a "valid" webhook URL. Documenting
  // actual behavior per instructions rather than asserting the safer
  // behavior. See report for details — worth a production fix.
  it('KNOWN BUG: does not reject CGNAT 100.64.0.0/10 (unlike isBlockedHost)', () => {
    expect(isValidWebhookUrl('https://100.64.0.1/webhook')).toBe(true)
  })
  it.todo('should reject CGNAT range 100.64.0.0/10 once PRIVATE_IP_PATTERNS is fixed')

  // KNOWN BUG: new URL().hostname returns IPv6 hosts WITH brackets
  // (e.g. "[::1]", "[fc00::1]"), but PRIVATE_IP_PATTERNS' IPv6 regexes
  // (/^::1$/, /^fc[0-9a-f]{2}:/i, /^fe[89ab][0-9a-f]:/i) are anchored to
  // the unbracketed form and therefore never match. isBlockedHost handles
  // this correctly (checks '::1' AND '[::1]'); isValidWebhookUrl does not.
  // This is a real SSRF bypass: IPv6 loopback/ULA/link-local webhook URLs
  // pass validation.
  it('KNOWN BUG: does not reject bracketed IPv6 loopback/ULA/link-local', () => {
    expect(isValidWebhookUrl('https://[::1]/webhook')).toBe(true)
    expect(isValidWebhookUrl('https://[fc00::1]/webhook')).toBe(true)
    expect(isValidWebhookUrl('https://[fe80::1]/webhook')).toBe(true)
  })
  it.todo('should reject bracketed IPv6 loopback/ULA/link-local hosts (SSRF bypass)')
})
