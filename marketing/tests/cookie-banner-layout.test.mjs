import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// At 390x844 the old banner (p-5 + heading row, ~254px tall) sat on top of the hero trust chips
// (577-627px). The phone layout drops the heading row and tightens spacing (~162px, top at 674px);
// from sm up the original desktop layout is unchanged.
const src = readFileSync('components/cookie-consent.tsx', 'utf8')
const classes = [...src.matchAll(/className="([^"]*)"/g)].map((m) => m[1].split(/\s+/))
const find = (...needles) => classes.find((c) => needles.every((n) => c.includes(n)))

test('phone banner is compact; sm and up keep the original layout', () => {
  const wrapper = find('fixed', 'z-50')
  assert.ok(wrapper, 'fixed wrapper exists')
  for (const c of ['bottom-2', 'left-2', 'w-[calc(100%-1rem)]', 'sm:bottom-4', 'sm:left-4', 'sm:w-auto']) {
    assert.ok(wrapper.includes(c), `wrapper missing ${c}`)
  }
  const card = find('shadow-2xl')
  assert.ok(card.includes('p-4') && card.includes('sm:p-5'))
  const heading = find('items-center', 'gap-2.5', 'mb-3')
  assert.ok(heading.includes('hidden') && heading.includes('sm:flex'), 'heading row hidden on phones only')
  const copy = find('text-gray-600', 'leading-relaxed')
  assert.ok(copy.includes('text-xs') && copy.includes('sm:text-sm'))
  assert.ok(copy.includes('pr-6') && copy.includes('sm:pr-0'), 'copy clears the close button on phones')
})

test('consent copy and both choices stay visible on phones', () => {
  assert.match(src, /Declining\s+disables non-essential tracking/)
  assert.match(src, />\s*Accept\s*</)
  assert.match(src, />\s*Decline\s*</)
  assert.match(src, /aria-label="Close cookie banner"/)
})
