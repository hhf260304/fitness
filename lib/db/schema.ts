import { pgTable, serial, text, integer, numeric } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const sessions = pgTable('sessions', {
  id:   serial('id').primaryKey(),
  name: text('name').notNull(),
  date: text('date').notNull(),
})

export const exercises = pgTable('exercises', {
  id:        serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  nameEn:    text('name_en'),
  muscle:    text('muscle').notNull(),
  sets:      integer('sets').notNull(),
  reps:      integer('reps').notNull(),
  weight:    numeric('weight', { precision: 6, scale: 2 }).notNull(),
  rest:      integer('rest').notNull(),
})

export const foodCatalog = pgTable('food_catalog', {
  id:       serial('id').primaryKey(),
  name:     text('name').notNull(),
  calories: integer('calories').notNull(),
  protein:  numeric('protein', { precision: 6, scale: 1 }).notNull(),
  fat:      numeric('fat',     { precision: 6, scale: 1 }).notNull(),
  carbs:    numeric('carbs',   { precision: 6, scale: 1 }).notNull(),
  sugar:    numeric('sugar',   { precision: 6, scale: 1 }).notNull(),
})

export const meals = pgTable('meals', {
  id:   serial('id').primaryKey(),
  date: text('date').notNull(),
  name: text('name').notNull(),
  time: text('time').notNull(),
})

export const mealFoods = pgTable('meal_foods', {
  id:       serial('id').primaryKey(),
  mealId:   integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  name:     text('name').notNull(),
  calories: integer('calories').notNull(),
  protein:  numeric('protein', { precision: 6, scale: 1 }).notNull(),
  fat:      numeric('fat',     { precision: 6, scale: 1 }).notNull(),
  carbs:    numeric('carbs',   { precision: 6, scale: 1 }).notNull(),
  sugar:    numeric('sugar',   { precision: 6, scale: 1 }).notNull(),
})

export const goals = pgTable('goals', {
  id:       serial('id').primaryKey(),
  date:     text('date').notNull().unique(),
  calories: integer('calories').notNull(),
  protein:  integer('protein').notNull(),
  fat:      integer('fat').notNull(),
  carbs:    integer('carbs').notNull(),
  sugar:    integer('sugar').notNull(),
})

// ── Relations ─────────────────────────────────────────────────
export const sessionsRelations = relations(sessions, ({ many }) => ({
  exercises: many(exercises),
}))

export const exercisesRelations = relations(exercises, ({ one }) => ({
  session: one(sessions, { fields: [exercises.sessionId], references: [sessions.id] }),
}))

export const mealsRelations = relations(meals, ({ many }) => ({
  foods: many(mealFoods),
}))

export const mealFoodsRelations = relations(mealFoods, ({ one }) => ({
  meal: one(meals, { fields: [mealFoods.mealId], references: [meals.id] }),
}))
