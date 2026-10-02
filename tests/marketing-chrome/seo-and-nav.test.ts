import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BLOG_INDEX,
  BLOG_POST_PATHS,
  CORE_PATHS,
  EDUCATIONAL_PATHS,
  INDUSTRY_PATHS,
  LEGAL_PATHS,
  PRODUCT_PATHS,
  SECONDARY_PATHS,
} from '../../marketing/lib/seo/sitemap-paths'
import { DISALLOWED_PATHS, NAMED_CRAWLERS } from '../../marketing/lib/seo/robots-rules'
import {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
  PUBLISHED_OFFERS,
} from '../../marketing/lib/seo/structured-data'
import { NAV_LINKS, PRODUCT_GROUPS, PRODUCT_ADDON } from '../../marketing/components/header/nav-config'

const APP = path.resolve(__dirname, '../../marketing/app')
const hasPage = (url: string) => existsSync(path.join(APP, url, 'page.tsx')) || url === ''

const FORBIDDEN = /280M|NCOA|SOC ?2|match rate|20M emails|GetLeads|AudienceLab|verified work|ROI/i

describe('sitemap paths', () => {
  const all = [
    ...CORE_PATHS,
    ...PRODUCT_PATHS,
    ...INDUSTRY_PATHS,
    ...EDUCATIONAL_PATHS,
    ...SECONDARY_PATHS,
    BLOG_INDEX,
    ...BLOG_POST_PATHS,
    ...LEGAL_PATHS,
  ]

  it('includes /pricing and the home page', () => {
    const urls = all.map((p) => p.url)
    expect(urls).toContain('/pricing')
    expect(urls).toContain('')
  })

  it('has no duplicates', () => {
    const urls = all.map((p) => p.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('lists only URLs that have a page', () => {
    const missing = all.map((p) => p.url).filter((u) => !hasPage(u))
    expect(missing).toEqual([])
  })

  it('lists every blog post that has a page', () => {
    const dirs = readdirSync(path.join(APP, 'blog'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(path.join(APP, 'blog', d.name, 'page.tsx')))
      .map((d) => `/blog/${d.name}`)
    const listed = new Set(BLOG_POST_PATHS.map((p) => p.url))
    expect(dirs.filter((d) => !listed.has(d))).toEqual([])
  })

  it('excludes junk and unverifiable pages', () => {
    const urls = all.map((p) => p.url)
    for (const bad of ['/case-studies', '/call-booked', '/deck', '/enterprise-deck', '/marketplace', '/services']) {
      expect(urls).not.toContain(bad)
    }
  })
})

describe('robots rules', () => {
  it('blocks private paths and keeps /_next/ crawlable', () => {
    expect(DISALLOWED_PATHS).toContain('/api/')
    expect(DISALLOWED_PATHS).toContain('/call-booked')
    expect(DISALLOWED_PATHS).not.toContain('/_next/')
  })
  it('names the major AI crawlers', () => {
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot']) expect(NAMED_CRAWLERS).toContain(bot)
  })
})

describe('structured data', () => {
  it('has no invented ratings or retired prices', () => {
    const app = generateSoftwareApplicationSchema() as Record<string, unknown>
    expect(app).not.toHaveProperty('aggregateRating')
    const json = JSON.stringify([generateOrganizationSchema(), generateWebSiteSchema(), app])
    expect(json).not.toMatch(FORBIDDEN)
    expect(json).not.toContain('"1000"')
  })
  it('publishes exactly the approved prices', () => {
    const prices = Object.fromEntries(PUBLISHED_OFFERS.map((o) => [o.name, o.price]))
    expect(prices).toMatchObject({
      Starter: '197',
      Growth: '497',
      'LinkedIn outreach': '1497',
      'LinkedIn and email outreach': '2497',
      'Visitor Pixel add-on': '97',
    })
  })
  it('links the website to the organization by id', () => {
    const org = generateOrganizationSchema()
    const site = generateWebSiteSchema()
    expect(site.publisher['@id']).toBe(org['@id'])
  })
})

describe('header navigation', () => {
  it('organises Products as Find them, Reach them, Run it plus the Visitor Pixel add-on', () => {
    expect(PRODUCT_GROUPS.map((g) => g.title)).toEqual(['Find them', 'Reach them', 'Run it'])
    expect(PRODUCT_ADDON.label).toBe('Visitor Pixel')
    expect(PRODUCT_ADDON.description).toContain('$97')
    expect(NAV_LINKS.find((l) => l.label === 'Products')?.footer).toBe(PRODUCT_ADDON)
  })
  it('keeps a top-level Pricing link', () => {
    expect(NAV_LINKS.some((l) => l.label === 'Pricing' && l.href === '/pricing')).toBe(true)
  })
  it('has no unverifiable copy, em dashes or case-study links', () => {
    const text = JSON.stringify(NAV_LINKS)
    expect(text).not.toMatch(FORBIDDEN)
    expect(text).not.toContain('—')
    expect(text).not.toContain('/case-studies')
  })
  it('only links internal routes that exist', () => {
    const internal = NAV_LINKS.flatMap((l) => [
      ...(l.href ? [l.href] : []),
      ...(l.groups?.flatMap((g) => g.items.map((i) => i.href)) ?? []),
      ...(l.footer ? [l.footer.href] : []),
    ]).filter((h) => h.startsWith('/'))
    for (const href of internal) {
      const route = href.split('#')[0]
      expect(existsSync(path.join(APP, route, 'page.tsx')) || route === '', href).toBe(true)
    }
  })
})

describe('llms.txt', () => {
  const text = readFileSync(path.resolve(__dirname, '../../marketing/public/llms.txt'), 'utf8')
  it('uses the new positioning and approved prices only', () => {
    expect(text).toContain('finds your buyers, reaches them for you')
    for (const p of ['$49', '$199', '$599', '$197', '$497', '$1,497', '$2,497', '$2,500', '$500', '$97']) expect(text).toContain(p)
  })
  it('makes no unverifiable or provider-naming claims', () => {
    expect(text).not.toMatch(FORBIDDEN)
    expect(text).not.toContain('—')
    expect(text).not.toMatch(/\$1,000|\$5,000|\$0\.60/)
  })
})
