import { defineConfig } from 'vitest/config'

export default defineConfig({
  // e2e/ belongs to Playwright, whose test() API collides with Vitest's.
  test: { include: ['scripts/**/*.test.ts'] },
})
