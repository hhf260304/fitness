import { db } from './index'
import { sessions, exercises, foodCatalog, meals, mealFoods, goals } from './schema'
import { DEFAULT_SESSIONS, DEFAULT_FOOD_DB, DEFAULT_NUTRITION, DEFAULT_GOALS } from '../data'
import { count } from 'drizzle-orm'

async function seed() {
  // 若已有資料則跳過（idempotent）
  const [{ value: sessionCount }] = await db.select({ value: count() }).from(sessions)
  if (Number(sessionCount) > 0) {
    console.log('DB already seeded, skipping.')
    return
  }

  console.log('Seeding sessions...')
  for (const s of DEFAULT_SESSIONS) {
    const [inserted] = await db.insert(sessions).values({ name: s.name, date: s.date }).returning()
    if (s.exercises.length > 0) {
      await db.insert(exercises).values(
        s.exercises.map(e => ({
          sessionId: inserted.id,
          name:      e.name,
          nameEn:    e.nameEn ?? null,
          muscle:    e.muscle,
          sets:      e.sets,
          reps:      e.reps,
          weight:    String(e.weight),
          rest:      e.rest,
        }))
      )
    }
  }

  console.log('Seeding food catalog...')
  await db.insert(foodCatalog).values(
    DEFAULT_FOOD_DB.map(f => ({
      name:     f.name,
      calories: String(f.calories),
      protein:  String(f.protein),
      fat:      String(f.fat),
      carbs:    String(f.carbs),
      sugar:    String(f.sugar),
    }))
  )

  console.log('Seeding nutrition...')
  for (const [date, day] of Object.entries(DEFAULT_NUTRITION)) {
    await db.insert(goals).values({
      date,
      calories: day.goals.calories,
      protein:  day.goals.protein,
      fat:      day.goals.fat,
      carbs:    day.goals.carbs,
      sugar:    day.goals.sugar,
    }).onConflictDoNothing()

    for (const meal of day.meals) {
      const [insertedMeal] = await db.insert(meals).values({
        date,
        name: meal.name,
        time: meal.time,
      }).returning()

      if (meal.foods.length > 0) {
        await db.insert(mealFoods).values(
          meal.foods.map(f => ({
            mealId:   insertedMeal.id,
            name:     f.name,
            calories: f.calories,
            protein:  String(f.protein),
            fat:      String(f.fat),
            carbs:    String(f.carbs),
            sugar:    String(f.sugar),
          }))
        )
      }
    }
  }

  // 插入預設目標（若今日尚無）
  const TODAY = new Date().toISOString().slice(0, 10)
  await db.insert(goals).values({
    date:     TODAY,
    calories: DEFAULT_GOALS.calories,
    protein:  DEFAULT_GOALS.protein,
    fat:      DEFAULT_GOALS.fat,
    carbs:    DEFAULT_GOALS.carbs,
    sugar:    DEFAULT_GOALS.sugar,
  }).onConflictDoNothing()

  console.log('Seed complete.')
}

seed().catch(e => { console.error(e); process.exit(1) })
