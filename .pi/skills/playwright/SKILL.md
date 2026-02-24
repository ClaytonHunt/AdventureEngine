---
name: playwright
description: Playwright end-to-end testing — page object model, test structure, locators, and CI setup. Load when writing or running E2E tests.
---

# Playwright E2E Testing

Reference: https://playwright.dev

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific file
npx playwright test tests/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode (pause on each step)
npx playwright test --debug

# UI mode (visual test runner)
npx playwright test --ui

# Generate code from browser actions
npx playwright codegen http://localhost:3000
```

## Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Structure

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('logs in with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'wrong@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  });
});
```

## Page Object Model

```typescript
// pages/login.page.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// tests/auth.spec.ts
import { LoginPage } from '../pages/login.page';

test('logs in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

## Locator Best Practices (priority order)

```typescript
// 1. Role (most accessible, most robust)
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('link', { name: 'Sign up' })

// 2. Test ID (explicit, stable)
page.getByTestId('login-form')

// 3. Label
page.getByLabel('Password')

// 4. Placeholder
page.getByPlaceholder('Enter email')

// 5. Text (fragile to copy changes)
page.getByText('Welcome back')

// AVOID — brittle
page.locator('.btn-primary')  // CSS class
page.locator('#submit')        // ID (ok if stable)
page.locator('div > p:nth-child(2)')  // structural
```

## Assertions

```typescript
// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/.*dashboard/);

// Title
await expect(page).toHaveTitle('My App');

// Visibility
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();

// Content
await expect(locator).toHaveText('exact text');
await expect(locator).toContainText('partial');
await expect(locator).toHaveValue('input value');

// State
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toBeChecked();
await expect(locator).toBeFocused();

// Count
await expect(locator).toHaveCount(3);
```

## Authentication State Reuse

```typescript
// Save auth state once
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_USER!);
  await page.fill('[name="password"]', process.env.TEST_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// playwright.config.ts — reuse auth state
{
  name: 'authenticated',
  use: { storageState: 'playwright/.auth/user.json' },
  dependencies: ['setup'],
}
```
