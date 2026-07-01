import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, extractBearerKey } from '../api-key.service'
import { isSafeDestinationUrl } from '../delivery.service'

describe('generateApiKey', () => {
  it('produces a prefixed key whose hash matches hashApiKey', async () => {
    const { rawKey, keyHash, keyPrefix } = await generateApiKey()
    expect(rawKey.startsWith('rk_live_')).toBe(true)
    expect(keyPrefix).toBe(rawKey.slice(0, 12))
    expect(keyHash).toHaveLength(64) // sha256 hex
    expect(await hashApiKey(rawKey)).toBe(keyHash)
  })

  it('generates unique keys', async () => {
    const a = await generateApiKey()
    const b = await generateApiKey()
    expect(a.rawKey).not.toBe(b.rawKey)
    expect(a.keyHash).not.toBe(b.keyHash)
  })
})

describe('extractBearerKey', () => {
  it('parses a Bearer header', () => {
    expect(extractBearerKey('Bearer rk_live_abc123')).toBe('rk_live_abc123')
  })
  it('parses a bare key', () => {
    expect(extractBearerKey('rk_live_abc123')).toBe('rk_live_abc123')
  })
  it('rejects non-reseller tokens', () => {
    expect(extractBearerKey('Bearer sk_test_abc')).toBeNull()
    expect(extractBearerKey(null)).toBeNull()
    expect(extractBearerKey('')).toBeNull()
  })
})

describe('isSafeDestinationUrl (SSRF guard)', () => {
  it('allows public https URLs', () => {
    expect(isSafeDestinationUrl('https://api.partner.com/hooks/cursive')).toBe(true)
  })
  it('rejects http', () => {
    expect(isSafeDestinationUrl('http://api.partner.com/hook')).toBe(false)
  })
  it('rejects localhost and private/metadata addresses', () => {
    expect(isSafeDestinationUrl('https://localhost/hook')).toBe(false)
    expect(isSafeDestinationUrl('https://127.0.0.1/hook')).toBe(false)
    expect(isSafeDestinationUrl('https://10.0.0.5/hook')).toBe(false)
    expect(isSafeDestinationUrl('https://192.168.1.10/hook')).toBe(false)
    expect(isSafeDestinationUrl('https://169.254.169.254/latest/meta-data')).toBe(false)
    expect(isSafeDestinationUrl('https://172.16.0.1/hook')).toBe(false)
  })
  it('rejects garbage', () => {
    expect(isSafeDestinationUrl('not-a-url')).toBe(false)
  })
})
