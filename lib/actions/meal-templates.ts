'use server'

import { db } from '@/lib/db'
import {
  mealTemplates, mealTemplateMeals, mealTemplateFoods,
  meals, mealFoods,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { MealTemplate, MealTemplateMeal, MealTemplateFood, Meal } from '@/lib/types'
import { verifySession } from '@/lib/session'

// ── Converters ────────────────────────────────────────────────

function toTemplateFood(row: typeof mealTemplateFoods.$inferSelect): MealTemplateFood {
  return {
    id:            row.id,
    catalogFoodId: row.catalogFoodId ?? undefined,
    amountG:       row.amountG != null ? Number(row.amountG) : undefined,
    name:          row.name,
    calories:      Number(row.calories),
    protein:       Number(row.protein),
    fat:           Number(row.fat),
    carbs:         Number(row.carbs),
  }
}

function toTemplateMeal(
  row: typeof mealTemplateMeals.$inferSelect,
  foodRows: (typeof mealTemplateFoods.$inferSelect)[],
): MealTemplateMeal {
  return {
    id:        row.id,
    name:      row.name,
    time:      row.time ?? '—',
    sortOrder: row.sortOrder,
    foods:     foodRows.map(toTemplateFood),
  }
}

// ── getTemplates ──────────────────────────────────────────────

export async function getTemplates(): Promise<MealTemplate[]> {
  const { userId } = await verifySession()
  const rows = await db.query.mealTemplates.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    with: {
      meals: {
        orderBy: (m, { asc }) => [asc(m.sortOrder), asc(m.id)],
        with: { foods: true },
      },
    },
    orderBy: (t, { asc }) => [asc(t.id)],
  })
  return rows.map(r => ({
    id:        r.id,
    name:      r.name,
    isDefault: r.isDefault,
    meals:     r.meals.map(m => toTemplateMeal(m, m.foods)),
  }))
}

// ── createTemplate ────────────────────────────────────────────

type TemplateMealInput = Omit<MealTemplateMeal, 'id'>

export async function createTemplate(
  name: string,
  mealInputs: TemplateMealInput[],
): Promise<MealTemplate> {
  const { userId } = await verifySession()
  return await db.transaction(async (tx) => {
    const [tmpl] = await tx.insert(mealTemplates)
      .values({ userId, name, isDefault: false })
      .returning()

    const builtMeals: MealTemplateMeal[] = []
    for (const [i, m] of mealInputs.entries()) {
      const time = m.time && m.time !== '—' ? m.time : null
      const [tmMeal] = await tx.insert(mealTemplateMeals)
        .values({ templateId: tmpl.id, name: m.name, time, sortOrder: i })
        .returning()

      let foodRows: (typeof mealTemplateFoods.$inferSelect)[] = []
      if (m.foods.length > 0) {
        foodRows = await tx.insert(mealTemplateFoods)
          .values(m.foods.map(f => ({
            templateMealId: tmMeal.id,
            catalogFoodId:  f.catalogFoodId ?? null,
            amountG:        f.amountG != null ? String(f.amountG) : null,
            name:           f.name,
            calories:       String(f.calories),
            protein:        String(f.protein),
            fat:            String(f.fat),
            carbs:          String(f.carbs),
          })))
          .returning()
      }
      builtMeals.push(toTemplateMeal(tmMeal, foodRows))
    }
    return { id: tmpl.id, name: tmpl.name, isDefault: tmpl.isDefault, meals: builtMeals }
  })
}

// ── updateTemplate ────────────────────────────────────────────

export async function updateTemplate(
  id: number,
  name: string,
  mealInputs: TemplateMealInput[],
): Promise<MealTemplate> {
  const { userId } = await verifySession()
  return await db.transaction(async (tx) => {
    const [updated] = await tx.update(mealTemplates)
      .set({ name })
      .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, userId)))
      .returning()
    if (!updated) throw new Error(`Template ${id} not found`)

    // 先刪所有 meals（cascade 自動清 foods）
    await tx.delete(mealTemplateMeals).where(eq(mealTemplateMeals.templateId, id))

    const builtMeals: MealTemplateMeal[] = []
    for (const [i, m] of mealInputs.entries()) {
      const time = m.time && m.time !== '—' ? m.time : null
      const [tmMeal] = await tx.insert(mealTemplateMeals)
        .values({ templateId: id, name: m.name, time, sortOrder: i })
        .returning()

      let foodRows: (typeof mealTemplateFoods.$inferSelect)[] = []
      if (m.foods.length > 0) {
        foodRows = await tx.insert(mealTemplateFoods)
          .values(m.foods.map(f => ({
            templateMealId: tmMeal.id,
            catalogFoodId:  f.catalogFoodId ?? null,
            amountG:        f.amountG != null ? String(f.amountG) : null,
            name:           f.name,
            calories:       String(f.calories),
            protein:        String(f.protein),
            fat:            String(f.fat),
            carbs:          String(f.carbs),
          })))
          .returning()
      }
      builtMeals.push(toTemplateMeal(tmMeal, foodRows))
    }
    return { id: updated.id, name: updated.name, isDefault: updated.isDefault, meals: builtMeals }
  })
}

// ── deleteTemplate ────────────────────────────────────────────

export async function deleteTemplate(id: number): Promise<void> {
  const { userId } = await verifySession()
  await db.delete(mealTemplates)
    .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, userId)))
}

// ── setDefaultTemplate ────────────────────────────────────────

export async function setDefaultTemplate(id: number | null): Promise<void> {
  const { userId } = await verifySession()
  await db.transaction(async (tx) => {
    await tx.update(mealTemplates)
      .set({ isDefault: false })
      .where(eq(mealTemplates.userId, userId))
    if (id !== null) {
      await tx.update(mealTemplates)
        .set({ isDefault: true })
        .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, userId)))
    }
  })
}

// ── saveDayAsTemplate ─────────────────────────────────────────

export async function saveDayAsTemplate(date: string, name: string): Promise<MealTemplate> {
  const { userId } = await verifySession()
  const dayMeals = await db.query.meals.findMany({
    where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.date, date)),
    with: { foods: true },
    orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.id)],
  })
  const mealInputs: TemplateMealInput[] = dayMeals.map((m, i) => ({
    name:      m.name,
    time:      m.time ?? '—',
    sortOrder: i,
    foods:     m.foods.map(f => ({
      id:            0,
      catalogFoodId: f.catalogFoodId ?? undefined,
      amountG:       f.amountG != null ? Number(f.amountG) : undefined,
      name:          f.name,
      calories:      Number(f.calories),
      protein:       Number(f.protein),
      fat:           Number(f.fat),
      carbs:         Number(f.carbs),
    })),
  }))
  return createTemplate(name, mealInputs)
}

// ── applyTemplate ─────────────────────────────────────────────

export async function applyTemplate(templateId: number, date: string, force = false): Promise<Meal[]> {
  const { userId } = await verifySession()

  // Guard：若已有餐點，視 force 決定是否覆蓋
  const existing = await db.query.meals.findMany({
    where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.date, date)),
  })
  if (existing.length > 0) {
    if (!force) throw new Error('ALREADY_HAS_MEALS')
    await db.delete(meals).where(and(eq(meals.userId, userId), eq(meals.date, date)))
  }

  const tmpl = await db.query.mealTemplates.findFirst({
    where: (t, { and, eq }) => and(eq(t.id, templateId), eq(t.userId, userId)),
    with: {
      meals: {
        orderBy: (m, { asc }) => [asc(m.sortOrder), asc(m.id)],
        with: { foods: true },
      },
    },
  })
  if (!tmpl) throw new Error(`Template ${templateId} not found`)

  return await db.transaction(async (tx) => {
    const result: Meal[] = []
    for (const [i, tm] of tmpl.meals.entries()) {
      const time = tm.time ?? null
      const [inserted] = await tx.insert(meals)
        .values({ date, userId, name: tm.name, time, sortOrder: i })
        .returning()

      let foodRows: (typeof mealFoods.$inferSelect)[] = []
      if (tm.foods.length > 0) {
        foodRows = await tx.insert(mealFoods)
          .values(tm.foods.map(f => ({
            mealId:        inserted.id,
            catalogFoodId: f.catalogFoodId ?? null,
            amountG:       f.amountG != null ? String(f.amountG) : null,
            name:          f.name,
            calories:      String(f.calories),
            protein:       String(f.protein),
            fat:           String(f.fat),
            carbs:         String(f.carbs),
          })))
          .returning()
      }

      result.push({
        id:    inserted.id,
        name:  inserted.name,
        time:  inserted.time ?? '—',
        foods: foodRows.map(f => ({
          id:            f.id,
          name:          f.name,
          catalogFoodId: f.catalogFoodId ?? undefined,
          amountG:       f.amountG != null ? Number(f.amountG) : undefined,
          calories:      Number(f.calories),
          protein:       Number(f.protein),
          fat:           Number(f.fat),
          carbs:         Number(f.carbs),
        })),
      })
    }
    return result
  })
}
