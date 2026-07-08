import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const mobileConsultants = join(root, '../src/content/consultants.ts')
const webConsultants = join(
  root,
  '../../../client/baby_patterns/baby-patterns/src/content/consultants.ts',
)

const mobile = readFileSync(mobileConsultants, 'utf8')
const web = readFileSync(webConsultants, 'utf8')

if (mobile !== web) {
  console.error('consultants.ts is out of sync between mobile and web.')
  console.error(`  mobile: ${mobileConsultants}`)
  console.error(`  web:    ${webConsultants}`)
  process.exit(1)
}

console.log('consultants.ts is in sync between mobile and web.')
