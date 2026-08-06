import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const mobileLegal = join(root, '../src/lib/legalContent.ts')
const webLegal = join(root, '../../../client/src/lib/legalContent.ts')

const mobile = readFileSync(mobileLegal, 'utf8')
const web = readFileSync(webLegal, 'utf8')

if (mobile !== web) {
  console.error('legalContent.ts is out of sync between mobile and web.')
  console.error(`  mobile: ${mobileLegal}`)
  console.error(`  web:    ${webLegal}`)
  process.exit(1)
}

console.log('legalContent.ts is in sync between mobile and web.')
