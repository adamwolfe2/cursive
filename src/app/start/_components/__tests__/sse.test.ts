import { describe, expect, it } from 'vitest'
import type { ScanEvent } from '@/lib/free-leads/contract'
import { sseParser } from '../api'

function run(chunks: string[]): ScanEvent[] {
  const out: ScanEvent[] = []
  const p = sseParser((e) => out.push(e))
  chunks.forEach((c) => p.push(c))
  p.end()
  return out
}

const stream =
  ': keep-alive\n\n' +
  'event: finding\ndata: {"type":"finding","finding":{"label":"Who buys","text":"CTOs"}}\n\n' +
  'data: {"type":"count","total":42}\n\n' +
  'data: {"type":"done"}'

describe('sseParser', () => {
  it('ignores comments and event lines, flushes an unterminated tail', () => {
    expect(run([stream]).map((e) => e.type)).toEqual(['finding', 'count', 'done'])
  })

  it('gives the same result however the stream is chunked', () => {
    const whole = run([stream])
    for (let size = 1; size < 12; size++) {
      const chunks = stream.match(new RegExp(`[\\s\\S]{1,${size}}`, 'g')) ?? []
      expect(run(chunks)).toEqual(whole)
    }
  })

  it('handles CRLF split across chunks', () => {
    const crlf = 'data: {"type":"count","total":1}\r\n\r\ndata: {"type":"done"}\r\n\r\n'
    const chunks = crlf.split(/(?<=\r)/)
    expect(run(chunks).map((e) => e.type)).toEqual(['count', 'done'])
  })

  it('skips malformed data without throwing', () => {
    expect(run(['data: {oops\n\ndata: {"type":"done"}\n\n']).map((e) => e.type)).toEqual(['done'])
  })
})
