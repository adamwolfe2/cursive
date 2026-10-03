import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { loadTs } from './load-ts.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')

async function redirectFor(source) {
  const cfg = loadTs('next.config.ts').default
  return (await cfg.redirects()).find((r) => r.source === source)
}

test('/affiliates and /partners redirect to /contact (their apply API is gone)', async () => {
  for (const p of ['/affiliates', '/affiliates/:slug*', '/partners']) {
    const r = await redirectFor(p)
    assert.ok(r, `missing redirect for ${p}`)
    assert.equal(r.destination, '/contact')
    assert.equal(r.permanent, false)
  }
})

test('/partners/terms (signed partner agreement) is not redirected', async () => {
  const { pathToRegexp } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp')
  const redirects = await loadTs('next.config.ts').default.redirects()
  const hits = redirects.filter((r) => !r.has && pathToRegexp(r.source).test('/partners/terms'))
  assert.deepEqual(hits.map((r) => r.source), [])
})

test('/visitor-estimate redirects to the app signup with utm_content', async () => {
  const r = await redirectFor('/visitor-estimate')
  assert.ok(r)
  const url = new URL(r.destination)
  assert.equal(url.origin + url.pathname, 'https://leads.meetcursive.com/start')
  assert.equal(url.searchParams.get('utm_content'), 'visitor-estimate')
})

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === '.next') return []
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : /\.(tsx?|mjs)$/.test(name) ? [full] : []
  })
}

test('no live page calls removed old-app endpoints or blocked cdn paths', () => {
  const banned = [
    'leads.meetcursive.com/api/pixel/provision-demo',
    'cdn.meetcursive.com/track.js',
    'cdn.meetcursive.com/t/',
  ]
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))]
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    for (const b of banned) assert.ok(!src.includes(b), `${path.relative(ROOT, f)} references ${b}`)
  }
})
