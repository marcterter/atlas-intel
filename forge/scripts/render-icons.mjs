// Génère les icônes PNG de l'app à partir du logo SVG (usage : node scripts/render-icons.mjs)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFileSync, writeFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
// Version plein cadre (iOS arrondit lui-même les coins) et version "maskable" avec marge de sécurité
const full = svg.replace('rx="112"', 'rx="0"')
const maskable = full.replace('transform="translate(0 40)"', 'transform="translate(51.2 51.2) scale(0.8) translate(0 40)"')

const targets = [
  { file: 'icon-192.png', size: 192, svg: full },
  { file: 'icon-512.png', size: 512, svg: full },
  { file: 'icon-maskable-512.png', size: 512, svg: maskable },
  { file: 'apple-touch-icon.png', size: 180, svg: full },
]

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(`<html><body style="margin:0;background:#111113">${t.svg.replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`)
  const buf = await page.screenshot({ omitBackground: false, clip: { x: 0, y: 0, width: t.size, height: t.size } })
  writeFileSync(new URL(`../public/${t.file}`, import.meta.url), buf)
  console.log('wrote', t.file)
}
await browser.close()
