import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/OpenInfo/)
    await expect(
      page.getByRole('heading', { name: /OpenInfo Platform/i })
    ).toBeVisible()
  })
})
