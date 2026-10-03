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

// Crisp's documented CSP needs (docs.crisp.chat whitelisting guide), pinned to explicit hosts rather
// than *.crisp.chat so the policy grows no broader than the widget requires.
const CRISP_NEEDS = {
  'script-src': ['https://client.crisp.chat', 'https://settings.crisp.chat'],
  'style-src': ['https://client.crisp.chat'],
  'font-src': ['https://client.crisp.chat'],
  'connect-src': [
    'https://client.crisp.chat',
    'https://settings.crisp.chat',
    'https://storage.crisp.chat',
    'wss://client.relay.crisp.chat',
    'wss://stream.relay.crisp.chat',
    'wss://client.relay.rescue.crisp.chat',
    'wss://stream.relay.rescue.crisp.chat',
  ],
  'frame-src': ['https://game.crisp.chat'],
  'media-src': ['https://client.crisp.chat'],
  'worker-src': ['blob:', 'https://client.crisp.chat'],
}

async function bothPolicies() {
  const { middleware } = loadTs('middleware.ts')
  const res = await middleware(new NextRequest('https://www.meetcursive.com/'))
  const cfg = loadTs('next.config.ts').default
  const rules = await cfg.headers()
  const fromConfig = rules.flatMap((r) => r.headers).find((h) => h.key === 'Content-Security-Policy').value
  return { middleware: directives(res.headers.get('content-security-policy')), config: directives(fromConfig) }
}

test('both CSPs carry every host Crisp needs, including workers and rescue relays', async () => {
  for (const [where, d] of Object.entries(await bothPolicies())) {
    for (const [directive, hosts] of Object.entries(CRISP_NEEDS)) {
      for (const host of hosts) {
        assert.ok(d[directive]?.includes(host), `${where} ${directive} is missing ${host}`)
      }
    }
    // img-src already allows any https: image, which covers image.crisp.chat avatars
    assert.ok(d['img-src'].includes('https:'), `${where} img-src must allow https: images`)
  }
})

test('Crisp allowances stay explicit: no crisp wildcards anywhere', async () => {
  for (const [where, d] of Object.entries(await bothPolicies())) {
    const all = Object.values(d).flat()
    assert.ok(!all.some((s) => s.includes('*.crisp')), `${where} has a crisp wildcard`)
    assert.deepEqual(d['object-src'], ["'none'"])
  }
})
