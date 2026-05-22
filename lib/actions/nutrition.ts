'use server'

import { db } from '@/lib/db'
import { meals, mealFoods, goals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Meal, Food, Goals, NutritionDay } from '@/lib/types'
import { DEFAULT_GOALS } from '@/lib/data'
import { verifySession } from '@/lib/session'

function toFood(row: typeof mealFoods.$inferSelect): Food {
  return {
    id:       row.id,
    name:     row.name,
    calories: row.calories,
    protein:  Number(row.protein),
    fat:      Number(row.fat),
    carbs:    Number(row.carbs),
    sugar:    Number(row.sugar),
  }
}

function toMeal(
  row: typeof meals.$inferSelect,
  foodRows: (typeof mealFoods.$inferSelect)[]
): Meal {
  return {
    id:    row.id,
    name:  row.name,
    time:  row.time,
    foods: foodRows.map(toFood),
  }
}

export async function getNutritionDay(date: string): Promise<NutritionDay> {
  const { userId } = await verifySession()
  const mealRows = await db.query.meals.findMany({
    where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.date, date)),
    with: { foods: true },
  })
  const dayGoals = await getGoals(date)
  return {
    goals: dayGoals,
    meals: mealRows.map(r => toMeal(r, r.foods)),
  }
}

export async function getGoals(date: string): Promise<Goals> {
  const { userId } = await verifySession()
  const [row] = await db.select().from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.date, date)))
  if (!row) return DEFAULT_GOALS
  return {
    calories: row.calories,
    protein:  row.protein,
    fat:      row.fat,
    carbs:    row.carbs,
    sugar:    row.sugar,
  }
}

export async function upsertGoals(date: string, data: Goals): Promise<void> {
  const { userId } = await verifySession()
  await db.insert(goals)
    .values({ date, userId, ...data })
    .onConflictDoUpdate({
      target: [goals.userId, goals.date],
      set:    { calories: data.calories, protein: data.protein, fat: data.fat, carbs: data.carbs, sugar: data.sugar },
    })
}

export async function createMeal(date: string, data: Omit<Meal, 'id'>): Promise<Meal> {
  const { userId } = await verifySession()
  const [inserted] = await db.insert(meals)
    .values({ date, userId, name: data.name, time: data.time })
    .returning()

  if (data.foods.length > 0) {
    await db.insert(mealFoods).values(
      data.foods.map(f => ({
        mealId:   inserted.id,
        name:     f.name,
        calories: f.calories,
        protein:  String(f.protein),
        fat:      String(f.fat),
        carbs:    String(f.carbs),
        sugar:    String(f.sugar),
      }))
    )
  }

  const foodRows = await db.select().from(mealFoods).where(eq(mealFoods.mealId, inserted.id))
  return toMeal(inserted, foodRows)
}

export async function updateMeal(id: number, data: Omit<Meal, 'id'>): Promise<Meal> {
  const { userId } = await verifySession()
  await db.update(meals).set({ name: data.name, time: data.time }).where(and(eq(meals.id, id), eq(meals.userId, userId)))
  await db.delete(mealFoods).where(eq(mealFoods.mealId, id))

  if (data.foods.length > 0) {
    await db.insert(mealFoods).values(
      data.foods.map(f => ({
        mealId:   id,
        name:     f.name,
        calories: f.calories,
        protein:  String(f.protein),
        fat:      String(f.fat),
        carbs:    String(f.carbs),
        sugar:    String(f.sugar),
      }))
    )
  }

  const [row] = await db.select().from(meals).where(eq(meals.id, id))
  if (!row) throw new Error(`Meal ${id} not found`)
  const foodRows = await db.select().from(mealFoods).where(eq(mealFoods.mealId, id))
  return toMeal(row, foodRows)
}

export async function deleteMeal(id: number): Promise<void> {
  const { userId } = await verifySession()
  await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)))
}
