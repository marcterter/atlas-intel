import type { Equipment, Exercise, ExerciseKind, Muscle } from '../lib/types.ts'

export const MUSCLE_LABEL: Record<Muscle, string> = {
  pectoraux: 'Pectoraux',
  dos: 'Dos',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  avant_bras: 'Avant-bras',
  trapezes: 'Trapèzes',
  abdos: 'Abdos',
  lombaires: 'Lombaires',
  quadriceps: 'Quadriceps',
  ischios: 'Ischios',
  fessiers: 'Fessiers',
  adducteurs: 'Adducteurs',
  mollets: 'Mollets',
  cardio: 'Cardio',
}

export const MUSCLE_ORDER: Muscle[] = [
  'pectoraux',
  'dos',
  'epaules',
  'biceps',
  'triceps',
  'quadriceps',
  'ischios',
  'fessiers',
  'adducteurs',
  'mollets',
  'abdos',
  'lombaires',
  'trapezes',
  'avant_bras',
  'cardio',
]

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barre: 'Barre',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
  poids_du_corps: 'Poids du corps',
  kettlebell: 'Kettlebell',
  smith: 'Smith machine',
  cardio: 'Cardio',
  autre: 'Autre',
}

type Row = [id: string, name: string, muscle: Muscle, equipment: Equipment, kind?: ExerciseKind]

const ROWS: Row[] = [
  // Pectoraux
  ['dc-barre', 'Développé couché barre', 'pectoraux', 'barre'],
  ['dc-halteres', 'Développé couché haltères', 'pectoraux', 'halteres'],
  ['di-barre', 'Développé incliné barre', 'pectoraux', 'barre'],
  ['di-halteres', 'Développé incliné haltères', 'pectoraux', 'halteres'],
  ['dd-barre', 'Développé décliné barre', 'pectoraux', 'barre'],
  ['di-smith', 'Développé incliné Smith', 'pectoraux', 'smith'],
  ['chest-press', 'Chest press machine', 'pectoraux', 'machine'],
  ['di-machine', 'Développé incliné machine', 'pectoraux', 'machine'],
  ['ecarte-halteres', 'Écarté haltères', 'pectoraux', 'halteres'],
  ['ecarte-poulie', 'Écarté poulie vis-à-vis', 'pectoraux', 'poulie'],
  ['ecarte-poulie-basse', 'Écarté poulie basse', 'pectoraux', 'poulie'],
  ['pec-deck', 'Pec deck (butterfly)', 'pectoraux', 'machine'],
  ['pompes', 'Pompes', 'pectoraux', 'poids_du_corps', 'bodyweight'],
  ['dips-pecs', 'Dips buste penché', 'pectoraux', 'poids_du_corps', 'bodyweight'],
  // Dos
  ['tractions', 'Tractions pronation', 'dos', 'poids_du_corps', 'bodyweight'],
  ['tractions-supi', 'Tractions supination', 'dos', 'poids_du_corps', 'bodyweight'],
  ['tirage-vertical', 'Tirage vertical', 'dos', 'poulie'],
  ['tirage-vertical-serre', 'Tirage vertical prise serrée', 'dos', 'poulie'],
  ['tirage-vertical-machine', 'Tirage vertical machine', 'dos', 'machine'],
  ['rowing-barre', 'Rowing barre', 'dos', 'barre'],
  ['rowing-haltere', 'Rowing haltère unilatéral', 'dos', 'halteres'],
  ['rowing-tbar', 'Rowing T-bar', 'dos', 'barre'],
  ['tirage-horizontal', 'Tirage horizontal poulie', 'dos', 'poulie'],
  ['rowing-machine', 'Rowing machine', 'dos', 'machine'],
  ['rowing-poitrine', 'Rowing appui poitrine', 'dos', 'machine'],
  ['pullover-poulie', 'Pull-over poulie', 'dos', 'poulie'],
  ['souleve-terre', 'Soulevé de terre', 'dos', 'barre'],
  ['rack-pull', 'Rack pull', 'dos', 'barre'],
  // Épaules
  ['dm-barre', 'Développé militaire barre', 'epaules', 'barre'],
  ['dm-halteres', 'Développé épaules haltères', 'epaules', 'halteres'],
  ['dm-machine', 'Développé épaules machine', 'epaules', 'machine'],
  ['arnold', 'Arnold press', 'epaules', 'halteres'],
  ['elev-lat-halteres', 'Élévations latérales haltères', 'epaules', 'halteres'],
  ['elev-lat-poulie', 'Élévations latérales poulie', 'epaules', 'poulie'],
  ['elev-lat-machine', 'Élévations latérales machine', 'epaules', 'machine'],
  ['elev-front', 'Élévations frontales', 'epaules', 'halteres'],
  ['oiseau', 'Oiseau haltères', 'epaules', 'halteres'],
  ['reverse-pec-deck', 'Reverse pec deck', 'epaules', 'machine'],
  ['face-pull', 'Face pull', 'epaules', 'poulie'],
  ['tirage-menton', 'Tirage menton', 'epaules', 'barre'],
  // Biceps
  ['curl-barre', 'Curl barre', 'biceps', 'barre'],
  ['curl-ez', 'Curl barre EZ', 'biceps', 'barre'],
  ['curl-halteres', 'Curl haltères', 'biceps', 'halteres'],
  ['curl-marteau', 'Curl marteau', 'biceps', 'halteres'],
  ['curl-incline', 'Curl incliné haltères', 'biceps', 'halteres'],
  ['curl-pupitre', 'Curl pupitre', 'biceps', 'machine'],
  ['curl-poulie', 'Curl poulie', 'biceps', 'poulie'],
  ['curl-concentre', 'Curl concentré', 'biceps', 'halteres'],
  ['curl-bayesian', 'Curl bayesian (poulie dans le dos)', 'biceps', 'poulie'],
  // Triceps
  ['ext-corde', 'Extension triceps poulie corde', 'triceps', 'poulie'],
  ['ext-barre-poulie', 'Extension triceps poulie barre', 'triceps', 'poulie'],
  ['ext-nuque-poulie', 'Extension nuque poulie', 'triceps', 'poulie'],
  ['barre-front', 'Barre au front', 'triceps', 'barre'],
  ['ext-nuque-haltere', 'Extension nuque haltère', 'triceps', 'halteres'],
  ['dips', 'Dips', 'triceps', 'poids_du_corps', 'bodyweight'],
  ['dc-serre', 'Développé couché prise serrée', 'triceps', 'barre'],
  ['kickback', 'Kickback haltère', 'triceps', 'halteres'],
  ['dips-machine', 'Dips machine', 'triceps', 'machine'],
  // Quadriceps
  ['squat', 'Squat barre', 'quadriceps', 'barre'],
  ['front-squat', 'Front squat', 'quadriceps', 'barre'],
  ['squat-smith', 'Squat Smith', 'quadriceps', 'smith'],
  ['hack-squat', 'Hack squat', 'quadriceps', 'machine'],
  ['pendulum', 'Pendulum squat', 'quadriceps', 'machine'],
  ['belt-squat', 'Belt squat', 'quadriceps', 'machine'],
  ['presse', 'Presse à cuisses', 'quadriceps', 'machine'],
  ['leg-ext', 'Leg extension', 'quadriceps', 'machine'],
  ['goblet', 'Goblet squat', 'quadriceps', 'halteres'],
  ['fentes', 'Fentes haltères', 'quadriceps', 'halteres'],
  ['fentes-bulgares', 'Fentes bulgares', 'quadriceps', 'halteres'],
  ['step-up', 'Step-up', 'quadriceps', 'halteres'],
  // Ischios
  ['sdt-roumain', 'Soulevé de terre roumain', 'ischios', 'barre'],
  ['sdt-roumain-halteres', 'Soulevé de terre roumain haltères', 'ischios', 'halteres'],
  ['sdt-jambes-tendues', 'Soulevé de terre jambes tendues', 'ischios', 'barre'],
  ['leg-curl-allonge', 'Leg curl allongé', 'ischios', 'machine'],
  ['leg-curl-assis', 'Leg curl assis', 'ischios', 'machine'],
  ['good-morning', 'Good morning', 'ischios', 'barre'],
  ['nordic', 'Nordic curl', 'ischios', 'poids_du_corps', 'bodyweight'],
  // Fessiers
  ['hip-thrust', 'Hip thrust barre', 'fessiers', 'barre'],
  ['hip-thrust-machine', 'Hip thrust machine', 'fessiers', 'machine'],
  ['abduction', 'Abduction machine', 'fessiers', 'machine'],
  ['kickback-poulie', 'Kickback fessier poulie', 'fessiers', 'poulie'],
  ['pont-fessier', 'Pont fessier', 'fessiers', 'poids_du_corps', 'bodyweight'],
  // Adducteurs
  ['adduction', 'Adduction machine', 'adducteurs', 'machine'],
  // Mollets
  ['mollets-debout', 'Mollets debout', 'mollets', 'machine'],
  ['mollets-assis', 'Mollets assis', 'mollets', 'machine'],
  ['mollets-presse', 'Mollets à la presse', 'mollets', 'machine'],
  // Abdos
  ['crunch', 'Crunch', 'abdos', 'poids_du_corps', 'bodyweight'],
  ['crunch-poulie', 'Crunch poulie', 'abdos', 'poulie'],
  ['crunch-machine', 'Crunch machine', 'abdos', 'machine'],
  ['releve-jambes', 'Relevé de jambes suspendu', 'abdos', 'poids_du_corps', 'bodyweight'],
  ['roulette', 'Roulette abdos', 'abdos', 'poids_du_corps', 'bodyweight'],
  ['gainage', 'Gainage', 'abdos', 'poids_du_corps', 'duration'],
  ['gainage-lateral', 'Gainage latéral', 'abdos', 'poids_du_corps', 'duration'],
  ['russian-twist', 'Russian twist', 'abdos', 'poids_du_corps', 'bodyweight'],
  // Lombaires / trapèzes / avant-bras
  ['extension-lombaires', 'Extension lombaires', 'lombaires', 'poids_du_corps', 'bodyweight'],
  ['shrug-halteres', 'Shrugs haltères', 'trapezes', 'halteres'],
  ['shrug-barre', 'Shrugs barre', 'trapezes', 'barre'],
  ['curl-poignets', 'Curl poignets', 'avant_bras', 'barre'],
  ['farmer-walk', 'Farmer walk', 'avant_bras', 'halteres'],
  // Cardio
  ['tapis', 'Tapis de course', 'cardio', 'cardio', 'cardio'],
  ['marche-inclinee', 'Marche inclinée', 'cardio', 'cardio', 'cardio'],
  ['velo', 'Vélo', 'cardio', 'cardio', 'cardio'],
  ['rameur', 'Rameur', 'cardio', 'cardio', 'cardio'],
  ['elliptique', 'Elliptique', 'cardio', 'cardio', 'cardio'],
  ['escalier', 'Stairmaster (escalier)', 'cardio', 'cardio', 'cardio'],
  ['course', 'Course à pied', 'cardio', 'cardio', 'cardio'],
  ['corde', 'Corde à sauter', 'cardio', 'cardio', 'cardio'],
  ['hiit', 'HIIT', 'cardio', 'cardio', 'cardio'],
  ['natation', 'Natation', 'cardio', 'cardio', 'cardio'],
]

export const EXERCISES: Exercise[] = ROWS.map(([id, name, muscle, equipment, kind]) => ({
  id,
  name,
  muscle,
  equipment,
  kind: kind ?? 'weight',
}))

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function findExercise(id: string, custom: Exercise[] = []): Exercise {
  return (
    BY_ID.get(id) ??
    custom.find((e) => e.id === id) ?? {
      id,
      name: 'Exercice supprimé',
      muscle: 'abdos',
      equipment: 'autre',
      kind: 'weight',
    }
  )
}

/** Recherche insensible aux accents et à la casse. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchExercises(query: string, list: Exercise[]): Exercise[] {
  const q = normalize(query)
  if (!q) return list
  const words = q.split(' ')
  return list.filter((e) => {
    const hay = normalize(`${e.name} ${MUSCLE_LABEL[e.muscle]} ${EQUIPMENT_LABEL[e.equipment]}`)
    return words.every((w) => hay.includes(w))
  })
}

/** Programmes d'exemple proposés au premier lancement. */
export const TEMPLATE_ROUTINES: { name: string; items: [string, number, string, number][] }[] = [
  {
    name: 'Push',
    items: [
      ['dc-barre', 4, '6-8', 150],
      ['di-halteres', 3, '8-10', 120],
      ['dm-halteres', 3, '8-10', 120],
      ['elev-lat-halteres', 4, '12-15', 75],
      ['ecarte-poulie', 3, '12-15', 75],
      ['ext-corde', 3, '10-12', 75],
    ],
  },
  {
    name: 'Pull',
    items: [
      ['tractions', 4, '6-10', 150],
      ['rowing-barre', 3, '8-10', 120],
      ['tirage-horizontal', 3, '10-12', 90],
      ['face-pull', 3, '12-15', 75],
      ['curl-incline', 3, '10-12', 75],
      ['curl-marteau', 3, '10-12', 75],
    ],
  },
  {
    name: 'Legs',
    items: [
      ['squat', 4, '6-8', 180],
      ['sdt-roumain', 3, '8-10', 150],
      ['presse', 3, '10-12', 120],
      ['leg-curl-assis', 3, '10-12', 90],
      ['leg-ext', 3, '12-15', 75],
      ['mollets-debout', 4, '10-15', 60],
    ],
  },
]
