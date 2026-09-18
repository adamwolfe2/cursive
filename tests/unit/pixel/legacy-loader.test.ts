import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isAllowedInstallUrl } from '@/lib/pixel/install-url'

const LOADER = readFileSync(join(process.cwd(), 'public/pixel.js'), 'utf8')
const PIXEL = '1503a8ec-2ced-4c62-a5e5-b9a587bd4718'

// Reproduces the exact snippet the dashboard handed customers Feb-Sep 2026.
function installLegacySnippet(id: string) {
  const w = window as any
  w.cursive = function (...args: unknown[]) { (w.cursive.q = w.cursive.q || []).push(args) }
  w.cursive('init', id)
}

function runLoader(src = 'https://cdn.meetcursive.com/pixel.js') {
  Object.defineProperty(document, 'currentScript', { configurable: true, value: { src } })
  new Function(LOADER)()
}

function injected(): string[] {
  return Array.from(document.querySelectorAll('script')).map(s => s.getAttribute('src') || '')
}

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  delete (window as any).cursive
})

describe('legacy cdn.meetcursive.com/pixel.js loader', () => {
  it('loads the resolver for the queued init call, on the host it was served from', () => {
    installLegacySnippet(PIXEL)
    runLoader()
    expect(injected()).toEqual([`https://cdn.meetcursive.com/api/pixel/script/${PIXEL}`])
  })

  it('handles init calls made after the loader ran, once per pixel', () => {
    installLegacySnippet(PIXEL)
    runLoader()
    ;(window as any).cursive('init', PIXEL)
    const other = '6f0057a5-0000-4000-8000-000000000000'
    ;(window as any).cursive('init', other)
    expect(injected()).toHaveLength(2)
    expect(injected().some(src => src.endsWith(other))).toBe(true)
  })

  it('ignores ids that are not uuids', () => {
    installLegacySnippet('"><script>alert(1)</script>')
    runLoader()
    expect(injected()).toEqual([])
  })
})

describe('isAllowedInstallUrl', () => {
  it('allows only https AudienceLab script CDN urls', () => {
    expect(isAllowedInstallUrl('https://cdn.idpixel.app/v1/idp-analytics-6a90a9444525f8fe67d774c0.min.js')).toBe(true)
    expect(isAllowedInstallUrl('http://cdn.idpixel.app/v1/x.js')).toBe(false)
    expect(isAllowedInstallUrl('https://evil.example/cdn.idpixel.app.js')).toBe(false)
    expect(isAllowedInstallUrl('https://cdn.idpixel.app.evil.example/x.js')).toBe(false)
    expect(isAllowedInstallUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedInstallUrl(null)).toBe(false)
  })
})
