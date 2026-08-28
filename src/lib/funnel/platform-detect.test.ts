import { describe, it, expect } from 'vitest'
import {
  detectPlatform,
  detectPlatformFromHeaders,
  detectPlatformFromHtml,
  getPlatformGuide,
  PLATFORM_GUIDES,
} from './platform-detect'

describe('detectPlatformFromHtml', () => {
  it('identifies each platform from a representative signature', () => {
    const cases: Array<[string, string]> = [
      ['<script src="https://cdn.shopify.com/s/files/x.js">', 'shopify'],
      ['<link href="/wp-content/themes/x/style.css">', 'wordpress'],
      ['<html data-wf-site="abc123">', 'webflow'],
      ['<img src="https://static1.squarespace.com/x.png">', 'squarespace'],
      ['<script src="https://static.parastorage.com/x.js">', 'wix'],
      ['<script src="https://cdn11.bigcommerce.com/x.js">', 'bigcommerce'],
      ['<script>window.Drupal.settings = {}</script>', 'drupal'],
      ['<script src="https://js.hs-scripts.com/123.js">', 'hubspot'],
      ['<img src="https://framerusercontent.com/x.png">', 'framer'],
      ['<script src="https://www.googletagmanager.com/gtm.js?id=X">', 'gtm'],
    ]
    for (const [html, expected] of cases) {
      expect(detectPlatformFromHtml(html), `for ${expected}`).toBe(expected)
    }
  })

  it('returns null when nothing matches, so callers can tell "unknown" from "other"', () => {
    expect(detectPlatformFromHtml('<html><body>plain</body></html>')).toBeNull()
    expect(detectPlatformFromHtml('')).toBeNull()
  })

  it('is case-insensitive (real pages vary in casing)', () => {
    expect(detectPlatformFromHtml('<SCRIPT SRC="HTTPS://CDN.SHOPIFY.COM/X.JS">')).toBe('shopify')
  })

  it('prefers the storefront over GTM when a store also runs GTM', () => {
    const html =
      '<script src="https://www.googletagmanager.com/gtm.js?id=X"></script>' +
      '<script src="https://cdn.shopify.com/s/files/x.js"></script>'
    expect(detectPlatformFromHtml(html)).toBe('shopify')
  })

  it('never auto-detects "other" — it is a manual choice only', () => {
    expect(PLATFORM_GUIDES.find((p) => p.slug === 'other')?.signatures).toEqual([])
  })
})

describe('getPlatformGuide', () => {
  it('falls back to "other" for null/unknown rather than throwing', () => {
    expect(getPlatformGuide(null).slug).toBe('other')
    expect(getPlatformGuide('nonsense').slug).toBe('other')
  })

  it('every guide has renderable install steps', () => {
    for (const g of PLATFORM_GUIDES) {
      expect(g.steps.length, `${g.slug} steps`).toBeGreaterThan(0)
      expect(g.label.length, `${g.slug} label`).toBeGreaterThan(0)
    }
  })
})

describe('detectPlatform (headers beat HTML)', () => {
  // Regression: runceleste.com is a headless Next.js site for a commerce
  // agency. Its HTML name-drops Shopify/BigCommerce as services sold, and
  // embeds case-study logos served from a Drupal backend at another domain.
  // Content-only matching called it Drupal. It is neither.
  it('does not mistake an agency site for the stacks it merely advertises', () => {
    const html =
      '<img src="https://backend.acrocommerce.com/sites/default/files/logo.png">' +
      '<p>We build on Shopify Plus, BigCommerce and Shopware.</p>' +
      '<script src="/_next/static/chunks/main.js"></script>'
    const headers = { 'x-powered-by': 'Next.js', server: 'Vercel' }
    expect(detectPlatform({ html, headers })).toBe('nextjs')
  })

  it('a linked Drupal asset alone is not Drupal', () => {
    const html = '<img src="https://cdn.example.com/sites/default/files/x.png">'
    expect(detectPlatformFromHtml(html)).toBeNull()
  })

  it('reads real Shopify headers', () => {
    expect(detectPlatformFromHeaders({ 'x-shopid': '12345' })).toBe('shopify')
  })

  it('accepts a Headers instance as well as a plain object', () => {
    expect(detectPlatformFromHeaders(new Headers({ 'x-powered-by': 'Next.js' }))).toBe('nextjs')
  })

  it('falls back to HTML when headers reveal nothing', () => {
    expect(
      detectPlatform({ html: '<script src="https://cdn.shopify.com/x.js">', headers: {} })
    ).toBe('shopify')
  })

  it('returns null when neither source matches, leaving the buyer to pick', () => {
    expect(detectPlatform({ html: '<html></html>', headers: {} })).toBeNull()
  })
})
