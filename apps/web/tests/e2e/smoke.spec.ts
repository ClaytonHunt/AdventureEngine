import { test, expect } from '@playwright/test'

test('app shell renders main heading', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'AdventureEngine' }),
  ).toBeVisible()
})
