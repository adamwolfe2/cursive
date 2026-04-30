import { test, expect } from '@playwright/test'

/**
 * Outbound Agent — public-page smoke tests.
 *
 * Authenticated end-to-end happy-path testing requires:
 *   - A test workspace with credits + an outbound agent + ANTHROPIC_API_KEY set
 *   - OUTBOUND_DEV_MOCK_AL=1 in the dev server env (mocks AudienceLab)
 *   - EMAILBISON_API_KEY unset (mocks email send)
 *
 * That setup lives in tests/e2e/auth.setup.ts (out of scope for this commit).
 * Until then, this spec verifies that:
 *   1. /outbound redirects unauthenticated users (auth gate works)
 *   2. /outbound/new redirects unauthenticated users
 *
 * The full happy path is documented in docs/outbound-agent-runbook.md.
 */

test.describe('Outbound Agent — auth gates', () => {
  test('GET /outbound redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/outbound')
    await page.waitForURL(/\/(login|welcome)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|welcome)/)
  })

  test('GET /outbound/new redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/outbound/new')
    await page.waitForURL(/\/(login|welcome)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|welcome)/)
  })

  test('GET /outbound/[id] redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/outbound/00000000-0000-0000-0000-000000000000')
    await page.waitForURL(/\/(login|welcome)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|welcome)/)
  })
})

test.describe('Outbound Agent — API auth gates', () => {
  test('POST /api/outbound/workflows requires auth', async ({ request }) => {
    const res = await request.post('/api/outbound/workflows', {
      data: { name: 'Test', product_text: 'long enough product description' },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('GET /api/outbound/workflows requires auth', async ({ request }) => {
    const res = await request.get('/api/outbound/workflows')
    expect([401, 403]).toContain(res.status())
  })

  test('POST /api/outbound/icp/generate requires auth', async ({ request }) => {
    const res = await request.post('/api/outbound/icp/generate', {
      data: { product_text: 'We sell autonomous SDR software for B2B SaaS founders.' },
    })
    expect([401, 403]).toContain(res.status())
  })
})
