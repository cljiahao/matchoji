import { defineConfig, devices } from '@playwright/test';

// Read-only smoke tests against a deployed site: production by default. Vercel previews are
// login-gated, so point E2E_BASE_URL at one only if you hold a bypass.
const baseURL = process.env.E2E_BASE_URL ?? 'https://matchoji.vercel.app';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // E2E_CHANNEL=chrome reuses an installed Chrome instead of Playwright's bundled Chromium.
    channel: process.env.E2E_CHANNEL,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.E2E_CHANNEL } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.E2E_CHANNEL } },
  ],
});
