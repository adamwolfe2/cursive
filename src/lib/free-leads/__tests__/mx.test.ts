import { describe, expect, it, vi } from 'vitest'
import { hasMailExchanger } from '../mx'

const err = (code: string) => Object.assign(new Error(code), { code })

describe('hasMailExchanger', () => {
  it('accepts a domain with MX records', async () => {
    const resolve = vi.fn().mockResolvedValue([{ exchange: 'mx.acme-mx-ok.com', priority: 10 }])
    expect(await hasMailExchanger('acme-mx-ok.com', resolve)).toBe(true)
  })

  it('rejects no MX, NXDOMAIN and null MX, and caches the definitive answer', async () => {
    const nodata = vi.fn().mockRejectedValue(err('ENODATA'))
    expect(await hasMailExchanger('no-mx.example', nodata)).toBe(false)
    expect(await hasMailExchanger('no-mx.example', nodata)).toBe(false)
    expect(nodata).toHaveBeenCalledTimes(1)
    expect(await hasMailExchanger('nx.example', vi.fn().mockRejectedValue(err('ENOTFOUND')))).toBe(false)
    expect(await hasMailExchanger('null-mx.example', vi.fn().mockResolvedValue([{ exchange: '.', priority: 0 }]))).toBe(false)
  })

  it('fails closed on transient errors without caching them', async () => {
    const flaky = vi.fn().mockRejectedValueOnce(err('ESERVFAIL')).mockResolvedValue([{ exchange: 'mx.flaky.example', priority: 1 }])
    expect(await hasMailExchanger('flaky.example', flaky)).toBe(false)
    expect(await hasMailExchanger('flaky.example', flaky)).toBe(true)
  })

  it('times out a hung resolver', async () => {
    vi.useFakeTimers()
    const pending = hasMailExchanger('hang.example', () => new Promise(() => {}))
    await vi.advanceTimersByTimeAsync(3_001)
    expect(await pending).toBe(false)
    vi.useRealTimers()
  })
})
