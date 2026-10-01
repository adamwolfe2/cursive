import { describe, expect, it } from 'vitest'
import { normalizeUrl } from '../StartFlow'
import { normalizeSiteUrl } from '@/lib/free-leads/site'

describe('normalizeUrl (client)', () => {
  it('accepts queries, hashes, ports and IDN hosts, keeping only host and path', () => {
    expect(normalizeUrl('acme.com?x=1')).toBe('acme.com')
    expect(normalizeUrl('https://www.acme.com/about/#top')).toBe('www.acme.com/about')
    expect(normalizeUrl('acme.com:8080')).toBe('acme.com')
    expect(normalizeUrl('münchen.de')).toBe('xn--mnchen-3ya.de')
    expect(normalizeUrl('例え.テスト')).toMatch(/^xn--.+\.xn--.+$/)
  })

  it('rejects things that cannot be a site', () => {
    for (const bad of ['acme', 'acme com', 'http://', 'localhost:3000', '1.2.3.4', '']) expect(normalizeUrl(bad)).toBeNull()
  })
})

describe('normalizeSiteUrl (server)', () => {
  it('drops ports and credentials', () => {
    expect(normalizeSiteUrl('acme.com:8080/x')).toBe('https://acme.com/x')
    expect(normalizeSiteUrl('https://u:p@acme.com')).toBe('https://acme.com/')
  })
})
