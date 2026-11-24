// Objectif fibres en un geste, depuis la barre « Fibres » de Diète (aussi dans Profil → Objectifs du jour).
import { promptNumber } from '../../components/ui.tsx'
import { fiberReference } from '../../lib/nutrition.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'

export async function editFiberGoal() {
  const { targets } = useStore.getState()
  const v = await promptNumber({
    title: 'Objectif fibres',
    hint: `Par jour, le même en jour ON et OFF. Repère : au moins 30 g, ou 14 g pour 1 000 kcal (≈ ${fiberReference(targets.base.kcal)} g pour toi).`,
    initial: targets.fiber || null,
    suffix: 'g',
    decimal: false,
  })
  if (v === undefined) return
  const fiber = v == null ? 0 : Math.max(0, Math.round(v))
  const s = useStore.getState()
  s.setTargets({ ...s.targets, fiber })
  ui.toast(fiber ? `Objectif fibres : ${fiber} g par jour` : 'Objectif fibres retiré', 'ok')
}
