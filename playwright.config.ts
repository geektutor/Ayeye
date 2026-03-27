import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against the full stack:
 *   - apps/web on http://localhost:5173
 *   - apps/api on http://localhost:3001
 *   - PostgreSQL via docker compose
 *
 * Start the stack before running: `docker compose up -d && pnpm dev`
 * Then run E2E: `pnpm test:e2e`
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // fail CI if test.only is left in
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry', // capture trace on failure for debugging
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }, // test PWA on mobile viewport
    },
  ],

  // Automatically start dev servers before running E2E tests
  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
