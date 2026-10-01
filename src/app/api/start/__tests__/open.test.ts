import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../open/route'

const post = (fields: Record<string, string>) =>
  new NextRequest('http://localhost/api/start/open', { method: 'POST', body: new URLSearchParams(fields) })

describe('POST /api/start/open', () => {
  it('turns a real click into the sign-in redirect with the leads page as next', async () => {
    const res = await POST(post({ t: 'a1b2c3d4e5f6a7b8', c: 'Zx_9-abcDEF12345' }))
    expect(res.status).toBe(303)
    const to = new URL(res.headers.get('location') as string)
    expect(to.pathname).toBe('/auth/confirm')
    expect(to.searchParams.get('token_hash')).toBe('a1b2c3d4e5f6a7b8')
    expect(to.searchParams.get('next')).toBe('/start/leads?c=Zx_9-abcDEF12345')
  })

  it('sends malformed or missing tokens back to /start (no open redirect, no injection)', async () => {
    for (const fields of [{ t: '', c: 'x' }, { t: 'abc def<script>', c: 'Zx_9-abcDEF12345' }, { t: 'a1b2c3d4e5f6a7b8', c: '../../evil' }]) {
      const res = await POST(post(fields))
      expect(new URL(res.headers.get('location') as string).pathname).toBe('/start')
    }
  })
})
