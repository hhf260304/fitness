'use server'

import { db } from '@/lib/db'
import { foodCatalog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Food } from '@/lib/types'
import { verifySession } from '@/lib/session'

function toFood(row: typeof foodCatalog.$inferSelect): Food {
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
      name:     data.name,
      calories: data.calories,
      protein:  String(data.protein),
      fat:      String(data.fat),
      carbs:    String(data.carbs),
      sugar:    String(data.sugar),
    })
    .returning()
  return toFood(inserted)
}

export async function updateFood(id: number, data: Omit<Food, 'id'>): Promise<Food> {
  await verifySession()
  const [updated] = await db.update(foodCatalog)
    .set({
      name:     data.name,
      calories: data.calories,
      protein:  String(data.protein),
      fat:      String(data.fat),
      carbs:    String(data.carbs),
      sugar:    String(data.sugar),
    })
    .where(eq(foodCatalog.id, id))
    .returning()
  if (!updated) throw new Error(`Food ${id} not found`)
  return toFood(updated)
}

export async function deleteFood(id: number): Promise<void> {
  await verifySession()
  await db.delete(foodCatalog).where(eq(foodCatalog.id, id))
}
