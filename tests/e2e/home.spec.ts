import { test, expect } from '@playwright/test'

/**
 * Public Page Smoke Tests
 * Verifies all public-facing pages render without errors.
 */

test.describe('Public Pages', () => {
  test('welcome page loads with quiz flow', async ({ page }) => {
    await page.goto('/welcome')
    await expect(page).toHaveTitle(/Welcome|Cursive/)

    // Quiz flow should render — check for heading or quiz content
    const content = page.locator('body')
    await expect(content).not.toBeEmpty()

    // Should NOT show a 500 error or blank page
    const bodyText = await content.textContent()
    expect(bodyText?.toLowerCase()).not.toContain('internal server error')
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Log In|Cursive/)

    // Should have email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Should have a submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up|Cursive/)

    // Should have form fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveTitle(/Forgot Password|Cursive/)

    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
  })
})

test.describe('Auth Redirects', () => {
  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/(login|welcome)/, { timeout: 10000 })
  })

  test('my-leads redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/my-leads')
    await page.waitForURL(/\/(login|welcome)/, { timeout: 10000 })
  })

  test('settings redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL(/\/(login|welcome)/, { timeout: 10000 })
  })
})
