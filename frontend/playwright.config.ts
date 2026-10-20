import { defineConfig, devices } from '@playwright/test'

/**
 * OpenGIPHY end-to-end tests (Playwright).
 *
 * These tests run against the REAL app — no mocks and no auto-started
 * servers (there is deliberately no `webServer` block). Before running:
 *
 *   1. Backend up on http://localhost:8000, seeded with the demo data
 *      (demo account demo@example.com / demo1234, 25 seeded GIFs).
 *   2. Frontend dev server up on http://localhost:5173 with
 *      VITE_USE_MOCKS=false, so the UI talks to that backend.
 *   3. One-time browser download: `npx playwright install chromium`
 *
 * Then: `npm run test:e2e`
 *
 * `workers: 1` and `retries: 0` are deliberate: the suite mutates one shared
 * seeded database (likes flip real rows), so tests run strictly serially
 * and a failure is never masked by a retry.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
