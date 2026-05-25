'use server'

import { db } from '@/lib/db'
import { foodCategories } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { FoodCategory } from '@/lib/types'
import { verifySession } from '@/lib/session'

function toCategory(row: typeof foodCategories.$inferSelect): FoodCategory {
  return { id: row.id, name: row.name }
}

export async function getCategories(): Promise<FoodCategory[]> {
  const { userId } = await verifySession()
  const rows = await db
    .select()
    .from(foodCategories)
    .where(eq(foodCategories.userId, userId))
  return rows.map(toCategory)
}

export async function createCategory(name: string): Promise<FoodCategory> {
  const { userId } = await verifySession()
  const [inserted] = await db
    .insert(foodCategories)
    .values({ userId, name: name.trim() })
    .returning()
  return toCategory(inserted)
}

export async function updateCategory(id: number, name: string): Promise<FoodCategory> {
  const { userId } = await verifySession()
  const [updated] = await db
    .update(foodCategories)
    .set({ name: name.trim() })
    .where(and(eq(foodCategories.id, id), eq(foodCategories.userId, userId)))
    .returning()
  if (!updated) throw new Error(`Category ${id} not found`)
  return toCategory(updated)
}

export async function deleteCategory(id: number): Promise<void> {
  const { userId } = await verifySession()
  await db
    .delete(foodCategories)
    .where(and(eq(foodCategories.id, id), eq(foodCategories.userId, userId)))
}
