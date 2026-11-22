import { useMemo, useState } from 'react'
import { Sheet, Field, NumInput, Segmented, Stepper, Toggle } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { GOALS, kcalFromMacros } from '../../lib/nutrition.ts'
import { activityLevel, activityText, estimateEnergy, goalPlans, measureTdee, MEASURE_NEEDS } from '../../lib/energy.ts'
import { latestWeight } from '../../lib/body.ts'
import { todayISO } from '../../lib/date.ts'
import { fmt, fmtKg, fmtSigned } from '../../lib/format.ts'
import type { Goal, MacroTargets, Profile, Targets } from '../../lib/types.ts'

export function ProfileFields({ value, onChange, appSteps }: { value: Profile; onChange: (p: Profile) => void; appSteps?: number | null }) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onChange({ ...value, [k]: v })
  return (
    <div className="stack">
      <Field label="Prénom">
        <input className="input" value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Ton prénom" />
      </Field>
      <Field label="Sexe">
        <Segmented value={value.sex} onChange={(v) => set('sex', v)} options={[{ value: 'H', label: 'Homme' }, { value: 'F', label: 'Femme' }]} />
      </Field>
      <div className="grid-2">
        <Field label="Année de naissance">
          <NumInput value={value.birthYear} decimal={false} onChange={(v) => v && set('birthYear', Math.round(v))} />
        </Field>
        <Field label="Taille">
          <NumInput value={value.heightCm} decimal={false} suffix="cm" onChange={(v) => v && set('heightCm', Math.round(v))} />
        </Field>
      </div>
      <Field label="Objectif">
        <div className="stack" style={{ gap: 8 }}>
          {(Object.keys(GOALS) as Goal[]).map((g) => (
            <button key={g} className={`choice ${value.goal === g ? 'active' : ''}`} onClick={() => set('goal', g)}>
              <span className="radio" />
              <span className="grow">
                <b>{GOALS[g].label}</b> <span className="muted small">· {GOALS[g].hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Field>
      <div className="grid-2">
        <Field label="Pas par jour" hint={appSteps ? `Ta moyenne dans l’app (14 j) : ${fmt(appSteps)}, utilisée d’office` : 'Ta moyenne : app Santé → Pas → onglet M'}>
          <NumInput value={value.stepsPerDay ?? null} decimal={false} placeholder="ex : 12 000" suffix="pas" onChange={(v) => set('stepsPerDay', v ? Math.round(v) : null)} />
        </Field>
        {/* Pas de <label> ici : un clic sur le titre déclencherait le bouton « − ». */}
        <div className="field">
          <span>Séances / semaine</span>
          <Stepper value={value.sessionsPerWeek ?? 0} min={0} max={14} onChange={(v) => set('sessionsPerWeek', v)} />
        </div>
      </div>
      <div className="faint small">Tes pas et tes séances donnent une première estimation de ta dépense. Après 2 à 3 semaines de pesées et de diète, l’app la mesure pour de vrai (utile si ton métabolisme est rapide).</div>
    </div>
  )
}

export function ProfileEditor() {
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const steps = useStore((s) => s.steps)
  const routines = useStore((s) => s.routines)
  const sessions = useStore((s) => s.sessions)
  const [draft, setDraft] = useState(profile)
  const level = useMemo(() => activityLevel(draft, steps, routines, todayISO(), sessions), [draft, steps, routines, sessions])
  return (
    <Sheet
      title="Mon profil"
      footer={
        <button
          className="btn block"
          onClick={() => {
            updateProfile(draft)
            ui.pop()
            ui.toast('Profil enregistré', 'ok')
          }}
        >
          Enregistrer
        </button>
      }
    >
      <ProfileFields value={draft} onChange={setDraft} appSteps={level.stepsFrom === 'app' ? level.steps : null} />
    </Sheet>
  )
}

function MacroFields({ value, onChange }: { value: MacroTargets; onChange: (m: MacroTargets) => void }) {
  const fromMacros = kcalFromMacros(value)
  const diff = value.kcal - fromMacros
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="grid-2">
        <Field label="Calories">
          <NumInput value={value.kcal} decimal={false} suffix="kcal" onChange={(v) => onChange({ ...value, kcal: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Protéines">
          <NumInput value={value.protein} decimal={false} suffix="g" onChange={(v) => onChange({ ...value, protein: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Glucides">
          <NumInput value={value.carbs} decimal={false} suffix="g" onChange={(v) => onChange({ ...value, carbs: Math.round(v ?? 0) })} />
        </Field>
        <Field label="Lipides">
          <NumInput value={value.fat} decimal={false} suffix="g" onChange={(v) => onChange({ ...value, fat: Math.round(v ?? 0) })} />
        </Field>
      </div>
      <div className="row-between small">
        <span className="muted">
          Macros = <b className="num">{fmt(fromMacros)} kcal</b>
          {Math.abs(diff) > 40 && <span style={{ color: 'var(--warn)' }}> (écart {diff > 0 ? '+' : ''}{fmt(diff)})</span>}
        </span>
        {Math.abs(diff) > 0 && (
          <button className="link-btn" onClick={() => onChange({ ...value, kcal: fromMacros })}>
            Aligner les kcal
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Calculateur : dépense estimée (formule) ou mesurée (apports + courbe de poids), puis sèche,
 * maintien et prise de masse côte à côte.
 */
function Calculator({ goal, onUse }: { goal: Goal; onUse: (t: MacroTargets, goal: Goal) => void }) {
  const profile = useStore((s) => s.profile)
  const weighins = useStore((s) => s.weighins)
  const steps = useStore((s) => s.steps)
  const routines = useStore((s) => s.routines)
  const entries = useStore((s) => s.entries)
  const sessions = useStore((s) => s.sessions)
  const today = todayISO()
  const weight = latestWeight(weighins)?.kg ?? null
  const level = useMemo(() => activityLevel(profile, steps, routines, today, sessions), [profile, steps, routines, today, sessions])
  const measured = useMemo(() => measureTdee(entries, weighins, today), [entries, weighins, today])
  const [basis, setBasis] = useState<'mesure' | 'formule'>(measured.ok ? 'mesure' : 'formule')
  if (!weight) return <div className="callout">Pèse-toi d’abord (Aujourd’hui → Poids) : le calcul part de ton poids.</div>
  const est = estimateEnergy(profile, weight, level)
  const useMeasured = basis === 'mesure' && measured.ok
  const tdee = useMeasured ? measured.value.tdee : est.tdee
  const plans = goalPlans(tdee, weight)
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row-between">
        <div className="card-title">Calculateur</div>
        <span className="small faint num">{fmtKg(weight)} kg</span>
      </div>
      {measured.ok && (
        <Segmented
          value={basis}
          onChange={setBasis}
          options={[
            { value: 'mesure', label: `Mesurée · ${fmt(measured.value.tdee)}` },
            { value: 'formule', label: `Formule · ${fmt(est.tdee)}` },
          ]}
        />
      )}
      <div className="small muted">
        {useMeasured ? (
          <>
            Ta dépense réelle : <b>{fmt(measured.value.tdee)} kcal/j</b>. Sur {measured.value.spanDays} jours, tu as mangé {fmt(measured.value.intake)} kcal en moyenne et ton poids a{' '}
            {Math.abs(measured.value.kgPerWeek) < 0.05 ? 'peu bougé' : `${measured.value.kgPerWeek < 0 ? 'baissé' : 'monté'} de ${fmt(Math.abs(measured.value.kgPerWeek), 2)} kg/sem`}. Fiabilité {measured.value.confidence}.
          </>
        ) : (
          <>
            Dépense estimée : <b>{fmt(est.tdee)} kcal/j</b> = métabolisme de base {fmt(est.bmr)} × {String(est.factor).replace('.', ',')} ({activityText(level, profile)}).
          </>
        )}
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {plans.map((p) => (
          <div key={p.goal} className={`plan-row ${goal === p.goal ? 'current' : ''}`}>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}>
                <b>{p.label}</b>
                <span className="num bold">{fmt(p.targets.kcal)} kcal</span>
              </div>
              <div className="tiny faint">
                P {p.targets.protein} · G {p.targets.carbs} · L {p.targets.fat} · {p.goal === 'maintien' ? 'poids stable' : `${fmtSigned(p.kgPerWeek, 2)} kg/sem`}
              </div>
            </div>
            <button className="btn soft small" onClick={() => onUse(p.targets, p.goal)}>
              Utiliser
            </button>
          </div>
        ))}
      </div>
      {!measured.ok && (
        <div className="tiny faint">
          Dépense réelle mesurée après ~2-3 semaines de suivi : {Math.min(measured.progress.foodDays, MEASURE_NEEDS.foodDays)}/{MEASURE_NEEDS.foodDays} journées de diète complètes,{' '}
          {Math.min(measured.progress.weighins, MEASURE_NEEDS.weighins)}/{MEASURE_NEEDS.weighins} pesées sur {MEASURE_NEEDS.spanDays} jours.
        </div>
      )}
    </div>
  )
}

export function TargetsEditor() {
  const targets = useStore((s) => s.targets)
  const setTargets = useStore((s) => s.setTargets)
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const [draft, setDraft] = useState<Targets>(targets)
  const [goal, setGoal] = useState<Goal>(profile.goal)

  return (
    <Sheet
      title="Mes objectifs"
      footer={
        <button
          className="btn block"
          onClick={() => {
            setTargets(draft)
            if (goal !== profile.goal) updateProfile({ goal })
            ui.pop()
            ui.toast('Objectifs enregistrés', 'ok')
          }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="stack">
        <div className="callout">Ton coach te donne tes macros ? Saisis-les telles quelles. Sinon, pars du calculateur.</div>
        <Calculator
          goal={goal}
          onUse={(t, g) => {
            setGoal(g)
            setDraft({ ...draft, base: t, rest: null })
            ui.toast(draft.rest ? `${GOALS[g].label} : mêmes objectifs tous les jours` : `${GOALS[g].label} : ${fmt(t.kcal)} kcal`, 'ok')
          }}
        />
        <div className="section-label">{draft.rest ? 'Jour d’entraînement' : 'Chaque jour'}</div>
        <MacroFields value={draft.base} onChange={(base) => setDraft({ ...draft, base })} />
        <div className="row-between card tight">
          <div>
            <div className="bold">Objectifs différents les jours de repos</div>
            <div className="faint small">Ex : moins de glucides sans séance</div>
          </div>
          <Toggle on={!!draft.rest} onChange={(v) => setDraft({ ...draft, rest: v ? { ...draft.base } : null })} label="Jour de repos" />
        </div>
        {draft.rest && (
          <>
            <div className="section-label">Jour de repos</div>
            <MacroFields value={draft.rest} onChange={(rest) => setDraft({ ...draft, rest })} />
          </>
        )}
        <div className="section-label">Autres objectifs</div>
        <div className="grid-2">
          <Field label="Pas par jour">
            <NumInput value={draft.steps} decimal={false} onChange={(v) => setDraft({ ...draft, steps: Math.round(v ?? 0) })} />
          </Field>
          <Field label="Fibres">
            <NumInput value={draft.fiber} decimal={false} suffix="g" onChange={(v) => setDraft({ ...draft, fiber: Math.round(v ?? 0) })} />
          </Field>
        </div>
      </div>
    </Sheet>
  )
}
