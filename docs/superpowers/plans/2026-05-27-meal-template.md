# 飲食模版功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓使用者建立多個命名飲食模版（整天餐點＋食物），可手動套用或設定為預設在空白天自動套用。

**Architecture:** 新增三張 DB 表儲存模版資料，新增 Server Actions 處理 CRUD 與套用邏輯，在 Nutrition Header 加入模版按鈕開啟 TemplateManagerModal；TemplateEditorModal 複用現有 AddFoodModal / EditFoodModal / MealModal。

**Tech Stack:** Next.js App Router、Drizzle ORM、Neon PostgreSQL、React（useState）、TypeScript

---

## File Map

| 動作 | 路徑 | 說明 |
|---|---|---|
| Modify | `lib/db/schema.ts` | 新增三張表 + 更新 usersRelations |
| Create | `lib/db/migrations/0012_meal_templates.sql` | drizzle-kit 自動產生 |
| Modify | `lib/types.ts` | 新增 MealTemplateFood / MealTemplateMeal / MealTemplate |
| Create | `lib/actions/meal-templates.ts` | 全部 7 個 server actions |
| Modify | `components/fitness/nutrition-tab.tsx` | export AddFoodModal、EditFoodModal、MealModal |
| Create | `components/fitness/template-manager.tsx` | TemplateAppliedToast、TemplateMealCard、TemplateEditorModal、TemplateManagerModal |
| Modify | `components/fitness/nutrition-header.tsx` | 新增 onOpenTemplates prop + 模版按鈕 |
| Modify | `components/fitness/fitness-app.tsx` | templates state、所有 handler、自動套用邏輯 |
| Modify | `app/page.tsx` | 新增 getTemplates()、initialTemplates prop |

---

## Task 1：DB Schema ＋ Migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/0012_meal_templates.sql`（drizzle-kit 產生）

- [ ] **Step 1：在 `lib/db/schema.ts` 末尾加入三張新表**

在最後一個 export const（foodCategoriesRelations）之前的 table 定義區加入：

```ts
import { pgTable, serial, text, integer, numeric, date, time, timestamp, unique, boolean } from 'drizzle-orm/pg-core'
```

（把現有第一行的 import 加上 `boolean`）

然後在 `goals` table 定義之後、relations 區塊之前加入：

```ts
export const mealTemplates = pgTable('meal_templates', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
})

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
```

- [ ] **Step 2：更新 usersRelations 加入 mealTemplates**

將現有的：
```ts
export const usersRelations = relations(users, ({ many }) => ({
  sessions:       many(sessions),
  meals:          many(meals),
  goals:          many(goals),
  foodCatalog:    many(foodCatalog),
  foodCategories: many(foodCategories),
}))
```
改為：
```ts
export const usersRelations = relations(users, ({ many }) => ({
  sessions:       many(sessions),
  meals:          many(meals),
  goals:          many(goals),
  foodCatalog:    many(foodCatalog),
  foodCategories: many(foodCategories),
  mealTemplates:  many(mealTemplates),
}))
```

- [ ] **Step 3：在 schema.ts 末尾加入三組 relations**

```ts
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
```

- [ ] **Step 4：產生 Migration**

```bash
npx drizzle-kit generate
```

預期：在 `lib/db/migrations/` 產生 `0012_<random-name>.sql`，內容為建立三張表的 SQL。

- [ ] **Step 5：套用 Migration**

```bash
npx drizzle-kit migrate
```

預期：輸出包含 `Applying migration 0012_...` 且無 error。

- [ ] **Step 6：Commit**

```bash
git add lib/db/schema.ts lib/db/migrations/
git commit -m "feat(db): 新增 meal_templates / meal_template_meals / meal_template_foods 三張表"
```

---

## Task 2：型別定義

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1：在 `lib/types.ts` 末尾加入三個型別**

```ts
export type MealTemplateFood = {
  id: number
  catalogFoodId?: number
  amountG?: number
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export type MealTemplateMeal = {
  id: number
  name: string
  time: string      // '—' 表示無時間
  sortOrder: number
  foods: MealTemplateFood[]
}

export type MealTemplate = {
  id: number
  name: string
  isDefault: boolean
  meals: MealTemplateMeal[]
}
```

- [ ] **Step 2：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 3：Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): 新增 MealTemplate 相關型別"
```

---

## Task 3：Server Actions

**Files:**
- Create: `lib/actions/meal-templates.ts`

- [ ] **Step 1：建立 `lib/actions/meal-templates.ts`**

```ts
'use server'

import { db } from '@/lib/db'
import {
  mealTemplates, mealTemplateMeals, mealTemplateFoods,
  meals, mealFoods,
} from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
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

export async function applyTemplate(templateId: number, date: string): Promise<Meal[]> {
  const { userId } = await verifySession()

  // Guard：若已有餐點，拋出錯誤
  const existing = await db.query.meals.findMany({
    where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.date, date)),
  })
  if (existing.length > 0) throw new Error('ALREADY_HAS_MEALS')

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
```

- [ ] **Step 2：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 3：Commit**

```bash
git add lib/actions/meal-templates.ts
git commit -m "feat(actions): 新增 meal-templates server actions"
```

---

## Task 4：Export shared UI components

**Files:**
- Modify: `components/fitness/nutrition-tab.tsx`

- [ ] **Step 1：在 nutrition-tab.tsx 中將三個 function 改為 export**

找到以下三個 function 定義（均為 `function` 關鍵字開頭），各自在前面加上 `export`：

```ts
// 找到：
function AddFoodModal(...)
// 改為：
export function AddFoodModal(...)

// 找到：
function EditFoodModal(...)
// 改為：
export function EditFoodModal(...)

// 找到：
function MealModal(...)
// 改為：
export function MealModal(...)
```

- [ ] **Step 2：確認編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 3：Commit**

```bash
git add components/fitness/nutrition-tab.tsx
git commit -m "refactor(nutrition-tab): export AddFoodModal、EditFoodModal、MealModal 供模版編輯器複用"
```

---

## Task 5：template-manager.tsx — 基礎元件

**Files:**
- Create: `components/fitness/template-manager.tsx`

- [ ] **Step 1：建立 `components/fitness/template-manager.tsx`**（TemplateAppliedToast + TemplateMealCard）

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { MealTemplate, MealTemplateMeal, MealTemplateFood, Food } from '@/lib/types'
import { C, MACRO_COLORS } from '@/lib/fitness-constants'
import { AddFoodModal, EditFoodModal, MealModal } from '@/components/fitness/nutrition-tab'

const fmt = (n: number) => +n.toFixed(1)

// ── TemplateAppliedToast ──────────────────────────────────────

export function TemplateAppliedToast({ message, onDone }: {
  message: string
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '10px 16px',
      background: C.orange + '18',
      borderBottom: `1px solid ${C.orange}40`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 16 }}>📋</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{message}</span>
    </div>
  )
}

// ── TemplateMealCard ──────────────────────────────────────────
// 模版編輯器中的單餐卡片：顯示食物清單、可新增 / 編輯 / 刪除食物

type LocalFood = MealTemplateFood & { localId: number }
type LocalMeal = Omit<MealTemplateMeal, 'foods'> & { localId: number; foods: LocalFood[] }

export function TemplateMealCard({ meal, foodDb, onChange, onDelete }: {
  meal: LocalMeal
  foodDb: Food[]
  onChange: (updated: LocalMeal) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded]       = useState(true)
  const [showAdd, setShowAdd]         = useState(false)
  const [editingFood, setEditingFood] = useState<LocalFood | null>(null)

  const mealCal = meal.foods.reduce((s, f) => s + f.calories, 0)

  const handleAddFood = (food: Food) => {
    const lf: LocalFood = {
      localId:       Date.now(),
      id:            0,
      name:          food.name,
      catalogFoodId: food.catalogFoodId,
      amountG:       food.amountG,
      calories:      food.calories,
      protein:       food.protein,
      fat:           food.fat,
      carbs:         food.carbs,
    }
    onChange({ ...meal, foods: [...meal.foods, lf] })
    setShowAdd(false)
  }

  const handleEditFood = (updated: Food) => {
    onChange({
      ...meal,
      foods: meal.foods.map(f =>
        f.localId === editingFood?.localId
          ? { ...f, name: updated.name, catalogFoodId: updated.catalogFoodId, amountG: updated.amountG,
              calories: updated.calories, protein: updated.protein, fat: updated.fat, carbs: updated.carbs }
          : f
      ),
    })
    setEditingFood(null)
  }

  const handleDeleteFood = (localId: number) => {
    onChange({ ...meal, foods: meal.foods.filter(f => f.localId !== localId) })
  }

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* 標題列 */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', padding: '11px 14px',
          cursor: 'pointer', gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{meal.name}</div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, display: 'flex', gap: 8 }}>
            {meal.time && meal.time !== '—' && (
              <span style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 99, padding: '1px 7px' }}>
                {meal.time.slice(0, 5)}
              </span>
            )}
            <span style={{ color: C.orange, fontWeight: 700 }}>{fmt(mealCal)} kcal</span>
            <span>{meal.foods.length} 項食物</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            background: C.red + '18', color: C.red, border: 'none',
            borderRadius: 7, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >刪除</button>
        <svg width="10" height="7" viewBox="0 0 10 7" style={{
          transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }}>
          <path d="M1 1l4 4 4-4" stroke={C.textSec} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {meal.foods.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: C.textTer }}>
              尚未新增食物
            </div>
          )}
          {meal.foods.map(food => (
            <div
              key={food.localId}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '8px 14px', borderBottom: `1px solid ${C.border}30`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: C.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{food.name}</div>
                <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, display: 'flex', gap: 6 }}>
                  <span style={{ color: MACRO_COLORS.protein }}>蛋白 {fmt(food.protein)}g</span>
                  <span style={{ color: MACRO_COLORS.fat }}>脂肪 {fmt(food.fat)}g</span>
                  <span style={{ color: MACRO_COLORS.carbs }}>碳水 {fmt(food.carbs)}g</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.orange }}>{fmt(food.calories)}</span>
                <span style={{ fontSize: 10, color: C.textSec }}>kcal</span>
                <button
                  onClick={() => setEditingFood(food)}
                  style={{
                    background: C.surfaceHigh, border: 'none', cursor: 'pointer',
                    color: C.textSec, fontSize: 11, fontWeight: 700,
                    padding: '3px 7px', borderRadius: 6,
                  }}
                >編輯</button>
                <button
                  onClick={() => handleDeleteFood(food.localId)}
                  style={{
                    background: C.red + '18', border: 'none', cursor: 'pointer',
                    color: C.red, fontSize: 15, lineHeight: 1,
                    padding: '3px 7px', borderRadius: 6,
                  }}
                >×</button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%', background: 'none', border: 'none',
              borderTop: `1px dashed ${C.border}`,
              padding: '10px', color: C.orange, fontSize: 13,
              fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新增食物
          </button>
        </div>
      )}

      {showAdd && (
        <AddFoodModal onAdd={handleAddFood} onClose={() => setShowAdd(false)} foodDb={foodDb} />
      )}
      {editingFood && (
        <EditFoodModal
          food={editingFood as unknown as Food}
          foodDb={foodDb}
          onSave={handleEditFood}
          onClose={() => setEditingFood(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

---

## Task 6：TemplateEditorModal

**Files:**
- Modify: `components/fitness/template-manager.tsx`（在 Task 5 基礎上繼續加入）

- [ ] **Step 1：在 template-manager.tsx 末尾加入 TemplateEditorModal**

```tsx
// ── TemplateEditorModal ───────────────────────────────────────
// 建立或編輯一個模版（名稱 + 餐點清單）

export function TemplateEditorModal({ template, foodDb, onSave, onClose }: {
  template?: MealTemplate   // undefined = 新建
  foodDb: Food[]
  onSave: (name: string, meals: Omit<MealTemplateMeal, 'id'>[]) => Promise<void>
  onClose: () => void
}) {
  const [name, setName]       = useState(template?.name ?? '')
  const [localMeals, setLocalMeals] = useState<LocalMeal[]>(
    template?.meals.map((m, i) => ({
      ...m,
      localId: m.id || Date.now() + i,
      foods:   m.foods.map(f => ({ ...f, localId: f.id || Date.now() })),
    })) ?? []
  )
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [saving, setSaving]           = useState(false)

  const valid = name.trim().length > 0

  const handleSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      await onSave(
        name.trim(),
        localMeals.map((m, i) => ({
          name:      m.name,
          time:      m.time,
          sortOrder: i,
          foods:     m.foods.map(f => ({
            id:            f.id,
            catalogFoodId: f.catalogFoodId,
            amountG:       f.amountG,
            name:          f.name,
            calories:      f.calories,
            protein:       f.protein,
            fat:           f.fat,
            carbs:         f.carbs,
          })),
        }))
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const totalCal = localMeals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.calories, 0), 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: C.bg, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: C.surfaceHigh, border: 'none', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', color: C.textSec, fontSize: 16,
          }}
        >←</button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: C.text }}>
          {template ? '編輯模版' : '新增模版'}
        </div>
        <button
          onClick={handleSave}
          disabled={!valid || saving}
          style={{
            background: valid && !saving ? C.orange : C.border,
            color: valid && !saving ? '#fff' : C.textSec,
            border: 'none', borderRadius: 10,
            padding: '8px 18px', fontSize: 13, fontWeight: 800, cursor: valid ? 'pointer' : 'not-allowed',
          }}
        >{saving ? '儲存中…' : '儲存'}</button>
      </div>

      {/* 模版名稱 */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
        <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
          模版名稱
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：減脂日、增肌日…"
          autoFocus
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
            outline: 'none', boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* 餐點清單 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {localMeals.map(meal => (
          <TemplateMealCard
            key={meal.localId}
            meal={meal}
            foodDb={foodDb}
            onChange={updated => setLocalMeals(prev => prev.map(m => m.localId === meal.localId ? updated : m))}
            onDelete={() => setLocalMeals(prev => prev.filter(m => m.localId !== meal.localId))}
          />
        ))}

        <button
          onClick={() => setShowAddMeal(true)}
          style={{
            background: C.orange + '10', border: `1.5px dashed ${C.orange}50`,
            borderRadius: 14, padding: '13px',
            color: C.orange, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新增一餐
        </button>
        <div style={{ height: 16 }} />
      </div>

      {/* 底部摘要 */}
      <div style={{
        padding: '10px 16px', borderTop: `1px solid ${C.border}`,
        background: C.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: C.textSec }}>共 {localMeals.length} 餐</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.orange }}>{fmt(totalCal)} kcal</span>
      </div>

      {showAddMeal && (
        <MealModal
          onSave={(mealName, mealTime) => {
            const lm: LocalMeal = {
              localId:   Date.now(),
              id:        0,
              name:      mealName,
              time:      mealTime,
              sortOrder: localMeals.length,
              foods:     [],
            }
            setLocalMeals(prev => [...prev, lm])
            setShowAddMeal(false)
          }}
          onClose={() => setShowAddMeal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

---

## Task 7：TemplateManagerModal

**Files:**
- Modify: `components/fitness/template-manager.tsx`（繼續加入）

- [ ] **Step 1：在 template-manager.tsx 末尾加入 TemplateManagerModal**

```tsx
// ── TemplateManagerModal ──────────────────────────────────────

export function TemplateManagerModal({
  templates, foodDb, selectedDate,
  onApply, onSaveDayAsTemplate,
  onCreate, onUpdate, onDelete, onSetDefault,
  onClose,
}: {
  templates:           MealTemplate[]
  foodDb:              Food[]
  selectedDate:        string
  onApply:             (id: number) => Promise<void>
  onSaveDayAsTemplate: (name: string) => Promise<void>
  onCreate:            (name: string, meals: Omit<MealTemplateMeal, 'id'>[]) => Promise<void>
  onUpdate:            (id: number, name: string, meals: Omit<MealTemplateMeal, 'id'>[]) => Promise<void>
  onDelete:            (id: number) => Promise<void>
  onSetDefault:        (id: number | null) => Promise<void>
  onClose:             () => void
}) {
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | 'new' | null>(null)
  const [menuOpenId, setMenuOpenId]           = useState<number | null>(null)
  const [saveDayMode, setSaveDayMode]         = useState(false)
  const [saveDayName, setSaveDayName]         = useState('')
  const [applying, setApplying]               = useState<number | null>(null)

  const handleApply = async (id: number) => {
    setApplying(id)
    try { await onApply(id) } finally { setApplying(null) }
    onClose()
  }

  const handleSaveDay = async () => {
    if (!saveDayName.trim()) return
    await onSaveDayAsTemplate(saveDayName.trim())
    setSaveDayMode(false)
    setSaveDayName('')
  }

  if (editingTemplate !== null) {
    return (
      <TemplateEditorModal
        template={editingTemplate === 'new' ? undefined : editingTemplate}
        foodDb={foodDb}
        onSave={async (name, meals) => {
          if (editingTemplate === 'new') {
            await onCreate(name, meals)
          } else {
            await onUpdate(editingTemplate.id, name, meals)
          }
        }}
        onClose={() => setEditingTemplate(null)}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: '20px 20px 0 0', padding: '20px 20px 32px',
        width: '100%', maxWidth: 430, maxHeight: '85dvh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* 標題 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>飲食模版</div>
          <button onClick={onClose} style={{
            background: C.border, border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.textSec, fontSize: 16,
          }}>×</button>
        </div>

        {/* 快捷操作 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0 }}>
          <button
            onClick={() => setEditingTemplate('new')}
            style={{
              flex: 1, background: C.orange + '12', border: `1.5px dashed ${C.orange}50`,
              borderRadius: 10, padding: '10px', cursor: 'pointer',
              color: C.orange, fontSize: 12, fontWeight: 700,
            }}
          >＋ 新增模版</button>
          <button
            onClick={() => setSaveDayMode(p => !p)}
            style={{
              flex: 1, background: C.surfaceHigh, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px', cursor: 'pointer',
              color: C.textSec, fontSize: 12, fontWeight: 700,
            }}
          >📋 另存今天</button>
        </div>

        {/* 另存今天：輸入名稱 */}
        {saveDayMode && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 12, flexShrink: 0,
          }}>
            <div style={{ fontSize: 11, color: C.textSec, fontWeight: 700, marginBottom: 8 }}>輸入模版名稱</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={saveDayName}
                onChange={e => setSaveDayName(e.target.value)}
                placeholder="例：今天的飲食"
                autoFocus
                style={{
                  flex: 1, background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '8px 12px', color: C.text,
                  fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={handleSaveDay}
                disabled={!saveDayName.trim()}
                style={{
                  background: saveDayName.trim() ? C.orange : C.border,
                  color: saveDayName.trim() ? '#fff' : C.textSec,
                  border: 'none', borderRadius: 8, padding: '8px 14px',
                  fontSize: 12, fontWeight: 700, cursor: saveDayName.trim() ? 'pointer' : 'not-allowed',
                }}
              >儲存</button>
            </div>
          </div>
        )}

        {/* 模版清單 */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: C.textTer }}>
              尚無模版，點「新增模版」或「另存今天」開始建立
            </div>
          )}
          {templates.map(t => {
            const totalCal = t.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.calories, 0), 0)
            return (
              <div
                key={t.id}
                style={{
                  background: C.surface,
                  border: `1px solid ${t.isDefault ? C.orange + '50' : C.border}`,
                  borderRadius: 14, padding: '12px 14px',
                  position: 'relative' as const,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{t.name}</span>
                    {t.isDefault && (
                      <span style={{
                        fontSize: 10, background: C.orange + '20', color: C.orange,
                        border: `1px solid ${C.orange}50`, borderRadius: 99, padding: '2px 7px', fontWeight: 700,
                      }}>預設</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleApply(t.id)}
                      disabled={applying === t.id}
                      style={{
                        background: C.orange + '15', border: 'none', borderRadius: 8,
                        padding: '5px 10px', fontSize: 11, fontWeight: 700,
                        color: C.orange, cursor: 'pointer',
                      }}
                    >{applying === t.id ? '套用中…' : '套用'}</button>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === t.id ? null : t.id)}
                      style={{
                        background: C.surfaceHigh, border: 'none', borderRadius: 8,
                        padding: '5px 8px', fontSize: 14, color: C.textSec, cursor: 'pointer',
                      }}
                    >⋯</button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.textSec }}>
                  {t.meals.map(m => m.name).join('・')} — {t.meals.length} 餐 / 共 {Math.round(totalCal).toLocaleString()} kcal
                </div>

                {/* ⋯ 選單 */}
                {menuOpenId === t.id && (
                  <>
                    <div
                      onClick={() => setMenuOpenId(null)}
                      style={{ position: 'fixed', inset: 0, zIndex: 1 }}
                    />
                    <div style={{
                      position: 'absolute', top: 44, right: 14, zIndex: 2,
                      background: C.surfaceHigh, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: 6,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      minWidth: 160,
                    }}>
                      <button
                        onClick={async () => {
                          await onSetDefault(t.isDefault ? null : t.id)
                          setMenuOpenId(null)
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left' as const,
                          background: 'none', border: 'none', padding: '9px 12px',
                          fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', borderRadius: 8,
                        }}
                      >{t.isDefault ? '⭐ 取消預設' : '⭐ 設為預設'}</button>
                      <button
                        onClick={() => { setEditingTemplate(t); setMenuOpenId(null) }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left' as const,
                          background: 'none', border: 'none', padding: '9px 12px',
                          fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', borderRadius: 8,
                        }}
                      >✏️ 編輯模版</button>
                      <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                      <button
                        onClick={async () => {
                          if (window.confirm(`刪除「${t.name}」模版？`)) {
                            await onDelete(t.id)
                          }
                          setMenuOpenId(null)
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left' as const,
                          background: 'none', border: 'none', padding: '9px 12px',
                          fontSize: 13, fontWeight: 600, color: C.red, cursor: 'pointer', borderRadius: 8,
                        }}
                      >🗑 刪除</button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 3：Commit**

```bash
git add components/fitness/template-manager.tsx
git commit -m "feat(ui): 新增 TemplateAppliedToast、TemplateMealCard、TemplateEditorModal、TemplateManagerModal"
```

---

## Task 8：NutritionHeader 修改

**Files:**
- Modify: `components/fitness/nutrition-header.tsx`

- [ ] **Step 1：在 `NutritionHeaderProps` 型別中新增 `onOpenTemplates`**

將現有：
```ts
export type NutritionHeaderProps = {
  selectedDate:      string
  calendarOpen:      boolean
  calendarViewMonth: string
  activeDates:       string[]
  onToggleCalendar:  () => void
  onSelectDate:      (date: string) => void
  onChangeMonth:     (year: number, month: number) => void
}
```
改為：
```ts
export type NutritionHeaderProps = {
  selectedDate:      string
  calendarOpen:      boolean
  calendarViewMonth: string
  activeDates:       string[]
  onToggleCalendar:  () => void
  onSelectDate:      (date: string) => void
  onChangeMonth:     (year: number, month: number) => void
  onOpenTemplates:   () => void
}
```

- [ ] **Step 2：在 `NutritionHeader` function 參數中解構 `onOpenTemplates`**

將現有：
```ts
export function NutritionHeader({
  selectedDate,
  calendarOpen,
  calendarViewMonth,
  activeDates,
  onToggleCalendar,
  onSelectDate,
  onChangeMonth,
}: NutritionHeaderProps) {
```
改為：
```ts
export function NutritionHeader({
  selectedDate,
  calendarOpen,
  calendarViewMonth,
  activeDates,
  onToggleCalendar,
  onSelectDate,
  onChangeMonth,
  onOpenTemplates,
}: NutritionHeaderProps) {
```

- [ ] **Step 3：在 Header 列右側加入模版按鈕**

找到現有的日曆 icon 按鈕（`aria-label={calendarOpen ? '關閉日曆' : '開啟日曆'}`）前面，加入模版按鈕。

將：
```tsx
        {/* 日曆 icon 按鈕 */}
        <button
          type="button"
          onClick={onToggleCalendar}
```
改為：
```tsx
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* 模版按鈕 */}
          <button
            type="button"
            onClick={onOpenTemplates}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: C.orange + '20', border: `1px solid ${C.orange}50`,
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            }}
            aria-label="開啟模版管理"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1"  width="12" height="3" rx="1" stroke={C.orange} strokeWidth="1.4"/>
              <rect x="1" y="6"  width="12" height="3" rx="1" stroke={C.orange} strokeWidth="1.4"/>
              <rect x="1" y="11" width="7"  height="2" rx="1" fill={C.orange}/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>模版</span>
          </button>

          {/* 日曆 icon 按鈕 */}
          <button
            type="button"
            onClick={onToggleCalendar}
```

然後在現有的日曆按鈕的結尾 `</button>` 後面加上 `</div>`，把兩個按鈕包在這個 div 裡。

- [ ] **Step 4：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 5：Commit**

```bash
git add components/fitness/nutrition-header.tsx
git commit -m "feat(nutrition-header): 新增模版按鈕"
```

---

## Task 9：FitnessApp ＋ page.tsx 整合

**Files:**
- Modify: `components/fitness/fitness-app.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1：在 `fitness-app.tsx` 新增 imports**

在現有 import 區塊末尾加入：
```ts
import * as templateActions  from '@/lib/actions/meal-templates'
import { TemplateManagerModal, TemplateAppliedToast } from '@/components/fitness/template-manager'
import type { MealTemplate, MealTemplateMeal } from '@/lib/types'
```

- [ ] **Step 2：在 Props 型別中新增 `initialTemplates`**

將：
```ts
type Props = {
  initialSessions:     Session[]
  initialFoodDb:       Food[]
  initialCategories:   FoodCategory[]
  initialGoals:        Goals
  initialNutritionDay: NutritionDay
}
```
改為：
```ts
type Props = {
  initialSessions:     Session[]
  initialFoodDb:       Food[]
  initialCategories:   FoodCategory[]
  initialGoals:        Goals
  initialNutritionDay: NutritionDay
  initialTemplates:    MealTemplate[]
}
```

- [ ] **Step 3：在 `FitnessApp` function 中新增解構與 state**

在 `FitnessApp({ ..., initialNutritionDay }: Props)` 的解構中加入 `initialTemplates`：
```ts
export function FitnessApp({ initialSessions, initialFoodDb, initialCategories, initialGoals, initialNutritionDay, initialTemplates }: Props) {
```

在現有 state 宣告區尾端加入：
```ts
  const [templates,     setTemplates]     = useState<MealTemplate[]>(initialTemplates)
  const [showTemplates, setShowTemplates] = useState(false)
  const [toastMessage,  setToastMessage]  = useState<string | null>(null)
```

- [ ] **Step 4：修改 `handleSelectDate` 加入自動套用邏輯**

將現有的 `handleSelectDate`：
```ts
  const handleSelectDate = async (date: string) => {
    setCalendarOpen(false)
    setSelectedDate(date)
    setNutritionLoading(true)
    try {
      const day = await nutritionActions.getNutritionDay(date)
      setNutritionDay(day)
    } finally {
      setNutritionLoading(false)
    }
  }
```
改為：
```ts
  const handleSelectDate = async (date: string) => {
    setCalendarOpen(false)
    setSelectedDate(date)
    setNutritionLoading(true)
    try {
      const day = await nutritionActions.getNutritionDay(date)
      if (day.meals.length === 0) {
        const defaultTemplate = templates.find(t => t.isDefault)
        if (defaultTemplate) {
          try {
            const newMeals = await templateActions.applyTemplate(defaultTemplate.id, date)
            setNutritionDay({ ...day, meals: newMeals })
            setToastMessage(`已套用預設模版「${defaultTemplate.name}」`)
          } catch {
            // ALREADY_HAS_MEALS 或其他錯誤，靜默顯示空白天
            setNutritionDay(day)
          }
        } else {
          setNutritionDay(day)
        }
      } else {
        setNutritionDay(day)
      }
    } finally {
      setNutritionLoading(false)
    }
  }
```

- [ ] **Step 5：加入所有 template handlers**

在 `// ── Nutrition CRUD ────────────────────────────────────────` 區塊之後加入：

```ts
  // ── Template CRUD ────────────────────────────────────────
  const handleOpenTemplates = () => setShowTemplates(true)

  const handleApplyTemplate = async (templateId: number) => {
    const newMeals = await templateActions.applyTemplate(templateId, selectedDate)
    setNutritionDay(prev => ({ ...prev, meals: newMeals }))
    const t = templates.find(t => t.id === templateId)
    if (t) setToastMessage(`已套用模版「${t.name}」`)
  }

  const handleSaveDayAsTemplate = async (name: string) => {
    const created = await templateActions.saveDayAsTemplate(selectedDate, name)
    setTemplates(prev => [...prev, created])
  }

  const handleCreateTemplate = async (name: string, meals: Omit<MealTemplateMeal, 'id'>[]) => {
    const created = await templateActions.createTemplate(name, meals)
    setTemplates(prev => [...prev, created])
  }

  const handleUpdateTemplate = async (id: number, name: string, meals: Omit<MealTemplateMeal, 'id'>[]) => {
    const updated = await templateActions.updateTemplate(id, name, meals)
    setTemplates(prev => prev.map(t => t.id === id ? updated : t))
  }

  const handleDeleteTemplate = async (id: number) => {
    await templateActions.deleteTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const handleSetDefaultTemplate = async (id: number | null) => {
    await templateActions.setDefaultTemplate(id)
    setTemplates(prev => prev.map(t => ({ ...t, isDefault: t.id === id })))
  }
```

- [ ] **Step 6：在 NutritionHeader 加入 `onOpenTemplates` prop**

找到：
```tsx
        {tab === 'nutrition' && (
          <NutritionHeader
            selectedDate={selectedDate}
            calendarOpen={calendarOpen}
            calendarViewMonth={calendarViewMonth}
            activeDates={activeDatesCache.get(calendarViewMonth) ?? []}
            onToggleCalendar={handleToggleCalendar}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
          />
        )}
```
改為：
```tsx
        {tab === 'nutrition' && (
          <NutritionHeader
            selectedDate={selectedDate}
            calendarOpen={calendarOpen}
            calendarViewMonth={calendarViewMonth}
            activeDates={activeDatesCache.get(calendarViewMonth) ?? []}
            onToggleCalendar={handleToggleCalendar}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
            onOpenTemplates={handleOpenTemplates}
          />
        )}
```

- [ ] **Step 7：在 content div 中加入 TemplateAppliedToast**

找到：
```tsx
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'workout' && (
```
在 `{tab === 'workout'` 之前加入：
```tsx
          {tab === 'nutrition' && toastMessage && (
            <TemplateAppliedToast message={toastMessage} onDone={() => setToastMessage(null)} />
          )}
```

- [ ] **Step 8：在 return 結尾的 `<BottomTabBar>` 之前加入 TemplateManagerModal**

找到：
```tsx
        <BottomTabBar tab={tab} setTab={setTab} />
```
在它之前加入：
```tsx
        {showTemplates && (
          <TemplateManagerModal
            templates={templates}
            foodDb={foodDb}
            selectedDate={selectedDate}
            onApply={handleApplyTemplate}
            onSaveDayAsTemplate={handleSaveDayAsTemplate}
            onCreate={handleCreateTemplate}
            onUpdate={handleUpdateTemplate}
            onDelete={handleDeleteTemplate}
            onSetDefault={handleSetDefaultTemplate}
            onClose={() => setShowTemplates(false)}
          />
        )}
```

- [ ] **Step 9：確認 TypeScript 編譯正常**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 10：修改 `app/page.tsx` 加入 getTemplates**

將現有：
```ts
import { getSessions }                from '@/lib/actions/sessions'
import { getFoods }                  from '@/lib/actions/food-catalog'
import { getCategories }             from '@/lib/actions/food-categories'
import { getGoals, getNutritionDay } from '@/lib/actions/nutrition'
import { FitnessApp }                from '@/components/fitness/fitness-app'
```
改為：
```ts
import { getSessions }                from '@/lib/actions/sessions'
import { getFoods }                  from '@/lib/actions/food-catalog'
import { getCategories }             from '@/lib/actions/food-categories'
import { getGoals, getNutritionDay } from '@/lib/actions/nutrition'
import { getTemplates }              from '@/lib/actions/meal-templates'
import { FitnessApp }                from '@/components/fitness/fitness-app'
```

將現有：
```ts
  const [sessions, foodDb, categories, goals, nutritionDay] = await Promise.all([
    getSessions(),
    getFoods(),
    getCategories(),
    getGoals(),
    getNutritionDay(TODAY),
  ])

  return (
    <FitnessApp
      initialSessions={sessions}
      initialFoodDb={foodDb}
      initialCategories={categories}
      initialGoals={goals}
      initialNutritionDay={nutritionDay}
    />
  )
```
改為：
```ts
  const [sessions, foodDb, categories, goals, nutritionDay, templates] = await Promise.all([
    getSessions(),
    getFoods(),
    getCategories(),
    getGoals(),
    getNutritionDay(TODAY),
    getTemplates(),
  ])

  return (
    <FitnessApp
      initialSessions={sessions}
      initialFoodDb={foodDb}
      initialCategories={categories}
      initialGoals={goals}
      initialNutritionDay={nutritionDay}
      initialTemplates={templates}
    />
  )
```

- [ ] **Step 11：最終編譯確認**

```bash
npx tsc --noEmit
```

預期：無 error。

- [ ] **Step 12：手動驗證**

啟動開發伺服器後依序確認：

1. 飲食頁 Header 右側出現橘色「模版」按鈕
2. 點擊「模版」→ 開啟 TemplateManagerModal（初始顯示「尚無模版」）
3. 點擊「新增模版」→ 開啟 TemplateEditorModal，可輸入名稱、新增餐點、為餐點新增食物（可從食物庫選取）→ 點儲存後模版出現在清單
4. 點擊「套用」→ Modal 關閉，當天出現模版的餐點與食物
5. 切換到有記錄的日期再切回空白日期（無預設模版）→ 畫面空白，無自動套用
6. 在 ⋯ 選單中點「設為預設」→ 模版卡片出現橘色邊框 ＋「預設」標籤
7. 切換到另一個空白日期 → 自動套用，橘色 Toast 出現「已套用預設模版『xxx』」後消失
8. 點「另存今天」→ 輸入名稱 → 儲存 → 新模版出現在清單，食物與今天的記錄相同
9. 在 ⋯ 選單點「編輯模版」→ 可修改名稱與食物 → 儲存後清單更新
10. 在 ⋯ 選單點「刪除」→ confirm 後模版消失

- [ ] **Step 13：Commit**

```bash
git add components/fitness/fitness-app.tsx app/page.tsx
git commit -m "feat(fitness-app): 整合飲食模版功能 — templates state、handlers、自動套用邏輯"
```
