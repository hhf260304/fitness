'use server'

import { db } from '@/lib/db'
import { foodCatalog, mealFoods } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Food } from '@/lib/types'
import { verifySession } from '@/lib/session'

function toFood(row: typeof foodCatalog.$inferSelect): Food {
  return {
    id:          row.id,
    name:        row.name,
    servingSize: Number(row.servingSize),
    calories:    Number(row.calories),
    protein:     Number(row.protein),
    fat:         Number(row.fat),
    carbs:       Number(row.carbs),
    sugar:       Number(row.sugar),
  }
}

export async function getFoods(): Promise<Food[]> {
  const { userId } = await verifySession()
  const rows = await db.select().from(foodCatalog).where(eq(foodCatalog.userId, userId))
  return rows.map(toFood)
}

export async function createFood(data: Omit<Food, 'id'>): Promise<Food> {
  const { userId } = await verifySession()
  const [inserted] = await db.insert(foodCatalog)
    .values({
      userId,
      name:        data.name,
      servingSize: String(data.servingSize ?? 100),
      calories:    String(data.calories),
      protein:     String(data.protein),
      fat:         String(data.fat),
      carbs:       String(data.carbs),
      sugar:       String(data.sugar),
    })
    .returning()
  return toFood(inserted)
}

export async function updateFood(id: number, data: Omit<Food, 'id'>): Promise<Food> {
  const { userId } = await verifySession()
  const servingSize = data.servingSize ?? 100

  const [updated] = await db.update(foodCatalog)
    .set({
      name:        data.name,
      servingSize: String(servingSize),
      calories:    String(data.calories),
      protein:     String(data.protein),
      fat:         String(data.fat),
      carbs:       String(data.carbs),
      sugar:       String(data.sugar),
    })
    .where(and(eq(foodCatalog.id, id), eq(foodCatalog.userId, userId)))
    .returning()
  if (!updated) throw new Error(`Food ${id} not found`)

  // 同步更新所有從此食物庫項目新增的飲食紀錄
  const linked = await db.select().from(mealFoods).where(eq(mealFoods.catalogFoodId, id))
  for (const row of linked) {
    const amt = Number(row.amountG)
    if (!amt) continue
    await db.update(mealFoods)
      .set({
        name:     `${data.name} ${amt}g`,
        calories: Math.round(data.calories * amt / servingSize),
        protein:  String(Math.round(data.protein * amt / servingSize * 10) / 10),
        fat:      String(Math.round(data.fat      * amt / servingSize * 10) / 10),
        carbs:    String(Math.round(data.carbs    * amt / servingSize * 10) / 10),
        sugar:    String(Math.round(data.sugar    * amt / servingSize * 10) / 10),
      })
      .where(eq(mealFoods.id, row.id))
  }

  return toFood(updated)
}

export async function deleteFood(id: number): Promise<void> {
  const { userId } = await verifySession()
  await db.delete(foodCatalog).where(and(eq(foodCatalog.id, id), eq(foodCatalog.userId, userId)))
}
