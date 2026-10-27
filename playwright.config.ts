import { defineConfig, devices } from '@playwright/test';

const port = 4300;

/**
 * E2E tests run against the GitHub Pages build (`build:pages`), served under the same
 * /angular-tasklist/ path, with the same 404.html fallback that GitHub Pages uses.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}/angular-tasklist/`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // In CI the workflow has already run build:pages, so only serve it
    command: process.env['E2E_SKIP_BUILD']
      ? `node e2e/serve-pages.mjs ${port}`
      : `npm run build:pages && node e2e/serve-pages.mjs ${port}`,
    url: `http://localhost:${port}/angular-tasklist/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
