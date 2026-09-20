import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TAG = /^v\d+\.\d+\.\d+$/
const OPENAPI_31 = /^openapi:\s*['"]?3\.1\.\d+['"]?\s*$/m

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

function read(path: string): string {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    throw new Error(`cannot read ${path}`)
  }
}

interface SyncOptions {
  from: string
  tag: string
  dest: string
  now?: Date
}

/**
 * Copies the API contract from a release of alexandryn into this repo and
 * records where it came from. Writes nothing unless every check passes.
 */
export function syncOpenapi({ from, tag, dest, now = new Date() }: SyncOptions): void {
  if (!TAG.test(tag)) throw new Error(`tag "${tag}" must be a release tag such as v1.0.0`)
  const spec = read(from)
  if (!OPENAPI_31.test(spec)) throw new Error(`${from} is not an OpenAPI 3.1 document`)
  mkdirSync(dest, { recursive: true })
  writeFileSync(join(dest, 'openapi.yaml'), spec)
  const record = { tag, sha256: sha256(spec), syncedAt: now.toISOString() }
  writeFileSync(join(dest, 'SOURCE.json'), JSON.stringify(record, null, 2) + '\n')
}

interface CheckOptions {
  dir: string
  /** A checkout of the source file; when given, the copy must match it too. */
  against?: string
}

/** One message per problem; empty means the copy is exactly what was synced. */
export function checkOpenapi({ dir, against }: CheckOptions): string[] {
  let record: { tag?: unknown; sha256?: unknown }
  try {
    record = JSON.parse(read(join(dir, 'SOURCE.json')))
  } catch (error) {
    const reason = error instanceof SyntaxError ? 'is not valid JSON' : 'is missing'
    return [`SOURCE.json ${reason}; run the sync first`]
  }
  const problems: string[] = []
  if (typeof record.tag !== 'string' || !TAG.test(record.tag)) {
    problems.push('SOURCE.json needs a release tag such as v1.0.0')
  }
  if (typeof record.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(record.sha256)) {
    problems.push('SOURCE.json needs a sha256 checksum')
  }
  let copy: string
  try {
    copy = read(join(dir, 'openapi.yaml'))
  } catch {
    return [...problems, 'openapi.yaml is missing']
  }
  if (typeof record.sha256 === 'string' && sha256(copy) !== record.sha256) {
    problems.push('openapi.yaml does not match the checksum in SOURCE.json; it was edited by hand')
  }
  if (against) {
    let source: string
    try {
      source = read(against)
    } catch (error) {
      return [...problems, (error as Error).message]
    }
    if (sha256(source) !== sha256(copy)) {
      problems.push(`the source at ${against} has changed since the sync; sync again`)
    }
  }
  return problems
}

/** Number of entries directly under the top-level `paths:` key. */
export function countPaths(spec: string): number {
  const lines = spec.split('\n')
  const start = lines.findIndex((line) => /^paths:/.test(line))
  if (start < 0) return 0
  let count = 0
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line) && !line.startsWith('#')) break
    if (/^ {2}\/\S*:\s*$/.test(line)) count++
  }
  return count
}
