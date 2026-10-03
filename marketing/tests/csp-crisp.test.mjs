import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadTs } from './load-ts.mjs'

const { NextRequest } = await import('next/server.js')

function directives(csp) {
  return Object.fromEntries(
    csp.split(';').map((d) => d.trim().split(/\s+/)).map(([name, ...srcs]) => [name, srcs]),
  )
}

test('middleware CSP allows the Crisp chat widget', async () => {
  const { middleware } = loadTs('middleware.ts')
  const res = await middleware(new NextRequest('https://www.meetcursive.com/'))
  const csp = directives(res.headers.get('content-security-policy'))
  assert.ok(csp['script-src'].includes('https://client.crisp.chat'))
  assert.ok(csp['style-src'].includes('https://client.crisp.chat'))
  assert.ok(csp['font-src'].includes('https://client.crisp.chat'))
  assert.ok(csp['connect-src'].includes('https://client.crisp.chat'))
  assert.ok(csp['connect-src'].includes('wss://client.relay.crisp.chat'))
  assert.ok(csp['frame-src'].includes('https://game.crisp.chat'))
  // Existing allowances stay intact
  assert.ok(csp['script-src'].includes('https://app.cal.com'))
  assert.deepEqual(csp['object-src'], ["'none'"])
})

test('next.config CSP allows the Crisp chat widget', async () => {
  const cfg = loadTs('next.config.ts').default
  const rules = await cfg.headers()
  const csp = rules
    .flatMap((r) => r.headers)
    .find((h) => h.key === 'Content-Security-Policy').value
  const d = directives(csp)
  assert.ok(d['script-src'].includes('https://client.crisp.chat'))
  assert.ok(d['connect-src'].includes('wss://client.relay.crisp.chat'))
})
