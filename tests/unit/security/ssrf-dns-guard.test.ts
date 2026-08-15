import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DNS so we can simulate a public hostname that resolves to an internal IP
// (the "169.254.169.254.nip.io" / attacker-controlled-A-record bypass the old
// string-only guard could not catch).
const lookupMock = vi.fn()
vi.mock('node:dns/promises', () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
  default: { lookup: (...args: unknown[]) => lookupMock(...args) },
}))

import { assertPublicUrl, resolvesToBlockedHost, isBlockedHost } from '@/lib/utils/ssrf-guard'

describe('SSRF guard — DNS resolution', () => {
  beforeEach(() => lookupMock.mockReset())

  it('blocks IPv4 literals in private/link-local ranges without DNS', async () => {
    for (const ip of ['127.0.0.1', '10.0.0.5', '169.254.169.254', '192.168.1.1', '172.16.0.1', '100.64.0.1']) {
      expect(await resolvesToBlockedHost(ip)).toBe(true)
    }
  })

  it('allows a public IPv4 literal', async () => {
    expect(await resolvesToBlockedHost('93.184.216.34')).toBe(false)
  })

  it('blocks IPv6 loopback / ULA / link-local and IPv4-mapped metadata', async () => {
    expect(await resolvesToBlockedHost('::1')).toBe(true)
    expect(await resolvesToBlockedHost('fd00::1')).toBe(true)
    expect(await resolvesToBlockedHost('fe80::1')).toBe(true)
    expect(await resolvesToBlockedHost('::ffff:169.254.169.254')).toBe(true)
  })

  it('CLOSES the DNS-rebind bypass: public host resolving to metadata IP is blocked', async () => {
    lookupMock.mockResolvedValue([{ address: '169.254.169.254', family: 4 }])
    const result = await assertPublicUrl('https://169-254-169-254.evil.example')
    expect(result.ok).toBe(false)
  })

  it('allows a genuinely public host', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    const result = await assertPublicUrl('https://example.com')
    expect(result.ok).toBe(true)
  })

  it('rejects non-https and invalid protocols before any DNS lookup', async () => {
    expect((await assertPublicUrl('http://example.com')).ok).toBe(false)
    expect((await assertPublicUrl('ftp://example.com')).ok).toBe(false)
    expect((await assertPublicUrl('not-a-url')).ok).toBe(false)
    // allowHttp lets plain http through the protocol gate (still DNS-checked)
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    expect((await assertPublicUrl('http://example.com', { allowHttp: true })).ok).toBe(true)
  })

  it('string guard still blocks obvious literals and bad protocols', () => {
    expect(isBlockedHost('http://localhost')).toBe(true)
    expect(isBlockedHost('https://169.254.169.254')).toBe(true)
    expect(isBlockedHost('file:///etc/passwd')).toBe(true)
    expect(isBlockedHost('https://example.com')).toBe(false)
  })
})
