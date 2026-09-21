import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkOpenapi, countPaths, syncOpenapi } from './openapi.ts'

const SPEC = `openapi: 3.1.0\ninfo:\n  title: T\n  version: 1.0.0\npaths:\n  /a:\n    get: {}\n  /b:\n    get: {}\n`
const sha = (text: string) => createHash('sha256').update(text).digest('hex')

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})
function workspace(spec: string | null = SPEC) {
  const root = mkdtempSync(join(tmpdir(), 'openapi-'))
  dirs.push(root)
  const from = join(root, 'source.yaml')
  if (spec !== null) writeFileSync(from, spec)
  const dest = join(root, 'openapi')
  mkdirSync(dest)
  return { root, from, dest }
}
const at = new Date('2026-09-20T12:00:00Z')

describe('syncOpenapi', () => {
  it('copies the file byte for byte and records the tag, checksum, and time', () => {
    const { from, dest } = workspace()
    syncOpenapi({ from, tag: 'v1.0.0', dest, now: at })
    expect(readFileSync(join(dest, 'openapi.yaml'), 'utf8')).toBe(SPEC)
    expect(JSON.parse(readFileSync(join(dest, 'SOURCE.json'), 'utf8'))).toEqual({
      tag: 'v1.0.0',
      sha256: sha(SPEC),
      syncedAt: '2026-09-20T12:00:00.000Z',
    })
  })

  it.each([
    ['a tag that is not a release', 'main', /tag/],
    ['a pre-release-looking tag', 'v1.0', /tag/],
    ['an empty tag', '', /tag/],
  ])('refuses %s', (_label, tag, expected) => {
    const { from, dest } = workspace()
    expect(() => syncOpenapi({ from, tag, dest, now: at })).toThrow(expected)
  })

  it('refuses a missing source, an empty file, and a non-3.1 document', () => {
    expect(() => syncOpenapi({ ...workspace(null), tag: 'v1.0.0', now: at })).toThrow(/read/)
    expect(() => syncOpenapi({ ...workspace(''), tag: 'v1.0.0', now: at })).toThrow(/OpenAPI 3\.1/)
    expect(() =>
      syncOpenapi({ ...workspace('openapi: 3.0.3\npaths: {}\n'), tag: 'v1.0.0', now: at }),
    ).toThrow(/OpenAPI 3\.1/)
    expect(() => syncOpenapi({ ...workspace('hello: world\n'), tag: 'v1.0.0', now: at })).toThrow(
      /OpenAPI 3\.1/,
    )
  })

  it('writes nothing when it refuses', () => {
    const w = workspace('nope')
    expect(() => syncOpenapi({ ...w, tag: 'v1.0.0', now: at })).toThrow()
    expect(() => readFileSync(join(w.dest, 'openapi.yaml'))).toThrow()
  })
})

describe('checkOpenapi', () => {
  it('passes a freshly synced copy', () => {
    const { from, dest } = workspace()
    syncOpenapi({ from, tag: 'v1.0.0', dest, now: at })
    expect(checkOpenapi({ dir: dest })).toEqual([])
  })

  it('fails when a single byte of the copy changes', () => {
    const { from, dest } = workspace()
    syncOpenapi({ from, tag: 'v1.0.0', dest, now: at })
    writeFileSync(join(dest, 'openapi.yaml'), SPEC.replace('title: T', 'title: U'))
    expect(checkOpenapi({ dir: dest }).join()).toMatch(/does not match/)
  })

  it('fails when the record or the copy is missing or malformed', () => {
    const { from, dest } = workspace()
    expect(checkOpenapi({ dir: dest }).join()).toMatch(/SOURCE\.json/)
    syncOpenapi({ from, tag: 'v1.0.0', dest, now: at })
    writeFileSync(join(dest, 'SOURCE.json'), '{"tag":"main"}')
    expect(checkOpenapi({ dir: dest }).join()).toMatch(/tag|sha256/)
    writeFileSync(join(dest, 'SOURCE.json'), 'not json')
    expect(checkOpenapi({ dir: dest }).join()).toMatch(/SOURCE\.json/)
    syncOpenapi({ from, tag: 'v1.0.0', dest, now: at })
    rmSync(join(dest, 'openapi.yaml'))
    expect(checkOpenapi({ dir: dest }).join()).toMatch(/openapi\.yaml is missing/)
  })

  it('with --against, also fails when the source has moved on', () => {
    const { from, dest } = workspace()
    syncOpenapi({ from, tag: 'v1.0.0', dest, now: at })
    expect(checkOpenapi({ dir: dest, against: from })).toEqual([])
    writeFileSync(from, SPEC + '  /c:\n    get: {}\n')
    expect(checkOpenapi({ dir: dest, against: from }).join()).toMatch(/source/)
  })
})

describe('countPaths', () => {
  it('counts the top-level keys under paths', () => {
    expect(countPaths(SPEC)).toBe(2)
    expect(countPaths('openapi: 3.1.0\npaths: {}\n')).toBe(0)
  })

  it('ignores indented keys that only look like paths', () => {
    const tricky = `${SPEC}components:\n  schemas:\n    /x:\n      type: string\n`
    expect(countPaths(tricky)).toBe(2)
  })
})

describe('the CLIs', () => {
  const run = (script: string, ...args: string[]) =>
    spawnSync(process.execPath, [join(import.meta.dirname, script), ...args], { encoding: 'utf8' })

  it('sync then check exit 0, and check exits 1 after a hand edit', () => {
    const { from, dest } = workspace()
    expect(run('sync-openapi.ts', '--from', from, '--tag', 'v1.0.0', '--dir', dest).status).toBe(0)
    expect(run('check-openapi.ts', '--dir', dest).status).toBe(0)
    writeFileSync(join(dest, 'openapi.yaml'), 'openapi: 3.1.0\n')
    const bad = run('check-openapi.ts', '--dir', dest)
    expect(bad.status).toBe(1)
    expect(bad.stderr).toMatch(/does not match/)
  })

  it('check exits 1 when --against is given without a value, instead of skipping the comparison', () => {
    const { from, dest } = workspace()
    run('sync-openapi.ts', '--from', from, '--tag', 'v1.0.0', '--dir', dest)
    const r = run('check-openapi.ts', '--dir', dest, '--against')
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/--against/)
  })

  it('sync exits 1 with a message when arguments are missing', () => {
    const r = run('sync-openapi.ts')
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/--from/)
  })
})
