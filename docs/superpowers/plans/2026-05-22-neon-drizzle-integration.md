# Neon + Drizzle ORM 整合實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 FitLog 的靜態 mock 資料遷移至 Neon PostgreSQL，透過 Drizzle ORM + Next.js Server Actions 實現持久化 CRUD。

**Architecture:** `app/page.tsx` 改為 Server Component，在 server 端 fetch 初始資料並傳給新建的 `FitnessApp` Client Component；CRUD mutations 透過 Server Actions 執行，成功後用 optimistic update 更新本地 React state。

**Tech Stack:** Next.js 16 App Router、Drizzle ORM 0.40+、@neondatabase/serverless、drizzle-kit、TypeScript

---

## 檔案地圖

| 操作 | 路徑 | 職責 |
|------|------|------|
| 建立 | `lib/db/schema.ts` | Drizzle schema（6 張表 + relations） |
| 建立 | `lib/db/index.ts` | Neon + Drizzle client singleton |
| 建立 | `lib/db/seed.ts` | 將 mock 資料寫入 DB |
| 建立 | `lib/db/migrations/` | drizzle-kit 自動產生 |
| 建立 | `lib/actions/sessions.ts` | Session / Exercise Server Actions |
| 建立 | `lib/actions/nutrition.ts` | Meal / MealFood / Goals Server Actions |
| 建立 | `lib/actions/food-catalog.ts` | FoodCatalog Server Actions |
| 建立 | `components/fitness/fitness-app.tsx` | Client Component（從 page.tsx 拆出） |
| 建立 | `drizzle.config.ts` | drizzle-kit 設定 |
| 建立 | `.env.local` | DATABASE_URL（不 commit） |
| 修改 | `app/page.tsx` | 改為 async Server Component |

---

### Task 1: 安裝套件

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安裝 production 套件**

```bash
npm install drizzle-orm @neondatabase/serverless
```

Expected output: packages added, no errors.

- [ ] **Step 2: 安裝 dev 套件**

```bash
npm install -D drizzle-kit tsx
```

Expected output: packages added, no errors.

- [ ] **Step 3: 確認 package.json 包含新套件**

```bash
grep -E "drizzle|neon|tsx" package.json
```

Expected: 看到 `drizzle-orm`、`@neondatabase/serverless`、`drizzle-kit`、`tsx` 出現在輸出中。

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): 安裝 Drizzle ORM、Neon serverless driver"
```

---

### Task 2: 環境設定與 Drizzle Config

**Files:**
- Create: `.env.local`
- Create: `drizzle.config.ts`

- [ ] **Step 1: 建立 `.env.local`**

在專案根目錄建立 `.env.local`，填入你的 Neon 連線字串：

```
DATABASE_URL=postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require
```

> 注意：`.env.local` 不應 commit，請確認 `.gitignore` 已包含 `.env.local`。

- [ ] **Step 2: 確認 `.gitignore` 排除 `.env.local`**

```bash
grep "env.local" .gitignore || echo ".env.local" >> .gitignore
```

- [ ] **Step 3: 建立 `drizzle.config.ts`**

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [ ] **Step 4: Commit**

```bash
git add drizzle.config.ts .gitignore
git commit -m "chore(config): 新增 drizzle.config.ts 與 .gitignore 規則"
```

---

### Task 3: DB Client

**Files:**
- Create: `lib/db/index.ts`

- [ ] **Step 1: 建立 `lib/db/index.ts`**

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/index.ts
git commit -m "feat(db): 新增 Neon + Drizzle client singleton"
```

---

### Task 4: Schema 定義

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: 建立 `lib/db/schema.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(db): 定義 Drizzle schema（6 張表 + relations）"
```

---

### Task 5: Migration

**Files:**
- Create: `lib/db/migrations/` (drizzle-kit 自動產生)

- [ ] **Step 1: 產生 migration SQL**

```bash
npx drizzle-kit generate
```

Expected: 在 `lib/db/migrations/` 產生一個 `.sql` 檔案，內容包含 `CREATE TABLE sessions`、`CREATE TABLE exercises` 等建表語句。

- [ ] **Step 2: 檢視產生的 SQL**

```bash
cat lib/db/migrations/*.sql
```

確認 6 張表的 CREATE TABLE 語句都存在，foreign key 與 cascade 設定正確。

- [ ] **Step 3: 推送至 Neon**

```bash
npx drizzle-kit migrate
```

Expected: 輸出 `All migrations applied` 或類似成功訊息，無 error。

- [ ] **Step 4: Commit migrations**

```bash
git add lib/db/migrations/
git commit -m "feat(db): 新增初始 schema migration"
```

---

### Task 6: Seed 初始資料

**Files:**
- Create: `lib/db/seed.ts`

- [ ] **Step 1: 建立 `lib/db/seed.ts`**

```typescript
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
      calories: f.calories,
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
```

- [ ] **Step 2: 執行 seed**

```bash
npx tsx lib/db/seed.ts
```

Expected: 輸出 `Seeding sessions...`、`Seeding food catalog...`、`Seeding nutrition...`、`Seed complete.`，無 error。

- [ ] **Step 3: 驗證 seed**

```bash
npx tsx -e "
import { db } from './lib/db/index.ts'
import { sessions, foodCatalog } from './lib/db/schema.ts'
import { count } from 'drizzle-orm'
const [s] = await db.select({ n: count() }).from(sessions)
const [f] = await db.select({ n: count() }).from(foodCatalog)
console.log('sessions:', s.n, '  foods:', f.n)
"
```

Expected: `sessions: 3  foods: 10`

- [ ] **Step 4: Commit**

```bash
git add lib/db/seed.ts
git commit -m "feat(db): 新增 seed script，寫入 mock 初始資料"
```

---

### Task 7: Sessions Server Actions

**Files:**
- Create: `lib/actions/sessions.ts`

- [ ] **Step 1: 建立 `lib/actions/sessions.ts`**

```typescript
'use server'

import { db } from '@/lib/db'
import { sessions, exercises } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Session, Exercise } from '@/lib/types'

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
  const rows = await db.query.sessions.findMany({
    with: { exercises: true },
    orderBy: (t, { desc }) => [desc(t.date)],
  })
  return rows.map(r => toSession(r, r.exercises))
}

export async function createSession(data: Omit<Session, 'id'>): Promise<Session> {
  const [inserted] = await db.insert(sessions)
    .values({ name: data.name, date: data.date })
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
  await db.update(sessions)
    .set({ name: data.name, date: data.date })
    .where(eq(sessions.id, id))

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
  const exRows = await db.select().from(exercises).where(eq(exercises.sessionId, id))
  return toSession(row, exRows)
}

export async function deleteSession(id: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, id))
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/sessions.ts
git commit -m "feat(actions): 新增 sessions Server Actions（CRUD）"
```

---

### Task 8: Nutrition Server Actions

**Files:**
- Create: `lib/actions/nutrition.ts`

- [ ] **Step 1: 建立 `lib/actions/nutrition.ts`**

```typescript
'use server'

import { db } from '@/lib/db'
import { meals, mealFoods, goals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Meal, Food, Goals, NutritionDay } from '@/lib/types'
import { DEFAULT_GOALS } from '@/lib/data'

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
  const mealRows = await db.query.meals.findMany({
    where: (t, { eq }) => eq(t.date, date),
    with: { foods: true },
  })
  const dayGoals = await getGoals(date)
  return {
    goals: dayGoals,
    meals: mealRows.map(r => toMeal(r, r.foods)),
  }
}

export async function getGoals(date: string): Promise<Goals> {
  const [row] = await db.select().from(goals).where(eq(goals.date, date))
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
  await db.insert(goals)
    .values({ date, ...data })
    .onConflictDoUpdate({
      target: goals.date,
      set:    { calories: data.calories, protein: data.protein, fat: data.fat, carbs: data.carbs, sugar: data.sugar },
    })
}

export async function createMeal(date: string, data: Omit<Meal, 'id'>): Promise<Meal> {
  const [inserted] = await db.insert(meals)
    .values({ date, name: data.name, time: data.time })
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
  await db.update(meals).set({ name: data.name, time: data.time }).where(eq(meals.id, id))
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
  const foodRows = await db.select().from(mealFoods).where(eq(mealFoods.mealId, id))
  return toMeal(row, foodRows)
}

export async function deleteMeal(id: number): Promise<void> {
  await db.delete(meals).where(eq(meals.id, id))
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/nutrition.ts
git commit -m "feat(actions): 新增 nutrition Server Actions（meals、goals CRUD）"
```

---

### Task 9: Food Catalog Server Actions

**Files:**
- Create: `lib/actions/food-catalog.ts`

- [ ] **Step 1: 建立 `lib/actions/food-catalog.ts`**

```typescript
'use server'

import { db } from '@/lib/db'
import { foodCatalog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Food } from '@/lib/types'

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
  const rows = await db.select().from(foodCatalog)
  return rows.map(toFood)
}

export async function createFood(data: Omit<Food, 'id'>): Promise<Food> {
  const [inserted] = await db.insert(foodCatalog)
    .values({
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
  return toFood(updated)
}

export async function deleteFood(id: number): Promise<void> {
  await db.delete(foodCatalog).where(eq(foodCatalog.id, id))
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/food-catalog.ts
git commit -m "feat(actions): 新增 food-catalog Server Actions（CRUD）"
```

---

### Task 10: 建立 FitnessApp Client Component

將 `app/page.tsx` 中的 Client 邏輯（state、handlers、headers、tab 渲染）提取至新元件。

**Files:**
- Create: `components/fitness/fitness-app.tsx`

- [ ] **Step 1: 建立 `components/fitness/fitness-app.tsx`**

將 `app/page.tsx` 的全部內容（`'use client'` directive 至最後一行）複製至此，調整如下：

```typescript
'use client'

import { useState } from 'react'
import type { TabId, Session, Food, Goals, NutritionDay, Meal } from '@/lib/types'
import { C } from '@/lib/fitness-constants'
import * as sessionActions   from '@/lib/actions/sessions'
import * as nutritionActions from '@/lib/actions/nutrition'
import * as foodActions      from '@/lib/actions/food-catalog'
import { WorkoutTab }   from '@/components/fitness/workout-tab'
import { NutritionTab } from '@/components/fitness/nutrition-tab'
import { FoodDbTab }    from '@/components/fitness/food-db-tab'
import { SettingsTab }  from '@/components/fitness/settings-tab'
import { BottomTabBar } from '@/components/fitness/bottom-tab-bar'

// ── Tab headers（從 page.tsx 移入）────────────────────────────
function WorkoutHeader({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px 10px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>訓練紀錄</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>共 {count} 份訓練</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.accent + '20', border: `1px solid ${C.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect x="0"  y="4"  width="3" height="5"  rx="1" fill={C.accent}/>
          <rect x="3"  y="2"  width="2" height="9"  rx="1" fill={C.accent}/>
          <rect x="5"  y="6"  width="8" height="2"  rx="1" fill={C.accent}/>
          <rect x="13" y="2"  width="2" height="9"  rx="1" fill={C.accent}/>
          <rect x="15" y="4"  width="3" height="5"  rx="1" fill={C.accent}/>
        </svg>
      </div>
    </div>
  )
}

function NutritionHeader() {
  const d    = new Date()
  const days = ['日','一','二','三','四','五','六']
  const label = `${d.getMonth() + 1}月${d.getDate()}日 週${days[d.getDay()]}`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>飲食紀錄</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

// （其餘 FoodDbHeader、SettingsHeader 同樣從 page.tsx 複製，保持原樣）
```

> 注意：Task 10 只是建立骨架，Task 11 會貼入完整程式碼。在此先建立檔案並確認 imports 正確。

實際上，直接依照下方 Step 2 完成整個檔案。

- [ ] **Step 2: 寫入完整的 `components/fitness/fitness-app.tsx`**

包含原 `page.tsx` 的所有 header 元件，以及新的 `FitnessApp` export 函式：

```typescript
'use client'

import { useState } from 'react'
import type { TabId, Session, Food, Goals, NutritionDay, Meal } from '@/lib/types'
import { C } from '@/lib/fitness-constants'
import * as sessionActions   from '@/lib/actions/sessions'
import * as nutritionActions from '@/lib/actions/nutrition'
import * as foodActions      from '@/lib/actions/food-catalog'
import { WorkoutTab }   from '@/components/fitness/workout-tab'
import { NutritionTab } from '@/components/fitness/nutrition-tab'
import { FoodDbTab }    from '@/components/fitness/food-db-tab'
import { SettingsTab }  from '@/components/fitness/settings-tab'
import { BottomTabBar } from '@/components/fitness/bottom-tab-bar'

// ── 從 page.tsx 搬入的 header 元件（原封不動） ──────────────
function WorkoutHeader({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px 10px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>訓練紀錄</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>共 {count} 份訓練</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.accent + '20', border: `1px solid ${C.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect x="0"  y="4"  width="3" height="5"  rx="1" fill={C.accent}/>
          <rect x="3"  y="2"  width="2" height="9"  rx="1" fill={C.accent}/>
          <rect x="5"  y="6"  width="8" height="2"  rx="1" fill={C.accent}/>
          <rect x="13" y="2"  width="2" height="9"  rx="1" fill={C.accent}/>
          <rect x="15" y="4"  width="3" height="5"  rx="1" fill={C.accent}/>
        </svg>
      </div>
    </div>
  )
}

function NutritionHeader() {
  const d    = new Date()
  const days = ['日','一','二','三','四','五','六']
  const label = `${d.getMonth() + 1}月${d.getDate()}日 週${days[d.getDay()]}`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>飲食紀錄</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.orange + '20', border: `1px solid ${C.orange}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8"  stroke={C.orange} strokeWidth="1.6"/>
          <circle cx="10" cy="10" r="5"  stroke={C.orange} strokeWidth="1.2"/>
          <line x1="10" y1="2"    x2="10" y2="4.5"  stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="10" y1="15.5" x2="10" y2="18"   stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="2"  y1="10"   x2="4.5" y2="10"  stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="15.5" y1="10" x2="18" y2="10"   stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

function FoodDbHeader({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px 10px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>食物庫</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>共 {count} 項食物</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.orange + '20', border: `1px solid ${C.orange}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="16" viewBox="0 0 20 18" fill="none">
          <ellipse cx="10" cy="4" rx="8" ry="3" stroke={C.orange} strokeWidth="1.6"/>
          <path d="M2 4v4c0 1.66 3.58 3 8 3s8-1.34 8-3V4" stroke={C.orange} strokeWidth="1.6"/>
          <path d="M2 8v5c0 1.66 3.58 3 8 3s8-1.34 8-3V8" stroke={C.orange} strokeWidth="1.6"/>
        </svg>
      </div>
    </div>
  )
}

function SettingsHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>個人設定</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>每日飲食目標</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.accent + '20', border: `1px solid ${C.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="2.8" stroke={C.accent} strokeWidth="1.6"/>
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
            stroke={C.accent} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────
type Props = {
  initialSessions:     Session[]
  initialFoodDb:       Food[]
  initialGoals:        Goals
  initialNutritionDay: NutritionDay
}

const TODAY = new Date().toISOString().slice(0, 10)

// ── Main Client Component ─────────────────────────────────────
export function FitnessApp({ initialSessions, initialFoodDb, initialGoals, initialNutritionDay }: Props) {
  const [tab, setTab]           = useState<TabId>('workout')
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [foodDb, setFoodDb]     = useState<Food[]>(initialFoodDb)
  const [userGoals, setUserGoals] = useState<Goals>(initialGoals)
  const [nutritionDay, setNutritionDay] = useState<NutritionDay>(initialNutritionDay)

  // ── Session CRUD ──────────────────────────────────────────
  const updateSession = async (id: number, updated: Session) => {
    await sessionActions.updateSession(id, updated)
    setSessions(prev => prev.map(s => s.id === id ? updated : s))
  }
  const deleteSession = async (id: number) => {
    await sessionActions.deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }
  const addSession = async (s: Session) => {
    const created = await sessionActions.createSession(s)
    setSessions(prev => [created, ...prev])
  }

  // ── Food DB CRUD ──────────────────────────────────────────
  const addFoodToDb = async (f: Food) => {
    const created = await foodActions.createFood(f)
    setFoodDb(prev => [...prev, created])
  }
  const editFoodInDb = async (f: Food) => {
    const updated = await foodActions.updateFood(f.id, f)
    setFoodDb(prev => prev.map(x => x.id === f.id ? updated : x))
  }
  const deleteFoodFromDb = async (id: number) => {
    await foodActions.deleteFood(id)
    setFoodDb(prev => prev.filter(x => x.id !== id))
  }

  // ── Nutrition CRUD ────────────────────────────────────────
  const updateMeal = async (id: number, updated: Meal) => {
    const result = await nutritionActions.updateMeal(id, updated)
    setNutritionDay(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === id ? result : m),
    }))
  }
  const addMeal = async (meal: Meal) => {
    const created = await nutritionActions.createMeal(TODAY, meal)
    setNutritionDay(prev => ({
      ...prev,
      meals: [...prev.meals, created],
    }))
  }
  const deleteMeal = async (id: number) => {
    await nutritionActions.deleteMeal(id)
    setNutritionDay(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id),
    }))
  }
  const saveGoals = async (g: Goals) => {
    await nutritionActions.upsertGoals(TODAY, g)
    setUserGoals(g)
    setNutritionDay(prev => ({ ...prev, goals: g }))
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'stretch',
      minHeight: '100dvh', background: '#050505',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: C.bg,
        position: 'relative', overflow: 'hidden',
      }}>
        {tab === 'workout'   && <WorkoutHeader   count={sessions.length} />}
        {tab === 'nutrition' && <NutritionHeader />}
        {tab === 'fooddb'    && <FoodDbHeader    count={foodDb.length} />}
        {tab === 'settings'  && <SettingsHeader />}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'workout' && (
            <WorkoutTab
              sessions={sessions}
              onUpdateSession={updateSession}
              onDeleteSession={deleteSession}
              onAddSession={addSession}
            />
          )}
          {tab === 'nutrition' && (
            <NutritionTab
              nutritionDay={nutritionDay}
              onUpdateMeal={updateMeal}
              onAddMeal={addMeal}
              onDeleteMeal={deleteMeal}
              foodDb={foodDb}
              goals={userGoals}
            />
          )}
          {tab === 'fooddb' && (
            <FoodDbTab
              foodDb={foodDb}
              onAdd={addFoodToDb}
              onEdit={editFoodInDb}
              onDelete={deleteFoodFromDb}
            />
          )}
          {tab === 'settings' && (
            <SettingsTab goals={userGoals} onSave={saveGoals} />
          )}
        </div>

        <BottomTabBar tab={tab} setTab={setTab} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/fitness/fitness-app.tsx
git commit -m "feat(ui): 提取 FitnessApp Client Component，接入 Server Actions"
```

---

### Task 11: 重構 app/page.tsx 為 Server Component

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 將 `app/page.tsx` 改寫為 async Server Component**

用以下內容完全取代 `app/page.tsx`：

```typescript
import { getSessions } from '@/lib/actions/sessions'
import { getFoods }    from '@/lib/actions/food-catalog'
import { getGoals, getNutritionDay } from '@/lib/actions/nutrition'
import { FitnessApp }  from '@/components/fitness/fitness-app'

const TODAY = new Date().toISOString().slice(0, 10)

export default async function Page() {
  const [sessions, foodDb, goals, nutritionDay] = await Promise.all([
    getSessions(),
    getFoods(),
    getGoals(TODAY),
    getNutritionDay(TODAY),
  ])

  return (
    <FitnessApp
      initialSessions={sessions}
      initialFoodDb={foodDb}
      initialGoals={goals}
      initialNutritionDay={nutritionDay}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "refactor(page): 改為 Server Component，初始資料從 Neon 取得"
```

---

### Task 12: 驗證與 Smoke Test

- [ ] **Step 1: 啟動開發伺服器**

```bash
npm run dev
```

Expected: 無編譯錯誤，伺服器在 http://localhost:3000 啟動。

- [ ] **Step 2: 開啟瀏覽器並確認初始資料**

打開 http://localhost:3000，確認：
- 「訓練紀錄」tab 顯示 3 份訓練（推日、拉日、腿日）
- 「食物資料庫」tab 顯示 10 項食物
- 「飲食紀錄」tab 顯示今日餐點（若有）

- [ ] **Step 3: 測試 CRUD（訓練）**

1. 點擊任一訓練，確認展開顯示動作清單
2. 新增一份訓練，確認出現在清單頂部
3. 刪除剛新增的訓練，確認消失

- [ ] **Step 4: 測試 CRUD（食物庫）**

1. 在「食物資料庫」新增一筆食物
2. 編輯該食物
3. 刪除該食物

- [ ] **Step 5: 測試目標儲存**

1. 進入「設定」修改卡路里目標
2. 重新整理頁面
3. 確認修改後的值仍然存在（驗證 DB 持久化）

- [ ] **Step 6: TypeScript 型別檢查**

```bash
npx tsc --noEmit
```

Expected: 無型別錯誤輸出。

- [ ] **Step 7: 最終 Commit**

```bash
git add -A
git commit -m "feat(db): 完成 Neon + Drizzle ORM 整合，資料層全面接入 PostgreSQL"
```

---

## 補充說明

### `numeric` 型別轉換

Drizzle 的 `numeric` 欄位從 DB 讀出時是 `string`（PostgreSQL NUMERIC 行為）。所有 Server Actions 中的 `toFood`、`toExercise` 函式都已加入 `Number(row.xxx)` 轉換，確保回傳給元件的值是 `number`。

### FoodDbHeader / SettingsHeader

Task 10 Step 2 中，`FoodDbHeader` 與 `SettingsHeader` 需從原 `app/page.tsx` 完整複製，避免 UI 差異。

### goals fallback

`getGoals(date)` 在 DB 無該日期記錄時，回傳 `DEFAULT_GOALS`（從 `lib/data.ts` 匯入）。`lib/data.ts` 保持不動，僅用作 fallback 來源。
