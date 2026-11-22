import { useMemo, useState } from 'react'
import { Sheet, Field, NumInput, Segmented, Stepper, Toggle } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { GOALS, editMacro, kcalFromMacros } from '../../lib/nutrition.ts'
import { activityLevel, activityText, defaultOff, estimateEnergy, goalPlans, measureTdee, MEASURE_NEEDS, splitOnOff } from '../../lib/energy.ts'
import { latestWeight } from '../../lib/body.ts'
import { formatShort, todayISO } from '../../lib/date.ts'
import { plannedWeekdays } from '../../store/selectors.ts'
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

/** Calories et macros liées (voir editMacro) : une macro change les kcal, les kcal changent les glucides. */
function MacroFields({ value, onChange }: { value: MacroTargets; onChange: (m: MacroTargets) => void }) {
  const fromMacros = kcalFromMacros(value)
  const diff = value.kcal - fromMacros
  const field = (key: keyof MacroTargets, label: string, suffix: string) => (
    <Field label={label}>
      <NumInput value={value[key]} decimal={false} suffix={suffix} onChange={(v) => onChange(editMacro(value, key, v))} />
    </Field>
  )
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="grid-2">
        {field('kcal', 'Calories', 'kcal')}
        {field('protein', 'Protéines', 'g')}
        {field('carbs', 'Glucides', 'g')}
        {field('fat', 'Lipides', 'g')}
      </div>
      {Math.abs(diff) > 5 ? (
        // Objectifs enregistrés avant (ou kcal sous le minimum des protéines + lipides) : on propose de recoller.
        <div className="row-between small" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--warn)' }}>
            Macros = {fmt(fromMacros)} kcal (écart {diff > 0 ? '+' : ''}
            {fmt(diff)})
          </span>
          <span className="row" style={{ gap: 12 }}>
            {value.kcal - value.protein * 4 - value.fat * 9 >= 0 && (
              <button className="link-btn" onClick={() => onChange(editMacro(value, 'kcal', value.kcal))}>
                Ajuster les glucides
              </button>
            )}
            <button className="link-btn" onClick={() => onChange({ ...value, kcal: fromMacros })}>
              Kcal = macros
            </button>
          </span>
        </div>
      ) : (
        <div className="faint tiny">Change une macro : les kcal suivent. Change les kcal : les glucides s’ajustent, protéines et lipides gardés.</div>
      )}
    </div>
  )
}

/**
 * Calculateur : dépense estimée (formule) ou mesurée (apports + courbe de poids), puis sèche,
 * maintien et prise de masse côte à côte.
 */
function Calculator({ goal, split, onUse }: { goal: Goal; split: boolean; onUse: (on: MacroTargets, off: MacroTargets | null, goal: Goal) => void }) {
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
  // Avec Jour ON / OFF : même moyenne sur la semaine, plus de glucides les jours de séance.
  const sessionsPerWeek = level.sessions ?? 4
  const plans = goalPlans(tdee, weight).map((p) => ({ ...p, split: split ? splitOnOff(p.targets, sessionsPerWeek) : null }))
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
              {p.split ? (
                <div className="tiny faint">
                  <div>
                    <b className="on-tag">ON</b> {fmt(p.split.on.kcal)} · P {p.split.on.protein} · G {p.split.on.carbs} · L {p.split.on.fat}
                  </div>
                  <div>
                    <b className="off-tag">OFF</b> {fmt(p.split.off.kcal)} · P {p.split.off.protein} · G {p.split.off.carbs} · L {p.split.off.fat}
                  </div>
                  <div>{p.goal === 'maintien' ? 'poids stable' : `${fmtSigned(p.kgPerWeek, 2)} kg/sem`}</div>
                </div>
              ) : (
                <div className="tiny faint">
                  P {p.targets.protein} · G {p.targets.carbs} · L {p.targets.fat} · {p.goal === 'maintien' ? 'poids stable' : `${fmtSigned(p.kgPerWeek, 2)} kg/sem`}
                </div>
              )}
            </div>
            <button className="btn soft small" onClick={() => (p.split ? onUse(p.split.on, p.split.off, p.goal) : onUse(p.targets, null, p.goal))}>
              Utiliser
            </button>
          </div>
        ))}
      </div>
      {split && (
        <div className="tiny faint">
          Moyenne de la semaine répartie sur {fmt(sessionsPerWeek)} jour{sessionsPerWeek > 1 ? 's' : ''} ON : mêmes protéines et lipides, plus de glucides les jours de séance.
        </div>
      )}
      {!measured.ok && (
        <div className="tiny faint">
          Dépense réelle mesurée après ~2-3 semaines de suivi : {Math.min(measured.progress.foodDays, MEASURE_NEEDS.foodDays)}/{MEASURE_NEEDS.foodDays} journées de diète complètes,{' '}
          {Math.min(measured.progress.weighins, MEASURE_NEEDS.weighins)}/{MEASURE_NEEDS.weighins} pesées sur {MEASURE_NEEDS.spanDays} jours.
        </div>
      )}
    </div>
  )
}

/** Derniers bilans du lundi : poids moyen, variation, ajustement appliqué ou non. */
function ReviewHistory() {
  const reviews = useStore((s) => s.reviews)
  const list = Object.entries(reviews)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
  if (!list.length) return null
  const label = { applied: 'appliqué', kept: 'gardé mes macros', seen: 'vu' } as const
  return (
    <>
      <div className="section-label">Bilans du lundi</div>
      <div className="card flush list">
        {list.map(([monday, r]) => (
          <div className="list-item" key={monday} style={{ minHeight: 0, padding: '10px 16px' }}>
            <div className="grow">
              <div className="small bold">{formatShort(monday)}</div>
              <div className="tiny faint">
                {r.avg != null ? `${fmtKg(Math.round(r.avg * 10) / 10)} kg` : 'pas assez de pesées'}
                {r.deltaKg != null ? ` (${fmtSigned(r.deltaKg, 1)})` : ''}
              </div>
            </div>
            <div className="small num" style={{ textAlign: 'right' }}>
              {r.deltaKcal ? `${r.deltaKcal > 0 ? '+' : '−'}${fmt(Math.abs(r.deltaKcal))} kcal` : 'on garde'}
              <div className="tiny faint">{r.deltaKcal ? label[r.decision] : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/** `withOff` : ouvert depuis l'interrupteur ON / OFF, avec un Jour OFF proposé s'il n'existe pas encore. */
export function TargetsEditor({ withOff = false }: { withOff?: boolean }) {
  const targets = useStore((s) => s.targets)
  const setTargets = useStore((s) => s.setTargets)
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const [draft, setDraft] = useState<Targets>(() => (withOff && !targets.rest ? { ...targets, rest: defaultOff(targets.base) } : targets))
  const [goal, setGoal] = useState<Goal>(profile.goal)
  // Jours ON dans la semaine : ceux du programme du coach, sinon les séances indiquées dans le profil.
  const onDays = useStore((s) => Math.min(7, Math.max(1, plannedWeekdays(s.routines).size || s.profile.sessionsPerWeek || 4)))

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
        <div className="row-between card tight">
          <div>
            <div className="bold">Jour ON / Jour OFF</div>
            <div className="faint small">Objectifs différents les jours sans séance (moins de glucides). Bascule en un geste sur Aujourd’hui et Diète.</div>
          </div>
          <Toggle on={!!draft.rest} onChange={(v) => setDraft({ ...draft, rest: v ? defaultOff(draft.base) : null })} label="Jour ON / Jour OFF" />
        </div>
        <Calculator
          goal={goal}
          split={!!draft.rest}
          onUse={(on, off, g) => {
            setGoal(g)
            setDraft({ ...draft, base: on, rest: off })
            ui.toast(off ? `${GOALS[g].label} : ON ${fmt(on.kcal)} · OFF ${fmt(off.kcal)} kcal` : `${GOALS[g].label} : ${fmt(on.kcal)} kcal`, 'ok')
          }}
        />
        <div className="section-label">{draft.rest ? 'Jour ON · séance' : 'Chaque jour'}</div>
        <MacroFields value={draft.base} onChange={(base) => setDraft({ ...draft, base })} />
        {draft.rest && (
          <>
            <div className="section-label">Jour OFF · repos</div>
            <MacroFields value={draft.rest} onChange={(rest) => setDraft({ ...draft, rest })} />
            <div className="callout small">
              Moyenne de la semaine ({onDays} ON · {7 - onDays} OFF) : <b className="num">{fmt((onDays * draft.base.kcal + (7 - onDays) * draft.rest.kcal) / 7)} kcal</b> par jour
            </div>
          </>
        )}
        <ReviewHistory />
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
