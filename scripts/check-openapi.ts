import { resolve } from 'node:path'
import { checkOpenapi } from './openapi.ts'

const argv = process.argv.slice(2)
const value = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)

const dir = resolve(value('--dir') ?? resolve(import.meta.dirname, '../openapi'))
const against = value('--against')
if (argv.includes('--against') && (against === undefined || against.startsWith('--'))) {
  console.error('check-openapi: --against needs the path of the source openapi.yaml')
  process.exit(1)
}
const problems = checkOpenapi({ dir, against: against ? resolve(against) : undefined })
if (problems.length > 0) {
  console.error('check-openapi: failed')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
console.log('check-openapi: the copy matches its recorded source')
