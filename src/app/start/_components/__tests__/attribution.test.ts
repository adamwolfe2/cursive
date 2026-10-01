import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamScan } from '../api'

const bodies: Array<Record<string, unknown>> = []
const sse = (lines: string[]) =>
  new Response(lines.map((l) => `data: ${l}\n\n`).join(''), { status: 200 })

afterEach(() => {
  vi.unstubAllGlobals()
  bodies.length = 0
  localStorage.clear()
})

describe('scan attribution', () => {
  it('keeps sending first-touch attribution until a scan is accepted, then stops', async () => {
    const replies = [
      () => new Response('{}', { status: 429 }),
      () => sse(['{"type":"error","code":"invalid_url","message":"x"}']),
      () => sse(['{"type":"page","path":"/","state":"fetching"}', '{"type":"done"}']),
      () => sse(['{"type":"done"}']),
    ]
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)))
      return replies[bodies.length - 1]()
    })
    const signal = new AbortController().signal
    for (let i = 0; i < 4; i++) await streamScan({ url: 'acme.com' }, () => {}, signal, null)
    expect(bodies.map((b) => 'attribution' in b)).toEqual([true, true, true, false])
  })
})
