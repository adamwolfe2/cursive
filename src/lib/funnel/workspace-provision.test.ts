import { describe, it, expect } from 'vitest'
import { slugifyWorkspace, workspaceNameForOrder } from './workspace-provision'

describe('slugifyWorkspace', () => {
  it('derives a slug stem from a domain and drops the TLD', () => {
    expect(slugifyWorkspace('acme.com')).toMatch(/^acme-[0-9a-f]{6}$/)
  })

  it('strips protocol + www', () => {
    expect(slugifyWorkspace('https://www.acme.io')).toMatch(
      /^www-acme-[0-9a-f]{6}$/
    )
  })

  it('uses the local part of an email', () => {
    expect(slugifyWorkspace('jane.doe@acme.com')).toMatch(
      /^jane-doe-[0-9a-f]{6}$/
    )
  })

  it('falls back to "workspace" for empty input', () => {
    expect(slugifyWorkspace('')).toMatch(/^workspace-[0-9a-f]{6}$/)
  })

  it('produces a unique suffix per call', () => {
    const a = slugifyWorkspace('acme.com')
    const b = slugifyWorkspace('acme.com')
    expect(a).not.toBe(b)
  })

  it('caps the stem length', () => {
    const long = 'a'.repeat(100)
    const slug = slugifyWorkspace(long)
    const stem = slug.replace(/-[0-9a-f]{6}$/, '')
    expect(stem.length).toBeLessThanOrEqual(40)
  })
})

describe('workspaceNameForOrder', () => {
  it('prefers the pixel domain', () => {
    expect(
      workspaceNameForOrder({
        pixel_domain: 'acme.com',
        customer_name: 'Jane',
        customer_email: 'jane@acme.com',
      })
    ).toBe('acme.com')
  })

  it('falls back to customer name when no domain', () => {
    expect(
      workspaceNameForOrder({
        pixel_domain: null,
        customer_name: 'Jane Doe',
        customer_email: 'jane@acme.com',
      })
    ).toBe('Jane Doe')
  })

  it('falls back to email when no domain or name', () => {
    expect(
      workspaceNameForOrder({
        pixel_domain: null,
        customer_name: '   ',
        customer_email: 'jane@acme.com',
      })
    ).toBe('jane@acme.com')
  })
})
