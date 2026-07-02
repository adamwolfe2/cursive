import { describe, it, expect } from 'vitest'
import { isSafeDestinationUrl } from '../delivery.service'
import { generateSigningSecret } from '../api-key.service'

describe('isSafeDestinationUrl', () => {
  it('accepts a normal public HTTPS URL', () => {
    expect(isSafeDestinationUrl('https://hooks.partner.com/cursive')).toBe(true)
    expect(isSafeDestinationUrl('https://webhook.site/abc-123')).toBe(true)
  })

  it('rejects non-https schemes', () => {
    expect(isSafeDestinationUrl('http://hooks.partner.com/x')).toBe(false)
    expect(isSafeDestinationUrl('ftp://hooks.partner.com/x')).toBe(false)
    expect(isSafeDestinationUrl('not a url')).toBe(false)
  })

  it('rejects localhost and .localhost', () => {
    expect(isSafeDestinationUrl('https://localhost/x')).toBe(false)
    expect(isSafeDestinationUrl('https://evil.localhost/x')).toBe(false)
  })

  it('rejects loopback/private/link-local/metadata IPv4 literals', () => {
    expect(isSafeDestinationUrl('https://127.0.0.1/x')).toBe(false)
    expect(isSafeDestinationUrl('https://10.1.2.3/x')).toBe(false)
    expect(isSafeDestinationUrl('https://192.168.1.1/x')).toBe(false)
    expect(isSafeDestinationUrl('https://172.16.0.1/x')).toBe(false)
    expect(isSafeDestinationUrl('https://169.254.169.254/x')).toBe(false)
    expect(isSafeDestinationUrl('https://100.64.0.1/x')).toBe(false)
    expect(isSafeDestinationUrl('https://0.0.0.0/x')).toBe(false)
  })

  it('rejects decimal/octal IPv4 encodings (canonicalized by WHATWG URL)', () => {
    // new URL('https://2130706433') canonicalizes to 127.0.0.1
    expect(isSafeDestinationUrl('https://2130706433/x')).toBe(false)
    expect(isSafeDestinationUrl('https://0177.0.0.1/x')).toBe(false)
  })

  it('rejects ALL IPv6 literals, including IPv4-mapped loopback', () => {
    expect(isSafeDestinationUrl('https://[::1]/x')).toBe(false)
    expect(isSafeDestinationUrl('https://[::ffff:127.0.0.1]/x')).toBe(false)
    expect(isSafeDestinationUrl('https://[fd00::1]/x')).toBe(false)
    expect(isSafeDestinationUrl('https://[fe80::1]/x')).toBe(false)
    expect(isSafeDestinationUrl('https://[2606:4700::1]/x')).toBe(false) // v1: no IPv6 destinations
  })

  it('rejects dotless hostnames', () => {
    expect(isSafeDestinationUrl('https://intranet/x')).toBe(false)
  })
})

describe('generateSigningSecret', () => {
  it('uses the whsec_ prefix and is high-entropy', () => {
    const s1 = generateSigningSecret()
    const s2 = generateSigningSecret()
    expect(s1.startsWith('whsec_')).toBe(true)
    expect(s1.length).toBeGreaterThanOrEqual(6 + 43) // prefix + 32 bytes base64url
    expect(s1).not.toBe(s2)
    expect(s1.startsWith('rk_live_')).toBe(false)
  })
})
