#!/usr/bin/env node
/**
 * Production readiness smoke test.
 * Run: npm run test:production
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://baby-patterns-server.onrender.com'
const mediaUrl = process.env.EXPO_PUBLIC_MEDIA_URL ?? apiUrl
const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true'

const requiredAssets = [
  'assets/images/icon.png',
  'assets/images/splash.png',
  'assets/images/splash-dark.png',
  'assets/images/android-icon-foreground.png',
  'assets/images/favicon.png',
]

const results = []
let failed = false

function pass(msg) {
  results.push({ ok: true, msg })
  console.log(`✓ ${msg}`)
}

function fail(msg) {
  failed = true
  results.push({ ok: false, msg })
  console.error(`✗ ${msg}`)
}

function section(title) {
  console.log(`\n${title}`)
}

section('Environment')
if (apiUrl.startsWith('https://')) pass(`API URL is HTTPS: ${apiUrl}`)
else fail(`API URL should be HTTPS for production (got ${apiUrl})`)

if (mediaUrl.startsWith('https://')) pass(`Media URL is HTTPS: ${mediaUrl}`)
else fail(`Media URL should be HTTPS for production (got ${mediaUrl})`)

if (!allowCleartext) pass('Cleartext HTTP disabled (EXPO_PUBLIC_ALLOW_CLEARTEXT not true)')
else fail('Cleartext HTTP is enabled — disable for store builds')

section('Assets')
for (const rel of requiredAssets) {
  const abs = path.join(root, rel)
  if (existsSync(abs)) pass(rel)
  else fail(`Missing ${rel}`)
}

section('TypeScript')
const tsc = spawnSync('npm', ['run', 'typecheck'], {
  cwd: root,
  shell: true,
  stdio: 'pipe',
  encoding: 'utf8',
})
if (tsc.status === 0) pass('tsc --noEmit')
else {
  fail('TypeScript check failed')
  if (tsc.stdout) console.error(tsc.stdout.slice(-2000))
  if (tsc.stderr) console.error(tsc.stderr.slice(-2000))
}

section('Production API')
try {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/brands`, {
    signal: AbortSignal.timeout(60_000),
  })
  if (res.ok) {
    const data = await res.json()
    const count = Array.isArray(data) ? data.length : 0
    pass(`GET /api/brands → ${res.status} (${count} brands)`)
  } else {
    fail(`GET /api/brands → ${res.status}`)
  }
} catch (e) {
  fail(`API unreachable: ${e instanceof Error ? e.message : String(e)}`)
}

try {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/posts?page=1`, {
    signal: AbortSignal.timeout(60_000),
  })
  if (res.status === 401) pass('GET /api/posts → 401 (auth required, server alive)')
  else if (res.ok) pass(`GET /api/posts → ${res.status}`)
  else fail(`GET /api/posts → ${res.status}`)
} catch (e) {
  fail(`Posts endpoint unreachable: ${e instanceof Error ? e.message : String(e)}`)
}

section('Expo config (production env)')
const expo = spawnSync(
  'npx',
  ['expo', 'config', '--type', 'public', '--json'],
  {
    cwd: root,
    shell: true,
    stdio: 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      EXPO_PUBLIC_API_URL: apiUrl,
      EXPO_PUBLIC_MEDIA_URL: mediaUrl,
      EXPO_PUBLIC_ALLOW_CLEARTEXT: '',
    },
  },
)
if (expo.status === 0) {
  const json = JSON.parse(expo.stdout)
  if (json.ios?.bundleIdentifier === 'com.babypatterns.app') pass('iOS bundle ID: com.babypatterns.app')
  else fail(`Unexpected iOS bundle ID: ${json.ios?.bundleIdentifier}`)
  if (json.android?.package === 'com.babypatterns.app') pass('Android package: com.babypatterns.app')
  else fail(`Unexpected Android package: ${json.android?.package}`)
  if (!json.android?.usesCleartextTraffic) pass('Android usesCleartextTraffic: false/undefined')
  else fail('Android usesCleartextTraffic should be off for production')
} else {
  fail('expo config failed')
  if (expo.stderr) console.error(expo.stderr.slice(-1500))
}

console.log('\n---')
if (failed) {
  console.error('Production checks FAILED')
  process.exit(1)
}
console.log('Production checks PASSED')
process.exit(0)
