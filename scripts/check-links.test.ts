import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkSite } from './check-links.ts'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** Builds a fake dist/ from { 'path/index.html': html }. */
function site(files: Record<string, string>): string {
  const dist = mkdtempSync(join(tmpdir(), 'links-'))
  dirs.push(dist)
  for (const [path, html] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, path)), { recursive: true })
    writeFileSync(join(dist, path), `<html><body>${html}</body></html>`)
  }
  return dist
}
const BASE = '/docs'

describe('checkSite', () => {
  it('accepts links between pages, anchors that exist, and https links off the site', () => {
    const dist = site({
      'index.html': '<a href="/docs/a/">A</a><a href="https://github.com/x">g</a>',
      'a/index.html':
        '<h2 id="top">T</h2><a href="/docs/">home</a><a href="#top">up</a><a href="/docs/a/#top">self</a>',
    })
    expect(checkSite(dist, BASE)).toEqual([])
  })

  it.each([
    ['a page that does not exist', '<a href="/docs/missing/">x</a>', /\/docs\/missing\//],
    ['an anchor that does not exist on the same page', '<a href="#nope">x</a>', /#nope/],
    ['an anchor missing on another page', '<a href="/docs/a/#nope">x</a>', /#nope/],
    ['a bare #', '<a href="#">x</a>', /bare #/],
    ['an empty href', '<a href="">x</a>', /empty/],
    ['a plain http link', '<a href="http://github.com/x">x</a>', /https/],
    ['a placeholder host', '<a href="https://example.com/">x</a>', /example\.com/],
    ['a root-absolute link outside the base', '<a href="/other/">x</a>', /base/],
  ])('reports %s', (_label, html, expected) => {
    const dist = site({ 'index.html': html, 'a/index.html': '<p>a</p>' })
    expect(checkSite(dist, BASE).join('\n')).toMatch(expected)
  })

  it('resolves a link to a file as well as to a directory index', () => {
    const dist = site({
      'index.html': '<a href="/docs/404.html">x</a><a href="/docs/a">y</a>',
      '404.html': '<p>nf</p>',
      'a/index.html': '<p>a</p>',
    })
    expect(checkSite(dist, BASE)).toEqual([])
  })

  it('handles single-quoted and upper-case attributes', () => {
    const dist = site({ 'index.html': "<A HREF='/docs/missing/'>x</A>" })
    expect(checkSite(dist, BASE).join()).toMatch(/missing/)
  })

  it('reports a site with no pages, so an empty build cannot pass', () => {
    expect(checkSite(site({}), BASE).join()).toMatch(/no pages/)
  })
})

describe('the CLI', () => {
  it('exits 1 and names the problem for a broken link, 0 for a clean site', () => {
    const run = (dist: string) =>
      spawnSync(
        process.execPath,
        [join(import.meta.dirname, 'check-links.ts'), '--dir', dist, '--base', BASE],
        { encoding: 'utf8' },
      )
    const bad = run(site({ 'index.html': '<a href="/docs/missing/">x</a>' }))
    expect(bad.status).toBe(1)
    expect(bad.stderr).toMatch(/missing/)
    expect(run(site({ 'index.html': '<a href="/docs/">x</a>' })).status).toBe(0)
  })
})
