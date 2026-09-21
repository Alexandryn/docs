import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const docsDir = join(import.meta.dirname, '../src/content/docs')

/** One message per rule a page breaks; empty means the page is acceptable. */
export function contentProblems(name: string, text: string): string[] {
  const problems: string[] = []
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!front) return [`${name}: no frontmatter`]
  const title = /^title:\s*(.+)$/m.exec(front[1]!)?.[1]?.trim()
  const description = /^description:\s*(.+)$/m.exec(front[1]!)?.[1]?.trim()
  if (!title) problems.push(`${name}: no title`)
  if (!description) problems.push(`${name}: no description`)
  else if (description.length < 30 || description.length > 200) {
    problems.push(`${name}: description should be 30 to 200 characters`)
  }
  // Prose only: shell examples and code may contain characters that prose may not.
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  if (/!/.test(prose.replace(/!\[/g, ''))) problems.push(`${name}: exclamation mark in prose`)
  if (/example\.(com|org|net)/i.test(text)) problems.push(`${name}: placeholder example domain`)
  if (/\b(seamless(ly)?|blazing|revolutionary|effortless(ly)?|supercharge)\b/i.test(prose)) {
    problems.push(`${name}: marketing wording`)
  }
  if (/\bsorry\b|\bunfortunately\b/i.test(prose)) problems.push(`${name}: apologetic wording`)
  return problems
}

function pages(dir: string): Array<{ name: string; text: string }> {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => {
      const path = join(e.parentPath, e.name)
      return { name: path.slice(docsDir.length + 1), text: readFileSync(path, 'utf8') }
    })
}

describe('the pages', () => {
  const all = pages(docsDir)

  it('finds the pages to check', () => {
    expect(all.length).toBeGreaterThanOrEqual(13)
  })

  it('all have a title and description and break no wording rule', () => {
    expect(all.flatMap(({ name, text }) => contentProblems(name, text))).toEqual([])
  })

  it('never claim an access-token lifetime, which is not verified against the code', () => {
    for (const { name, text } of all) expect(text, name).not.toMatch(/\b15 minutes\b/)
  })
})

describe('load-bearing statements are present in full', () => {
  const page = (name: string) => readFileSync(join(docsDir, name), 'utf8')

  it('tells a Docker reader to remove the developer DATABASE_URL and set POSTGRES_PASSWORD', () => {
    const text = page('getting-started/run-with-docker.md')
    expect(text).toMatch(/Delete that line or comment it out/)
    expect(text).toMatch(/`POSTGRES_PASSWORD`/)
  })

  it('does not present plain HTTP on a private address as a recommendation', () => {
    for (const name of ['security/exposing-alexandryn.md', 'using/read-on-another-device.md']) {
      expect(page(name), name).toMatch(/password[^.]*(crosses|clear|unencrypted)/i)
    }
    expect(page('security/exposing-alexandryn.md')).toMatch(/not a recommendation/)
  })

  it('warns that backups are sensitive and says how to protect them', () => {
    const text = page('admin/back-up-and-restore.md')
    expect(text).toMatch(/umask 077/)
    expect(text).toMatch(/Encrypt the copies/)
  })

  it('says the restore steps are untested, and how to find the real volume name', () => {
    const text = page('admin/back-up-and-restore.md')
    expect(text).toMatch(/have not been tested/)
    expect(text).toMatch(/docker volume ls/)
  })

  it('tells the reader how to check a download, and does not overstate what that proves', () => {
    const text = page('getting-started/install-the-desktop-app.md')
    expect(text).toMatch(/SHA256SUMS\.txt/)
    for (const command of ['sha256sum', 'shasum -a 256', 'Get-FileHash']) {
      expect(text).toContain(command)
    }
    expect(text).toMatch(/does not rule out tampering at the source/)
    expect(text).not.toMatch(/does not yet document a way to verify/)
  })

  it('says the desktop app listens on its own computer only', () => {
    expect(page('using/read-on-another-device.md')).toMatch(/listens on its own computer only/)
  })
})

describe('contentProblems catches what it is for (positive controls)', () => {
  const page = (body: string, description = 'A description that is long enough to pass.') =>
    `---\ntitle: T\ndescription: ${description}\n---\n\n${body}\n`

  it('accepts a clean page, including "!" inside code', () => {
    expect(contentProblems('a.md', page('Run it.\n\n```sh\necho hi!\n```\n'))).toEqual([])
  })

  it.each([
    ['no frontmatter', 'Just text.', /frontmatter/],
    ['a missing description', '---\ntitle: T\n---\nBody', /no description/],
    ['a short description', page('Body', 'Too short'), /30 to 200/],
    ['an exclamation mark', page('Welcome!'), /exclamation/],
    ['an example domain', page('Mail you@example.com'), /example/],
    ['marketing wording', page('A seamless experience.'), /marketing/],
    ['an apology', page('Sorry about that.'), /apolog/],
  ])('reports %s', (_label, text, expected) => {
    expect(contentProblems('a.md', text).join()).toMatch(expected)
  })
})
