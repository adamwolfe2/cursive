import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// WCAG 2.x relative luminance / contrast ratio
function luminance(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('#0066DD passes AA body text on white; #007AFF only passes for large text', () => {
  assert.ok(contrast('0066DD', 'ffffff') >= 4.5)
  assert.ok(contrast('007AFF', 'ffffff') < 4.5)
  assert.ok(contrast('007AFF', 'ffffff') >= 3)
})

// Normal-size text (< 24px) in #007AFF fails AA on the homepage's white surfaces. Icons (no text size)
// and hover/focus/decoration variants are not text, so they are not checked.
test('homepage has no #007AFF text below the 24px large-text threshold', () => {
  const dir = 'components/homepage'
  const offenders = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    const src = readFileSync(join(dir, file), 'utf8')
    for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const cls = (m[1] ?? m[2]).split(/\s+/)
      if (!cls.includes('text-[#007AFF]')) continue
      const sizes = cls.map((c) => /^(?:sm:|md:|lg:|xl:)?text-\[(\d+(?:\.\d+)?)px\]$/.exec(c)?.[1]).filter(Boolean).map(Number)
      if (sizes.length && Math.min(...sizes) < 24) offenders.push(`${file}: ${m[0].slice(0, 90)}`)
    }
  }
  assert.deepEqual(offenders, [])
})

// White text on a #007AFF fill is the same 4.02:1 pair (numeral badges were missed by the check above).
test('homepage has no white-on-#007AFF numeral badges below 24px', () => {
  assert.ok(contrast('ffffff', '0066DD') >= 4.5)
  const dir = 'components/homepage'
  const offenders = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    const src = readFileSync(join(dir, file), 'utf8')
    for (const m of src.matchAll(/<span className=(?:"([^"]*)"|\{`([^`]*)`\})>\s*\{[^}]*\}\s*<\/span>/g)) {
      const cls = (m[1] ?? m[2]).split(/\s+/)
      if (!cls.includes('bg-[#007AFF]') || !cls.includes('text-white')) continue
      const sizes = cls.map((c) => /^(?:sm:|md:|lg:|xl:)?text-\[(\d+(?:\.\d+)?)px\]$/.exec(c)?.[1]).filter(Boolean).map(Number)
      if (!sizes.length || Math.min(...sizes) < 24) offenders.push(`${file}: ${m[0].slice(0, 90)}`)
    }
  }
  assert.deepEqual(offenders, [])
})
