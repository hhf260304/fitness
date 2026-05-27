import { pgTable, serial, text, integer, numeric, date, time, timestamp, unique, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id:             serial('id').primaryKey(),
  email:          text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  date:      date('date').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
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

export const foodCategories = pgTable('food_categories', {
  id:     serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:   text('name').notNull(),
}, (t) => [
  unique('food_categories_user_name_unique').on(t.userId, t.name),
])

export const foodCatalog = pgTable('food_catalog', {
  id:          serial('id').primaryKey(),
  userId:      integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  servingSize: numeric('serving_size', { precision: 7, scale: 1 }).notNull().default('100'),
  calories:    numeric('calories', { precision: 7, scale: 1 }).notNull(),
  protein:     numeric('protein', { precision: 6, scale: 1 }).notNull(),
  fat:         numeric('fat',     { precision: 6, scale: 1 }).notNull(),
  carbs:       numeric('carbs',   { precision: 6, scale: 1 }).notNull(),
  categoryId:  integer('category_id').references(() => foodCategories.id, { onDelete: 'set null' }),
}, (t) => [
  unique('food_catalog_user_name_unique').on(t.userId, t.name),
])

export const meals = pgTable('meals', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  date:      date('date').notNull(),
  name:      text('name').notNull(),
  time:      time('time'),
  sortOrder: integer('sort_order').default(0).notNull(),
})

export const mealFoods = pgTable('meal_foods', {
  id:            serial('id').primaryKey(),
  mealId:        integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  catalogFoodId: integer('catalog_food_id').references(() => foodCatalog.id, { onDelete: 'set null' }),
  amountG:       numeric('amount_g', { precision: 8, scale: 1 }),
  name:          text('name').notNull(),
  calories:      numeric('calories', { precision: 7, scale: 1 }).notNull(),
  protein:       numeric('protein', { precision: 6, scale: 1 }).notNull(),
  fat:           numeric('fat',     { precision: 6, scale: 1 }).notNull(),
  carbs:         numeric('carbs',   { precision: 6, scale: 1 }).notNull(),
})

export const goals = pgTable('goals', {
  id:       serial('id').primaryKey(),
  userId:   integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  calories: integer('calories').notNull(),
  protein:  integer('protein').notNull(),
  fat:      integer('fat').notNull(),
  carbs:    integer('carbs').notNull(),
})

export const mealTemplates = pgTable('meal_templates', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
}, (t) => [
  uniqueIndex('meal_templates_user_default_unique').on(t.userId).where(sql`${t.isDefault} = true`),
])

export const mealTemplateMeals = pgTable('meal_template_meals', {
  id:         serial('id').primaryKey(),
  templateId: integer('template_id').notNull().references(() => mealTemplates.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  time:       time('time'),
  sortOrder:  integer('sort_order').notNull().default(0),
})

export const mealTemplateFoods = pgTable('meal_template_foods', {
  id:             serial('id').primaryKey(),
  templateMealId: integer('template_meal_id').notNull().references(() => mealTemplateMeals.id, { onDelete: 'cascade' }),
  catalogFoodId:  integer('catalog_food_id').references(() => foodCatalog.id, { onDelete: 'set null' }),
  amountG:        numeric('amount_g', { precision: 8, scale: 1 }),
  name:           text('name').notNull(),
  calories:       numeric('calories', { precision: 7, scale: 1 }).notNull(),
  protein:        numeric('protein',  { precision: 6, scale: 1 }).notNull(),
  fat:            numeric('fat',      { precision: 6, scale: 1 }).notNull(),
  carbs:          numeric('carbs',    { precision: 6, scale: 1 }).notNull(),
})

// ── Relations ─────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions:       many(sessions),
  meals:          many(meals),
  goals:          many(goals),
  foodCatalog:    many(foodCatalog),
  foodCategories: many(foodCategories),
  mealTemplates:  many(mealTemplates),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user:      one(users, { fields: [sessions.userId], references: [users.id] }),
  exercises: many(exercises),
}))

export const exercisesRelations = relations(exercises, ({ one }) => ({
  session: one(sessions, { fields: [exercises.sessionId], references: [sessions.id] }),
}))

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user:  one(users, { fields: [meals.userId], references: [users.id] }),
  foods: many(mealFoods),
}))

export const mealFoodsRelations = relations(mealFoods, ({ one }) => ({
  meal: one(meals, { fields: [mealFoods.mealId], references: [meals.id] }),
}))

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}))

export const foodCatalogRelations = relations(foodCatalog, ({ one }) => ({
  user:     one(users,          { fields: [foodCatalog.userId],     references: [users.id] }),
  category: one(foodCategories, { fields: [foodCatalog.categoryId], references: [foodCategories.id] }),
}))

export const foodCategoriesRelations = relations(foodCategories, ({ one, many }) => ({
  user:  one(users,       { fields: [foodCategories.userId], references: [users.id] }),
  foods: many(foodCatalog),
}))

export const mealTemplatesRelations = relations(mealTemplates, ({ one, many }) => ({
  user:  one(users, { fields: [mealTemplates.userId], references: [users.id] }),
  meals: many(mealTemplateMeals),
}))

export const mealTemplateMealsRelations = relations(mealTemplateMeals, ({ one, many }) => ({
  template: one(mealTemplates, { fields: [mealTemplateMeals.templateId], references: [mealTemplates.id] }),
  foods:    many(mealTemplateFoods),
}))

export const mealTemplateFoodsRelations = relations(mealTemplateFoods, ({ one }) => ({
  templateMeal: one(mealTemplateMeals, { fields: [mealTemplateFoods.templateMealId], references: [mealTemplateMeals.id] }),
}))
