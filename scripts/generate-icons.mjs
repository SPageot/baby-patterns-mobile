/**
 * Generates iOS/Android app icons from the website moon-cloud brand SVG.
 * Run: node scripts/generate-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(
  root,
  '..',
  '..',
  'client',
  'baby_patterns',
  'baby-patterns',
  'public',
  'icons',
  'logo-moon-cloud.svg',
)
const outDir = path.join(root, 'assets', 'images')

const BG_TOP = '#F8F4FF'
const BG_BOTTOM = '#EDE6FA'

async function writePng(buffer, name) {
  const file = path.join(outDir, name)
  await sharp(buffer).png().toFile(file)
  console.log('wrote', name)
}

async function main() {
  if (!fs.existsSync(svgPath)) {
    throw new Error(`Brand SVG not found: ${svgPath}`)
  }
  fs.mkdirSync(outDir, { recursive: true })

  const svg = fs.readFileSync(svgPath)

  // iOS / store icon (1024×1024)
  await writePng(await sharp(svg).resize(1024, 1024).png().toBuffer(), 'icon.png')

  // Android adaptive foreground — logo centered in safe zone on transparent canvas
  const fgSize = 672
  const pad = Math.round((1024 - fgSize) / 2)
  const foreground = await sharp(svg)
    .resize(fgSize, fgSize)
    .png()
    .toBuffer()
  await writePng(
    await sharp({
      create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: foreground, top: pad, left: pad }])
      .png()
      .toBuffer(),
    'android-icon-foreground.png',
  )

  // Android adaptive background — brand lavender gradient (top → bottom)
  await writePng(
    await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: BG_BOTTOM },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 1024, height: 512, channels: 4, background: BG_TOP },
          })
            .png()
            .toBuffer(),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer(),
    'android-icon-background.png',
  )

  // Android 13+ monochrome — desaturated high-contrast silhouette
  await writePng(
    await sharp(svg)
      .resize(672, 672)
      .greyscale()
      .threshold(140)
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
    'android-icon-monochrome.png',
  )

  // Splash center mark (legacy / notifications)
  await writePng(await sharp(svg).resize(200, 200).png().toBuffer(), 'splash-icon.png')

  // Full-screen native splash (portrait)
  const splashW = 1284
  const splashH = 2778
  const logoSize = 300
  const logoPng = await sharp(svg).resize(logoSize, logoSize).png().toBuffer()
  const logoB64 = logoPng.toString('base64')
  const logoX = (splashW - logoSize) / 2
  const logoY = splashH * 0.36 - logoSize / 2
  const titleY = logoY + logoSize + 72
  const taglineY = titleY + 44

  const splashSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${splashW}" height="${splashH}" viewBox="0 0 ${splashW} ${splashH}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="100%" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="${splashW}" height="${splashH}" fill="url(#bg)"/>
  <image href="data:image/png;base64,${logoB64}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/>
  <text x="50%" y="${titleY}" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="46" font-weight="700" fill="#2f2a38" letter-spacing="-0.6">Baby Patterns</text>
  <text x="50%" y="${taglineY}" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#6b6578">Track · Understand · Thrive</text>
</svg>`)

  await writePng(await sharp(splashSvg).png().toBuffer(), 'splash.png')

  // Dark mode splash
  const darkSplashSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${splashW}" height="${splashH}" viewBox="0 0 ${splashW} ${splashH}">
  <rect width="${splashW}" height="${splashH}" fill="#0a0c10"/>
  <image href="data:image/png;base64,${logoB64}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/>
  <text x="50%" y="${titleY}" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="46" font-weight="700" fill="rgba(255,255,255,0.92)" letter-spacing="-0.6">Baby Patterns</text>
  <text x="50%" y="${taglineY}" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="rgba(255,255,255,0.52)">Track · Understand · Thrive</text>
</svg>`)
  await writePng(await sharp(darkSplashSvg).png().toBuffer(), 'splash-dark.png')

  // Web favicon
  await writePng(await sharp(svg).resize(48, 48).png().toBuffer(), 'favicon.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
