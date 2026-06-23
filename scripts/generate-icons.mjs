/**
 * Generates iOS/Android app icons from the brand icon source PNG.
 * Run: node scripts/generate-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sourcePath = path.join(
  root,
  '..',
  '..',
  'client',
  'baby_patterns',
  'baby-patterns',
  'assets',
  'icon-source.png',
)
const outDir = path.join(root, 'assets', 'images')

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

async function writePng(buffer, name) {
  const file = path.join(outDir, name)
  await sharp(buffer).png().toFile(file)
  console.log('wrote', name)
}

function squareFromSource(size) {
  return sharp(sourcePath).resize(size, size, {
    fit: 'contain',
    background: WHITE,
    position: 'centre',
  })
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Brand icon not found: ${sourcePath}`)
  }
  fs.mkdirSync(outDir, { recursive: true })

  await writePng(await squareFromSource(1024).png().toBuffer(), 'icon.png')

  const fgSize = 820
  const pad = Math.round((1024 - fgSize) / 2)
  const foreground = await squareFromSource(fgSize).png().toBuffer()
  await writePng(
    await sharp({
      create: { width: 1024, height: 1024, channels: 4, background: WHITE },
    })
      .composite([{ input: foreground, top: pad, left: pad }])
      .png()
      .toBuffer(),
    'android-icon-foreground.png',
  )

  await writePng(
    await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer(),
    'android-icon-background.png',
  )

  await writePng(
    await squareFromSource(672)
      .greyscale()
      .normalize()
      .threshold(80)
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer(),
    'android-icon-monochrome.png',
  )

  // Centered logo for native splash — white fills the rest via backgroundColor in app.config.
  await writePng(await squareFromSource(512).png().toBuffer(), 'splash-icon.png')
  await writePng(await squareFromSource(48).png().toBuffer(), 'favicon.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
