import { resolve } from 'node:path'
import { syncOpenapi } from './openapi.ts'

const argv = process.argv.slice(2)
const value = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)

const from = value('--from')
const tag = value('--tag')
if (!from || !tag) {
  console.error('sync-openapi: --from <path to openapi.yaml> and --tag <release tag> are required')
  process.exit(1)
}
const dest = resolve(value('--dir') ?? resolve(import.meta.dirname, '../openapi'))
try {
  syncOpenapi({ from: resolve(from), tag, dest })
  console.log(`sync-openapi: copied ${from} as ${tag} into ${dest}`)
} catch (error) {
  console.error(`sync-openapi: ${(error as Error).message}`)
  process.exit(1)
}
