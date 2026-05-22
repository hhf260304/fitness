'use server'

import { db } from '@/lib/db'
import { sessions, exercises } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Session, Exercise } from '@/lib/types'
import { verifySession } from '@/lib/session'

function toExercise(row: typeof exercises.$inferSelect): Exercise {
  return {
    id:     row.id,
    name:   row.name,
    nameEn: row.nameEn ?? undefined,
    muscle: row.muscle as Exercise['muscle'],
    sets:   row.sets,
    reps:   row.reps,
    weight: Number(row.weight),
    rest:   row.rest,
  }
}

function toSession(
  row: typeof sessions.$inferSelect,
  exRows: (typeof exercises.$inferSelect)[]
): Session {
  return {
    id:        row.id,
    name:      row.name,
    date:      row.date,
    exercises: exRows.map(toExercise),
  }
}

export async function getSessions(): Promise<Session[]> {
  const { userId } = await verifySession()
  const rows = await db.query.sessions.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    with:  { exercises: true },
    orderBy: (t, { asc, desc }) => [asc(t.sortOrder), desc(t.id)],
  })
  return rows.map(r => toSession(r, r.exercises))
}

export async function createSession(data: Omit<Session, 'id'>): Promise<Session> {
  const { userId } = await verifySession()
  const [inserted] = await db.insert(sessions)
    .values({ userId, name: data.name, date: data.date })
    .returning()

  if (data.exercises.length > 0) {
    await db.insert(exercises).values(
      data.exercises.map(e => ({
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

  const exRows = await db.select().from(exercises).where(eq(exercises.sessionId, inserted.id))
  return toSession(inserted, exRows)
}

export async function updateSession(id: number, data: Omit<Session, 'id'>): Promise<Session> {
  const { userId } = await verifySession()
  await db.update(sessions)
    .set({ name: data.name, date: data.date })
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))

  await db.delete(exercises).where(eq(exercises.sessionId, id))

  if (data.exercises.length > 0) {
    await db.insert(exercises).values(
      data.exercises.map(e => ({
        sessionId: id,
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

  const [row] = await db.select().from(sessions).where(eq(sessions.id, id))
  if (!row) throw new Error(`Session ${id} not found`)
  const exRows = await db.select().from(exercises).where(eq(exercises.sessionId, id))
  return toSession(row, exRows)
}

export async function deleteSession(id: number): Promise<void> {
  const { userId } = await verifySession()
  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
}

export async function reorderSessions(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  const { userId } = await verifySession()
  await Promise.all(
    ids.map((id, index) =>
      db.update(sessions)
        .set({ sortOrder: index })
        .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    )
  )
}
