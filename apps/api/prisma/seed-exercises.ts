/**
 * Seed common exercises. Mix of gym (barbell/dumbbell/machine), bodyweight,
 * and cardio. India-context aware (yoga + sports for variety).
 *
 * MET values approximate, sourced from Compendium of Physical Activities.
 * Run: npm run db:seed-exercises
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
})

interface ExerciseSeed {
  name: string
  nameLocal?: string
  category: 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'SPORTS' | 'BODYWEIGHT' | 'OTHER'
  primaryMuscles: string[]
  secondaryMuscles?: string[]
  equipment?: string
  defaultUnit?: 'REPS' | 'TIME' | 'DISTANCE'
  metPerKg?: number
  description?: string
}

const EXERCISES: ExerciseSeed[] = [
  // === CHEST ===
  { name: 'Bench Press (Barbell)', category: 'STRENGTH', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Incline Bench Press (Barbell)', category: 'STRENGTH', primaryMuscles: ['chest'], secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Bench Press (Dumbbell)', category: 'STRENGTH', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], equipment: 'dumbbell', metPerKg: 6 },
  { name: 'Incline Dumbbell Press', category: 'STRENGTH', primaryMuscles: ['chest'], secondaryMuscles: ['shoulders'], equipment: 'dumbbell', metPerKg: 6 },
  { name: 'Dumbbell Fly', category: 'STRENGTH', primaryMuscles: ['chest'], equipment: 'dumbbell', metPerKg: 5 },
  { name: 'Cable Crossover', category: 'STRENGTH', primaryMuscles: ['chest'], equipment: 'cable', metPerKg: 5 },
  { name: 'Push-up', nameLocal: 'पुश-अप', category: 'BODYWEIGHT', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'core'], equipment: 'bodyweight', metPerKg: 8 },
  { name: 'Dips', category: 'BODYWEIGHT', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'], equipment: 'bodyweight', metPerKg: 8 },

  // === BACK ===
  { name: 'Deadlift', category: 'STRENGTH', primaryMuscles: ['back', 'hamstrings', 'glutes'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Barbell Row', category: 'STRENGTH', primaryMuscles: ['back'], secondaryMuscles: ['biceps'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Dumbbell Row', category: 'STRENGTH', primaryMuscles: ['back'], secondaryMuscles: ['biceps'], equipment: 'dumbbell', metPerKg: 5 },
  { name: 'Pull-up', category: 'BODYWEIGHT', primaryMuscles: ['back'], secondaryMuscles: ['biceps'], equipment: 'bodyweight', metPerKg: 8 },
  { name: 'Chin-up', category: 'BODYWEIGHT', primaryMuscles: ['back', 'biceps'], equipment: 'bodyweight', metPerKg: 8 },
  { name: 'Lat Pulldown', category: 'STRENGTH', primaryMuscles: ['back'], secondaryMuscles: ['biceps'], equipment: 'cable', metPerKg: 5 },
  { name: 'Seated Cable Row', category: 'STRENGTH', primaryMuscles: ['back'], equipment: 'cable', metPerKg: 5 },
  { name: 'T-Bar Row', category: 'STRENGTH', primaryMuscles: ['back'], equipment: 'machine', metPerKg: 5 },

  // === LEGS ===
  { name: 'Squat (Barbell)', category: 'STRENGTH', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Front Squat', category: 'STRENGTH', primaryMuscles: ['quads'], secondaryMuscles: ['core'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Leg Press', category: 'STRENGTH', primaryMuscles: ['quads', 'glutes'], equipment: 'machine', metPerKg: 5 },
  { name: 'Lunges', category: 'STRENGTH', primaryMuscles: ['quads', 'glutes'], equipment: 'dumbbell', metPerKg: 5 },
  { name: 'Romanian Deadlift', category: 'STRENGTH', primaryMuscles: ['hamstrings', 'glutes'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Leg Curl', category: 'STRENGTH', primaryMuscles: ['hamstrings'], equipment: 'machine', metPerKg: 4 },
  { name: 'Leg Extension', category: 'STRENGTH', primaryMuscles: ['quads'], equipment: 'machine', metPerKg: 4 },
  { name: 'Calf Raise', category: 'STRENGTH', primaryMuscles: ['calves'], equipment: 'machine', metPerKg: 4 },
  { name: 'Bodyweight Squat', category: 'BODYWEIGHT', primaryMuscles: ['quads', 'glutes'], equipment: 'bodyweight', metPerKg: 5 },

  // === SHOULDERS ===
  { name: 'Overhead Press (Barbell)', category: 'STRENGTH', primaryMuscles: ['shoulders'], secondaryMuscles: ['triceps'], equipment: 'barbell', metPerKg: 6 },
  { name: 'Dumbbell Shoulder Press', category: 'STRENGTH', primaryMuscles: ['shoulders'], secondaryMuscles: ['triceps'], equipment: 'dumbbell', metPerKg: 5 },
  { name: 'Lateral Raise', category: 'STRENGTH', primaryMuscles: ['shoulders'], equipment: 'dumbbell', metPerKg: 4 },
  { name: 'Front Raise', category: 'STRENGTH', primaryMuscles: ['shoulders'], equipment: 'dumbbell', metPerKg: 4 },
  { name: 'Rear Delt Fly', category: 'STRENGTH', primaryMuscles: ['shoulders'], equipment: 'dumbbell', metPerKg: 4 },
  { name: 'Face Pull', category: 'STRENGTH', primaryMuscles: ['shoulders', 'back'], equipment: 'cable', metPerKg: 4 },
  { name: 'Arnold Press', category: 'STRENGTH', primaryMuscles: ['shoulders'], equipment: 'dumbbell', metPerKg: 5 },

  // === ARMS ===
  { name: 'Bicep Curl (Barbell)', category: 'STRENGTH', primaryMuscles: ['biceps'], equipment: 'barbell', metPerKg: 4 },
  { name: 'Bicep Curl (Dumbbell)', category: 'STRENGTH', primaryMuscles: ['biceps'], equipment: 'dumbbell', metPerKg: 4 },
  { name: 'Hammer Curl', category: 'STRENGTH', primaryMuscles: ['biceps', 'forearms'], equipment: 'dumbbell', metPerKg: 4 },
  { name: 'Preacher Curl', category: 'STRENGTH', primaryMuscles: ['biceps'], equipment: 'machine', metPerKg: 4 },
  { name: 'Tricep Pushdown', category: 'STRENGTH', primaryMuscles: ['triceps'], equipment: 'cable', metPerKg: 4 },
  { name: 'Skull Crusher', category: 'STRENGTH', primaryMuscles: ['triceps'], equipment: 'barbell', metPerKg: 4 },
  { name: 'Overhead Tricep Extension', category: 'STRENGTH', primaryMuscles: ['triceps'], equipment: 'dumbbell', metPerKg: 4 },

  // === CORE ===
  { name: 'Plank', category: 'BODYWEIGHT', primaryMuscles: ['core'], equipment: 'bodyweight', defaultUnit: 'TIME', metPerKg: 4 },
  { name: 'Crunches', category: 'BODYWEIGHT', primaryMuscles: ['core'], equipment: 'bodyweight', metPerKg: 4 },
  { name: 'Hanging Leg Raise', category: 'BODYWEIGHT', primaryMuscles: ['core'], equipment: 'bodyweight', metPerKg: 5 },
  { name: 'Russian Twist', category: 'BODYWEIGHT', primaryMuscles: ['core'], equipment: 'bodyweight', metPerKg: 4 },
  { name: 'Mountain Climbers', category: 'BODYWEIGHT', primaryMuscles: ['core'], secondaryMuscles: ['shoulders'], equipment: 'bodyweight', metPerKg: 8 },
  { name: 'Ab Roller', category: 'STRENGTH', primaryMuscles: ['core'], equipment: 'bodyweight', metPerKg: 5 },

  // === CARDIO ===
  { name: 'Running', nameLocal: 'दौड़ना', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'none', defaultUnit: 'DISTANCE', metPerKg: 9 },
  { name: 'Jogging', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'none', defaultUnit: 'DISTANCE', metPerKg: 7 },
  { name: 'Walking', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'none', defaultUnit: 'DISTANCE', metPerKg: 4 },
  { name: 'Cycling', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'none', defaultUnit: 'DISTANCE', metPerKg: 7 },
  { name: 'Treadmill', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'machine', defaultUnit: 'TIME', metPerKg: 8 },
  { name: 'Stationary Bike', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'machine', defaultUnit: 'TIME', metPerKg: 7 },
  { name: 'Elliptical', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'machine', defaultUnit: 'TIME', metPerKg: 7 },
  { name: 'Rowing Machine', category: 'CARDIO', primaryMuscles: ['back', 'legs'], equipment: 'machine', defaultUnit: 'TIME', metPerKg: 8 },
  { name: 'Stair Climber', category: 'CARDIO', primaryMuscles: ['legs', 'glutes'], equipment: 'machine', defaultUnit: 'TIME', metPerKg: 9 },
  { name: 'Jump Rope', category: 'CARDIO', primaryMuscles: ['legs', 'shoulders'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 12 },
  { name: 'Burpees', category: 'BODYWEIGHT', primaryMuscles: ['full body'], equipment: 'bodyweight', metPerKg: 10 },
  { name: 'High Knees', category: 'CARDIO', primaryMuscles: ['legs'], equipment: 'bodyweight', defaultUnit: 'TIME', metPerKg: 8 },

  // === FLEXIBILITY / YOGA (India context) ===
  { name: 'Yoga (Hatha)', nameLocal: 'योग', category: 'FLEXIBILITY', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 3 },
  { name: 'Yoga (Vinyasa)', category: 'FLEXIBILITY', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 4 },
  { name: 'Surya Namaskar', nameLocal: 'सूर्य नमस्कार', category: 'FLEXIBILITY', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'REPS', metPerKg: 5 },
  { name: 'Stretching', category: 'FLEXIBILITY', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 2 },

  // === SPORTS ===
  { name: 'Swimming', category: 'SPORTS', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 8 },
  { name: 'Cricket', category: 'SPORTS', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 5 },
  { name: 'Football', category: 'SPORTS', primaryMuscles: ['legs'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 8 },
  { name: 'Basketball', category: 'SPORTS', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 8 },
  { name: 'Badminton', category: 'SPORTS', primaryMuscles: ['full body'], equipment: 'none', defaultUnit: 'TIME', metPerKg: 5 },
]

function normalizeSearchKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100)
}

async function main() {
  console.log(`Seeding ${EXERCISES.length} exercises…`)
  let inserted = 0
  let skipped = 0

  for (const ex of EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, isCustom: false },
    })
    if (existing) {
      skipped++
      continue
    }

    await prisma.exercise.create({
      data: {
        name: ex.name,
        nameLocal: ex.nameLocal,
        category: ex.category,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        defaultUnit: ex.defaultUnit ?? 'REPS',
        metPerKg: ex.metPerKg,
        description: ex.description,
        isCustom: false,
        source: 'MANUAL',
        searchKey: normalizeSearchKey(ex.name),
      },
    })
    inserted++
  }

  console.log(`✓ Inserted ${inserted}, skipped ${skipped} (already present)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
