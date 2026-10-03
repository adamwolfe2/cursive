import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The hero trust chips sit at a fixed 577-627px from the top (no viewport-height layout). Phone
// visible height varies with Safari's toolbars (~660px on first load up to 844px), and a
// bottom-anchored banner whose top must clear 627px at a 664px viewport would have to be under ~29px
// tall. So no banner height is safe for every viewport: on phones the banner waits until #hero has
// scrolled out of view. These tests assert that gate, not a single viewport height.
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

test('on phones the banner waits until #hero has scrolled out of view', () => {
  const fn = src.slice(src.indexOf('export function scheduleBanner'), src.indexOf('export function CookieConsent'))
  assert.ok(fn.length > 0, 'scheduleBanner exists')
  assert.match(src, /PHONE_QUERY = "\(max-width: 639px\)"/, 'phone query matches Tailwind sm breakpoint')
  assert.match(fn, /document\.getElementById\("hero"\)/)
  assert.match(fn, /window\.matchMedia\(PHONE_QUERY\)\.matches/)
  assert.match(fn, /new IntersectionObserver/)
  assert.match(fn, /!entry\.isIntersecting[\s\S]*show\(\)/, 'shows only once the hero is out of view')
  assert.match(fn, /observer\.disconnect\(\)/, 'observer is cleaned up')
  // Pages without a hero, larger screens, and old browsers keep the short delay.
  assert.match(fn, /if \(!hero \|\| !isPhone \|\| typeof IntersectionObserver === "undefined"\)[\s\S]*setTimeout\(show, 1500\)/)
  assert.match(src, /return scheduleBanner\(\(\) => setVisible\(true\)\)/, 'component uses the gate')
})
