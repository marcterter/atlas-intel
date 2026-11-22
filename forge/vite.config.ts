import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** Publie apps-script/Code.gs à côté de l'app (bouton « Copier le script » du guide). */
function sheetScript(): Plugin {
  const file = new URL('./apps-script/Code.gs', import.meta.url)
  const name = 'forge-sheet-script.txt'
  return {
    name: 'forge-sheet-script',
    configureServer(server) {
      server.middlewares.use(`/${name}`, (_req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(readFileSync(file, 'utf8'))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: name, source: readFileSync(file, 'utf8') })
    },
  }
}

// Forge — PWA installable sur iPhone (Safari > Partager > Sur l'écran d'accueil)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    sheetScript(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Forge — Séances, diète, pas',
        short_name: 'Forge',
        description: 'Suivi de séances, calories & macros, pas et bilans — synchronisé avec le sheet du coach.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0b0c',
        theme_color: '#0b0b0c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm,txt}'],
        globIgnores: ['**/*cyrillic*', '**/*vietnamese*'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
