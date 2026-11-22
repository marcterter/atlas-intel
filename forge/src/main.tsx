import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/oswald'
import './styles.css'
import { App } from './App.tsx'
import { hydrate } from './store/store.ts'

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void hydrate()

// Service worker : l'app fonctionne hors connexion (salle de sport sans réseau).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  Promise.all([import('virtual:pwa-register'), import('./lib/update.ts')])
    .then(([{ registerSW }, { watchUpdates }]) => registerSW({ immediate: true, onRegisteredSW: (_url, reg) => watchUpdates(reg) }))
    .catch(() => {
      /* contexte sans service worker (aperçu, navigation privée) */
    })
}
