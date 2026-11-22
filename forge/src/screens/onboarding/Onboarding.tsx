import { useMemo, useState } from 'react'
import { Field, NumInput, Toggle } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { ProfileFields } from '../profile/ProfileForms.tsx'
import { useStore } from '../../store/store.ts'
import { kcalFromMacros, suggestTargets, tdee } from '../../lib/nutrition.ts'
import { goalPlans } from '../../lib/energy.ts'
import { fmt } from '../../lib/format.ts'
import type { MacroTargets, Profile } from '../../lib/types.ts'

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding)
  const initial = useStore((s) => s.profile)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Profile>(initial)
  const [weight, setWeight] = useState<number | null>(null)
  const [coachMacros, setCoachMacros] = useState(false)
  const suggested = useMemo(() => suggestTargets(profile, weight ?? 75), [profile, weight])
  const plans = useMemo(() => goalPlans(tdee(profile, weight ?? 75), weight ?? 75), [profile, weight])
  const [manual, setManual] = useState<MacroTargets | null>(null)
  const [steps, setSteps] = useState<number | null>(10000)
  const [templates, setTemplates] = useState(false)
  const macros = coachMacros ? (manual ?? suggested) : suggested

  const finish = () => {
    complete(profile, { base: macros, rest: null, steps: steps ?? 10000, fiber: 30 }, weight, templates)
  }

  return (
    <div className="onboarding">
      {step === 0 && (
        <div className="stack grow" style={{ justifyContent: 'center', gap: 22 }}>
          <img src="./icon-192.png" alt="" style={{ width: 84, height: 84, borderRadius: 22 }} />
          <h1 className="display" style={{ fontSize: 52, margin: 0 }}>
            Forge
          </h1>
          <div style={{ fontSize: 19, color: 'var(--text-2)', lineHeight: 1.45 }}>
            Tes séances, ta diète et tes pas au même endroit.
            <br />
            <span style={{ color: 'var(--text)' }}>Et le sheet de ton coach se remplit tout seul.</span>
          </div>
          <div className="stack" style={{ gap: 10, marginTop: 6 }}>
            {[
              ['dumbbell', 'Tes perfs de la dernière fois sur chaque série, chrono de repos, records'],
              ['food', 'Calories et macros restantes, recherche et scan des produits'],
              ['steps', 'Tes pas de l’iPhone, à côté de tes calories'],
              ['scale', 'Pesées, moyenne de la semaine, mensurations et photos'],
            ].map(([icon, text]) => (
              <div className="row" key={icon} style={{ alignItems: 'flex-start' }}>
                <div className="icon-tile" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <Icon name={icon} size={18} />
                </div>
                <div className="muted" style={{ paddingTop: 6 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
          <button className="btn block" style={{ marginTop: 10 }} onClick={() => setStep(1)}>
            Commencer
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="stack">
          <div className="faint small bold">ÉTAPE 1 / 2</div>
          <h1 className="display" style={{ fontSize: 34, margin: 0 }}>
            Ton profil
          </h1>
          <div className="muted">Pour calculer un point de départ. Tout reste modifiable.</div>
          <ProfileFields value={profile} onChange={setProfile} />
          <Field label="Poids actuel">
            <NumInput value={weight} onChange={setWeight} suffix="kg" placeholder="ex : 78,5" />
          </Field>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn soft" onClick={() => setStep(0)}>
              Retour
            </button>
            <button className="btn grow" onClick={() => setStep(2)}>
              Continuer
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <div className="faint small bold">ÉTAPE 2 / 2</div>
          <h1 className="display" style={{ fontSize: 34, margin: 0 }}>
            Tes objectifs
          </h1>
          <div className="row-between card tight">
            <div>
              <div className="bold">Mon coach me donne mes macros</div>
              <div className="faint small">Saisis-les telles quelles</div>
            </div>
            <Toggle
              on={coachMacros}
              onChange={(v) => {
                setCoachMacros(v)
                if (v && !manual) setManual(suggested)
              }}
              label="Macros du coach"
            />
          </div>
          {coachMacros ? (
            <div className="grid-2">
              {(
                [
                  ['kcal', 'Calories', 'kcal'],
                  ['protein', 'Protéines', 'g'],
                  ['carbs', 'Glucides', 'g'],
                  ['fat', 'Lipides', 'g'],
                ] as [keyof MacroTargets, string, string][]
              ).map(([k, label, unit]) => (
                <Field key={k} label={label}>
                  <NumInput value={macros[k]} decimal={false} suffix={unit} onChange={(v) => setManual({ ...macros, [k]: Math.round(v ?? 0) })} />
                </Field>
              ))}
              <div className="faint small" style={{ gridColumn: '1 / -1' }}>
                Les macros font {fmt(kcalFromMacros(macros))} kcal.
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="tiny faint bold">POINT DE DÉPART CALCULÉ</div>
              <div className="big-number" style={{ marginTop: 4 }}>
                {fmt(macros.kcal)} <span className="small faint">kcal / jour</span>
              </div>
              <div className="row" style={{ gap: 14, marginTop: 8 }}>
                <span>
                  <b style={{ color: 'var(--protein)' }}>P</b> {macros.protein} g
                </span>
                <span>
                  <b style={{ color: 'var(--carbs)' }}>G</b> {macros.carbs} g
                </span>
                <span>
                  <b style={{ color: 'var(--fat)' }}>L</b> {macros.fat} g
                </span>
              </div>
              <div className="tiny faint" style={{ marginTop: 10 }}>
                {plans.map((p) => `${p.label} ${fmt(p.targets.kcal)}`).join(' · ')} kcal. Tu pourras changer d’objectif dans Profil → Objectifs du jour.
              </div>
              {!weight && <div className="faint small" style={{ marginTop: 8 }}>Calculé pour 75 kg : indique ton poids à l’étape précédente pour affiner.</div>}
            </div>
          )}
          <Field label="Objectif de pas par jour">
            <NumInput value={steps} decimal={false} onChange={setSteps} suffix="pas" />
          </Field>
          <div className="row-between card tight">
            <div>
              <div className="bold">Séances d’exemple</div>
              <div className="faint small">Push / Pull / Legs. Inutile si tu importes le programme de ton coach (Profil → Google Sheets)</div>
            </div>
            <Toggle on={templates} onChange={setTemplates} label="Séances d'exemple" />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn soft" onClick={() => setStep(1)}>
              Retour
            </button>
            <button className="btn grow" onClick={finish}>
              C’est parti
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
