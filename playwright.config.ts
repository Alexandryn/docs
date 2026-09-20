import { defineConfig, devices } from '@playwright/test'

const port = 4321

// Runs against the built site, because search only exists after a full build.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `npm run build && npx astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}/docs/`,
    // Always start our own server: a stale preview would serve an old build.
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
