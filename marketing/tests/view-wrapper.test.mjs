import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadTs } from './load-ts.mjs'

function load(view) {
  return loadTs('components/view-wrapper.tsx', {
    '@/lib/view-context': { useView: () => ({ view, setView: () => {} }) },
  })
}

const HREF = 'https://leads.meetcursive.com/start'

test('human view (sr-only block): link text is only the label', () => {
  const { MachineLink, MachineSection } = load('human')
  const html = renderToStaticMarkup(
    h(MachineSection, { title: 'Pricing' }, h(MachineLink, { href: HREF }, 'Get 25 free leads')),
  )
  assert.match(html, />Get 25 free leads<\/a>/)
  assert.doesNotMatch(html, /\[Get 25 free leads\]/)
  assert.match(html, /<h2[^>]*>Pricing<\/h2>/)
  assert.doesNotMatch(html, /##/)
})

test('machine view keeps markdown-style link and heading', () => {
  const { MachineLink, MachineSection } = load('machine')
  const html = renderToStaticMarkup(
    h(MachineSection, { title: 'Pricing' }, h(MachineLink, { href: HREF }, 'Get 25 free leads')),
  )
  assert.ok(html.includes(`[Get 25 free leads](${HREF})`))
  assert.match(html, /<h2[^>]*>## Pricing<\/h2>/)
})
