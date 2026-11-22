import { useState } from 'react'
import { Sheet, Field, NumInput, Segmented, Toggle } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { ACTIVITY, GOALS, kcalFromMacros, suggestTargets } from '../../lib/nutrition.ts'
import { latestWeight } from '../../lib/body.ts'
import { fmt } from '../../lib/format.ts'
import type { Activity, Goal, MacroTargets, Profile, Targets } from '../../lib/types.ts'

export function ProfileFields({ value, onChange }: { value: Profile; onChange: (p: Profile) => void }) {
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
      <Field label="Activité">
        <div className="stack" style={{ gap: 8 }}>
          {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
            <button key={a} className={`choice ${value.activity === a ? 'active' : ''}`} onClick={() => set('activity', a)}>
              <span className="radio" />
              <span className="grow">
                <b>{ACTIVITY[a].label}</b> <span className="muted small">· {ACTIVITY[a].hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Field>
    </div>
  )
}

export function ProfileEditor() {
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const [draft, setDraft] = useState(profile)
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
      <ProfileFields value={draft} onChange={setDraft} />
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

export function TargetsEditor() {
  const targets = useStore((s) => s.targets)
  const setTargets = useStore((s) => s.setTargets)
  const profile = useStore((s) => s.profile)
  const weighins = useStore((s) => s.weighins)
  const [draft, setDraft] = useState<Targets>(targets)
  const weight = latestWeight(weighins)?.kg ?? null

  return (
    <Sheet
      title="Mes objectifs"
      footer={
        <button
          className="btn block"
          onClick={() => {
            setTargets(draft)
            ui.pop()
            ui.toast('Objectifs enregistrés', 'ok')
          }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="stack">
        <div className="callout">Ton coach te donne tes macros ? Saisis-les telles quelles. Sinon, utilise le calcul automatique comme point de départ.</div>
        <button
          className="btn soft block"
          disabled={!weight}
          onClick={() => {
            if (!weight) return
            setDraft({ ...draft, base: suggestTargets(profile, weight) })
            ui.toast('Objectifs calculés', 'ok')
          }}
        >
          <Icon name="bolt" size={18} /> Calculer depuis mon profil {weight ? `(${String(weight).replace('.', ',')} kg)` : '(pèse-toi d’abord)'}
        </button>
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
