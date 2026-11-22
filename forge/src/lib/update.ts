// Mises à jour de l'app installée. iOS garde l'app en mémoire des jours entiers sans la relancer :
// on cherche une nouvelle version à chaque retour dans l'app (et toutes les heures), pas seulement au démarrage.
let registration: ServiceWorkerRegistration | undefined

export function watchUpdates(reg: ServiceWorkerRegistration | undefined): void {
  registration = reg
  if (!reg) return
  const check = () => {
    if (document.visibilityState === 'visible') void reg.update().catch(() => {})
  }
  document.addEventListener('visibilitychange', check)
  setInterval(check, 60 * 60 * 1000)
}

/** Bouton « Rechercher une mise à jour » : s'il y en a une, l'app se recharge toute seule une fois installée. */
export async function checkForUpdate(): Promise<'nouvelle' | 'a-jour' | 'indisponible'> {
  const reg = registration ?? (await navigator.serviceWorker?.getRegistration().catch(() => undefined))
  if (!reg) return 'indisponible'
  try {
    await reg.update()
  } catch {
    return 'indisponible'
  }
  return reg.installing || reg.waiting ? 'nouvelle' : 'a-jour'
}
