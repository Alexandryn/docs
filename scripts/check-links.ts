import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const decode = (v: string) => v.replaceAll('&amp;', '&')
// A tag's attribute text: quoted values may contain ">", so they are matched whole.
const TAG_BODY = String.raw`((?:"[^"]*"|'[^']*'|[^>"'])*)`

function attributes(text: string): Map<string, string> {
  const attrs = new Map<string, string>()
  for (const m of text.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    attrs.set(m[1]!.toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? ''))
  }
  return attrs
}

function htmlFiles(dist: string): string[] {
  return (readdirSync(dist, { recursive: true, withFileTypes: true }) as import('node:fs').Dirent[])
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath, e.name))
}

/** The page's own URL path under the base, e.g. dist/a/index.html -> /docs/a/ */
function pageUrl(dist: string, file: string, base: string): string {
  const rel = file.slice(dist.length).replaceAll('\\', '/')
  return `${base}${rel.replace(/index\.html$/, '')}`
}

/** One message per broken internal link, anchor, or unsafe external link. */
export function checkSite(dist: string, base: string): string[] {
  const files = htmlFiles(dist)
  if (files.length === 0) return ['the site has no pages']

  const idsByUrl = new Map<string, Set<string>>()
  const pages: Array<{ url: string; html: string }> = []
  for (const file of files) {
    const html = readFileSync(file, 'utf8')
    const url = pageUrl(dist, file, base)
    idsByUrl.set(
      url,
      new Set([...html.matchAll(/\sid=(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2]!)),
    )
    pages.push({ url, html })
  }

  const problems: string[] = []
  const resolveTarget = (path: string): string | undefined => {
    const clean = path.replace(/\/+$/, '')
    const rel = clean.slice(base.length)
    for (const candidate of [join(dist, rel, 'index.html'), join(dist, rel)]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
    }
    return undefined
  }

  for (const { url, html } of pages) {
    for (const tag of html.matchAll(new RegExp(`<a(?=[\\s>])${TAG_BODY}>`, 'gi'))) {
      const href = attributes(tag[1]!).get('href')
      const where = `${url}: `
      if (href === undefined) continue
      if (href === '') problems.push(`${where}a link has an empty href`)
      else if (href === '#') problems.push(`${where}a link points at a bare #`)
      else if (href.startsWith('#')) {
        if (!idsByUrl.get(url)?.has(decodeURIComponent(href.slice(1)))) {
          problems.push(`${where}${href} matches no element on the page`)
        }
      } else if (/^https?:\/\//i.test(href)) {
        const host = new URL(href).hostname.replace(/\.$/, '')
        if (!href.startsWith('https://')) problems.push(`${where}${href} is not https`)
        if (/(^|\.)example\.(com|org|net)$/i.test(host)) {
          problems.push(`${where}${href} is a placeholder host, example.com`)
        }
      } else if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
        problems.push(`${where}${href} uses a scheme other than https`)
      } else if (href.startsWith('/')) {
        const [path = '', fragment] = href.split('#')
        if (path !== base && !path.startsWith(`${base}/`)) {
          problems.push(`${where}${href} is outside the base path ${base}`)
          continue
        }
        const target = resolveTarget(path)
        if (!target) problems.push(`${where}${href} does not exist`)
        else if (fragment) {
          const ids = idsByUrl.get(pageUrl(dist, target, base))
          if (!ids?.has(decodeURIComponent(fragment))) {
            problems.push(`${where}${href} points at #${fragment}, which is not on that page`)
          }
        }
      }
    }
  }
  return problems
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const argv = process.argv.slice(2)
  const value = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
  const dist = resolve(value('--dir') ?? join(import.meta.dirname, '../dist'))
  const base = value('--base') ?? '/docs'
  const problems = checkSite(dist, base)
  if (problems.length > 0) {
    console.error('check-links: failed')
    for (const p of problems) console.error(`  ${p}`)
    process.exitCode = 1
  } else {
    console.log(`check-links: ${htmlFiles(dist).length} pages, all internal links resolve`)
  }
}
