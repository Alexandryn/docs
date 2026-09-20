import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { countPaths } from '../scripts/openapi.ts'

const VIEWPORTS = [
  { name: 'phone', width: 320, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const

const PAGES = [
  ['home', '/docs/'],
  ['a guide page', '/docs/getting-started/run-with-docker/'],
  ['the API reference', '/docs/api/'],
] as const

for (const [label, path] of PAGES) {
  for (const { name, width, height } of VIEWPORTS) {
    test(`no axe violations on ${label} at ${width}px (${name})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([])
      expect(results.passes.length).toBeGreaterThan(10)
    })
  }
}

test('no horizontal scroll at 320px on a long guide page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/docs/getting-started/run-with-docker/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('the first Tab stop is a skip link that moves focus to the content', async ({
  page,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'Safari skips links when tabbing by default')
  await page.goto('/docs/getting-started/what-is-alexandryn/')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toHaveAttribute('href', /#_top|#main|#content/)
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeVisible()
})

test('search finds a page by a word in its body, not only its title', async ({ page }) => {
  await page.goto('/docs/')
  await page
    .getByRole('button', { name: /search/i })
    .first()
    .click()
  const box = page.locator('dialog[open] input').first()
  await box.fill('Argon2id')
  const result = page.locator('a[href*="how-security-works"]').first()
  await expect(result).toBeVisible({ timeout: 10_000 })
})

test('the API reference lists every path in the specification', async ({ page }) => {
  const spec = readFileSync(join(import.meta.dirname, '../openapi/openapi.yaml'), 'utf8')
  const expected = countPaths(spec)
  expect(expected).toBeGreaterThan(50)
  const paths = [...spec.matchAll(/^ {2}(\/\S*):\s*$/gm)].map((m) => m[1]!)
  expect(paths).toHaveLength(expected)

  // Each operation page is reachable from the reference; collect their text.
  await page.goto('/docs/api/')
  const links = await page
    .locator('a[href*="/docs/api/operations/"]')
    .evaluateAll((els) => [...new Set(els.map((el) => (el as HTMLAnchorElement).href))])
  expect(links.length).toBeGreaterThanOrEqual(expected)
  let text = ''
  for (const href of links) {
    await page.goto(href)
    text += await page.locator('main').innerText()
  }
  for (const path of paths) expect(text, path).toContain(path)
})

test('loads with no console errors and requests nothing from another origin', async ({
  page,
  baseURL,
}) => {
  const problems: string[] = []
  const origins = new Set<string>()
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text())
  })
  page.on('pageerror', (e) => problems.push(e.message))
  page.on('request', (r) => origins.add(new URL(r.url()).origin))
  await page.goto('/docs/getting-started/what-is-alexandryn/')
  await page.waitForLoadState('networkidle')
  expect(problems).toEqual([])
  expect([...origins]).toEqual([new URL(baseURL!).origin])
})
