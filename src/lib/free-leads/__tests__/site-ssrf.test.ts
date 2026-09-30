import type { LookupAddress } from 'node:dns'
import { describe, expect, it, vi } from 'vitest'

const scrapeMarkdown = vi.hoisted(() => vi.fn())
vi.mock('@/lib/services/firecrawl.service', () => ({ firecrawlService: { scrapeMarkdown } }))

import { BlockedHostError, fetchSite, guardedLookup, httpsFavicon, isBlockedAddress } from '../site'

function resolver(addresses: LookupAddress[]) {
  return (_host: string, cb: (err: NodeJS.ErrnoException | null, a: LookupAddress[]) => void) => cb(null, addresses)
}

function lookupOnce(fn: ReturnType<typeof guardedLookup>, options: { all?: boolean; family?: number } = {}) {
  return new Promise<{ err: Error | null; address: unknown; family?: number }>((resolve) =>
    fn('rebind.example', options as never, ((err: Error | null, address: unknown, family?: number) =>
      resolve({ err, address, family })) as never)
  )
}

describe('connect-time SSRF guard', () => {
  it('blocks private, loopback, metadata, CGNAT, mapped and NAT64 addresses', () => {
    for (const a of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0',
      '::1', '::', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:169.254.169.254', '64:ff9b::a9fe:a9fe', 'not-an-ip']) {
      expect(isBlockedAddress(a), a).toBe(true)
    }
    for (const a of ['93.184.216.34', '2606:4700::6810:84e5', '::ffff:93.184.216.34']) {
      expect(isBlockedAddress(a), a).toBe(false)
    }
  })

  it('refuses the connection when DNS rebinds to a private address', async () => {
    const res = await lookupOnce(guardedLookup(resolver([{ address: '169.254.169.254', family: 4 }])))
    expect(res.err).toBeInstanceOf(BlockedHostError)
  })

  it('refuses when ANY answer is private (mixed A records)', async () => {
    const res = await lookupOnce(
      guardedLookup(resolver([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.5', family: 4 }])),
      { all: true }
    )
    expect(res.err).toBeInstanceOf(BlockedHostError)
  })

  it('connects to the address it validated', async () => {
    const one = await lookupOnce(guardedLookup(resolver([{ address: '93.184.216.34', family: 4 }])))
    expect(one).toEqual({ err: null, address: '93.184.216.34', family: 4 })
    const all = await lookupOnce(guardedLookup(resolver([{ address: '93.184.216.34', family: 4 }])), { all: true })
    expect(all.address).toEqual([{ address: '93.184.216.34', family: 4 }])
  })

  it('does not fall back to the crawler for a blocked host', async () => {
    scrapeMarkdown.mockClear()
    await expect(fetchSite('https://169.254.169.254/')).rejects.toBeInstanceOf(BlockedHostError)
    expect(scrapeMarkdown).not.toHaveBeenCalled()
  })

  it('only returns https favicons', () => {
    expect(httpsFavicon('/favicon.ico', 'https://acme.com/')).toBe('https://acme.com/favicon.ico')
    expect(httpsFavicon('http://cdn.acme.com/i.png', 'https://acme.com/')).toBeNull()
    expect(httpsFavicon('javascript:alert(1)', 'https://acme.com/')).toBeNull()
    expect(httpsFavicon('data:image/png;base64,AAAA', 'https://acme.com/')).toBeNull()
  })
})
