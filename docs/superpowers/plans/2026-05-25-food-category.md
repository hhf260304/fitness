# 食物庫分類功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為食物庫新增分類功能，讓使用者可建立/改名/刪除分類，並在食物庫頁面以篩選 Chip 快速過濾同類食物。

**Architecture:** 新增獨立的 `food_categories` 表（關聯 `users`），`food_catalog` 加 `category_id` FK（刪除時 SET NULL）。分類 CRUD 放在新的 server actions 檔案，食物 actions 更新以 LEFT JOIN 帶入分類名稱。UI 在 `FoodDbTab` 加入 Chip 列 + 管理分類 Sheet，表單加分類下拉欄位。

**Tech Stack:** Next.js 15 App Router、Drizzle ORM、Neon PostgreSQL、React（inline style，無 CSS framework）

---

## File Map

| 狀態 | 路徑 | 說明 |
|---|---|---|
| 新增 | `lib/db/migrations/0010_food_categories.sql` | DB migration |
| 新增 | `lib/actions/food-categories.ts` | 分類 CRUD server actions |
| 新增 | `components/fitness/category-manager-sheet.tsx` | 管理分類 Sheet UI |
| 修改 | `lib/db/schema.ts` | 加 `foodCategories` 表 + `categoryId` FK |
| 修改 | `lib/db/migrations/meta/_journal.json` | 登記新 migration |
| 修改 | `lib/types.ts` | 加 `FoodCategory` 型別；`Food` 加 `categoryId`/`categoryName` |
| 修改 | `lib/actions/food-catalog.ts` | `getFoods` 加 JOIN；`createFood`/`updateFood` 加 `categoryId` |
| 修改 | `app/page.tsx` | 初始載入分類資料 |
| 修改 | `components/fitness/fitness-app.tsx` | 傳遞 `categories` state 給 `FoodDbTab` |
| 修改 | `components/fitness/food-db-tab.tsx` | Chip 列、管理分類按鈕、表單分類欄位 |

---

## Task 1: DB Schema & Migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/0010_food_categories.sql`
- Modify: `lib/db/migrations/meta/_journal.json`

- [ ] **Step 1.1: 在 schema.ts 新增 `foodCategories` 表**

  開啟 `lib/db/schema.ts`。在 `import` 行加入 `unique`（已有），確認無誤後，在 `foodCatalog` 定義前插入：

  ```ts
  export const foodCategories = pgTable('food_categories', {
    id:     serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    name:   text('name').notNull(),
  }, (t) => [
    unique('food_categories_user_name_unique').on(t.userId, t.name),
  ])
  ```

- [ ] **Step 1.2: 在 `foodCatalog` 表加 `categoryId` 欄位**

  在 `foodCatalog` 的欄位清單結尾加入（放在 `carbs` 之後，`}, (t) =>` 之前）：

  ```ts
  categoryId: integer('category_id').references(() => foodCategories.id, { onDelete: 'set null' }),
  ```

- [ ] **Step 1.3: 更新 Relations**

  將 `usersRelations` 加入 `foodCategories: many(foodCategories)`：

  ```ts
  export const usersRelations = relations(users, ({ many }) => ({
    sessions:       many(sessions),
    meals:          many(meals),
    goals:          many(goals),
    foodCatalog:    many(foodCatalog),
    foodCategories: many(foodCategories),
  }))
  ```

  將 `foodCatalogRelations` 加入 `category`：

  ```ts
  export const foodCatalogRelations = relations(foodCatalog, ({ one }) => ({
    user:     one(users,          { fields: [foodCatalog.userId],     references: [users.id] }),
    category: one(foodCategories, { fields: [foodCatalog.categoryId], references: [foodCategories.id] }),
  }))
  ```

  在最後新增 `foodCategoriesRelations`：

  ```ts
  export const foodCategoriesRelations = relations(foodCategories, ({ one, many }) => ({
    user:  one(users,       { fields: [foodCategories.userId], references: [users.id] }),
    foods: many(foodCatalog),
  }))
  ```

- [ ] **Step 1.4: 建立 migration SQL**

  建立 `lib/db/migrations/0010_food_categories.sql`：

  ```sql
  CREATE TABLE "food_categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer REFERENCES "users"("id") ON DELETE cascade,
    "name" text NOT NULL,
    CONSTRAINT "food_categories_user_name_unique" UNIQUE("user_id","name")
  );
  --> statement-breakpoint
  ALTER TABLE "food_catalog" ADD COLUMN "category_id" integer REFERENCES "food_categories"("id") ON DELETE set null;
  ```

- [ ] **Step 1.5: 更新 `_journal.json`**

  在 `lib/db/migrations/meta/_journal.json` 的 `entries` 陣列最後加入：

  ```json
  {
    "idx": 10,
    "version": "7",
    "when": 1779687137291,
    "tag": "0010_food_categories",
    "breakpoints": true
  }
  ```

- [ ] **Step 1.6: 執行 migration**

  ```bash
  npx drizzle-kit migrate
  ```

  預期輸出包含 `0010_food_categories` 已套用成功，無錯誤。

- [ ] **Step 1.7: Commit**

  ```bash
  git add lib/db/schema.ts lib/db/migrations/0010_food_categories.sql lib/db/migrations/meta/_journal.json
  git commit -m "feat(db): 新增 food_categories 表與 food_catalog.category_id 欄位"
  ```

---

## Task 2: Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 2.1: 加入 `FoodCategory` 型別**

  在 `lib/types.ts` 末尾加入：

  ```ts
  export type FoodCategory = {
    id: number
    name: string
  }
  ```

- [ ] **Step 2.2: 擴充 `Food` 型別**

  在 `Food` type 的 `carbs` 欄位後加入：

  ```ts
  categoryId?:   number | null
  categoryName?: string | null
  ```

- [ ] **Step 2.3: 確認 TypeScript 編譯**

  ```bash
  npx tsc --noEmit
  ```

  預期：無型別錯誤（可能有 `categoryId` 未使用的警告，後續 Task 會修正）。

- [ ] **Step 2.4: Commit**

  ```bash
  git add lib/types.ts
  git commit -m "feat(types): 新增 FoodCategory 型別，Food 加 categoryId/categoryName"
  ```

---

## Task 3: Category Server Actions

**Files:**
- Create: `lib/actions/food-categories.ts`

- [ ] **Step 3.1: 建立 `lib/actions/food-categories.ts`**

  ```ts
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
  ```

- [ ] **Step 3.2: 確認 TypeScript 編譯**

  ```bash
  npx tsc --noEmit
  ```

  預期：無錯誤。

- [ ] **Step 3.3: Commit**

  ```bash
  git add lib/actions/food-categories.ts
  git commit -m "feat(actions): 新增分類 CRUD server actions"
  ```

---

## Task 4: 更新 Food Catalog Actions

**Files:**
- Modify: `lib/actions/food-catalog.ts`

- [ ] **Step 4.1: 更新 `toFood` 函式以接受 `categoryName`**

  將 `toFood` 改為：

  ```ts
  function toFood(
    row: typeof foodCatalog.$inferSelect,
    categoryName?: string | null,
  ): Food {
    return {
      id:           row.id,
      name:         row.name,
      servingSize:  Number(row.servingSize),
      calories:     Number(row.calories),
      protein:      Number(row.protein),
      fat:          Number(row.fat),
      carbs:        Number(row.carbs),
      categoryId:   row.categoryId ?? undefined,
      categoryName: categoryName ?? undefined,
    }
  }
  ```

- [ ] **Step 4.2: 更新 `getFoods` 以 LEFT JOIN 分類**

  在 import 行加入 `foodCategories`：

  ```ts
  import { foodCatalog, mealFoods, foodCategories } from '@/lib/db/schema'
  ```

  將 `getFoods` 改為：

  ```ts
  export async function getFoods(): Promise<Food[]> {
    const { userId } = await verifySession()
    const rows = await db
      .select({ food: foodCatalog, categoryName: foodCategories.name })
      .from(foodCatalog)
      .leftJoin(foodCategories, eq(foodCatalog.categoryId, foodCategories.id))
      .where(eq(foodCatalog.userId, userId))
    return rows.map(r => toFood(r.food, r.categoryName))
  }
  ```

- [ ] **Step 4.3: 更新 `createFood` 加入 `categoryId`**

  在 `.values({ ... })` 中加入：

  ```ts
  categoryId: data.categoryId ?? null,
  ```

  完整的 `createFood`：

  ```ts
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
        categoryId:  data.categoryId ?? null,
      })
      .returning()
    const categoryName = data.categoryId
      ? (await db.select().from(foodCategories).where(eq(foodCategories.id, data.categoryId)))[0]?.name
      : null
    return toFood(inserted, categoryName)
  }
  ```

- [ ] **Step 4.4: 更新 `updateFood` 加入 `categoryId`**

  在 `.set({ ... })` 中加入：

  ```ts
  categoryId: data.categoryId ?? null,
  ```

  完整的 `updateFood`：

  ```ts
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
        categoryId:  data.categoryId ?? null,
      })
      .where(and(eq(foodCatalog.id, id), eq(foodCatalog.userId, userId)))
      .returning()
    if (!updated) throw new Error(`Food ${id} not found`)

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
        })
        .where(eq(mealFoods.id, row.id))
    }

    const categoryName = updated.categoryId
      ? (await db.select().from(foodCategories).where(eq(foodCategories.id, updated.categoryId)))[0]?.name
      : null
    return toFood(updated, categoryName)
  }
  ```

- [ ] **Step 4.5: 確認 TypeScript 編譯**

  ```bash
  npx tsc --noEmit
  ```

  預期：無錯誤。

- [ ] **Step 4.6: Commit**

  ```bash
  git add lib/actions/food-catalog.ts
  git commit -m "feat(actions): getFoods 帶入分類名稱，createFood/updateFood 支援 categoryId"
  ```

---

## Task 5: 更新 `page.tsx` 與 `FitnessApp`

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/fitness/fitness-app.tsx`

- [ ] **Step 5.1: `page.tsx` 加入 `getCategories`**

  ```ts
  import { getSessions }                    from '@/lib/actions/sessions'
  import { getFoods }                       from '@/lib/actions/food-catalog'
  import { getCategories }                  from '@/lib/actions/food-categories'
  import { getGoals, getNutritionDay }      from '@/lib/actions/nutrition'
  import { FitnessApp }                     from '@/components/fitness/fitness-app'

  export const dynamic = 'force-dynamic'

  const TODAY = new Date().toISOString().slice(0, 10)

  export default async function Page() {
    const [sessions, foodDb, categories, goals, nutritionDay] = await Promise.all([
      getSessions(),
      getFoods(),
      getCategories(),
      getGoals(TODAY),
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
  }
  ```

- [ ] **Step 5.2: `FitnessApp` 加入 `categories` state 與 handlers**

  在 `fitness-app.tsx` 的 import 區加入：

  ```ts
  import type { TabId, Session, Food, Goals, NutritionDay, Meal, FoodCategory } from '@/lib/types'
  import * as categoryActions  from '@/lib/actions/food-categories'
  ```

  在 `FitnessApp` props 介面加入：

  ```ts
  initialCategories: FoodCategory[]
  ```

  在 state 宣告區加入：

  ```ts
  const [categories, setCategories] = useState<FoodCategory[]>(initialCategories)
  ```

  在 `// ── Food DB CRUD ──` 區塊加入以下三個 handlers：

  ```ts
  const addCategory = async (name: string) => {
    const created = await categoryActions.createCategory(name)
    setCategories(prev => [...prev, created])
  }
  const renameCategory = async (id: number, name: string) => {
    const updated = await categoryActions.updateCategory(id, name)
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
  }
  const removeCategory = async (id: number) => {
    await categoryActions.deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
    // 同步清除食物的分類顯示（categoryId 由 DB SET NULL 處理，前端樂觀更新）
    setFoodDb(prev => prev.map(f => f.categoryId === id ? { ...f, categoryId: undefined, categoryName: undefined } : f))
  }
  ```

  在 `<FoodDbTab>` 傳入新 props：

  ```tsx
  <FoodDbTab
    foodDb={foodDb}
    categories={categories}
    onAdd={addFoodToDb}
    onEdit={editFoodInDb}
    onDelete={deleteFoodFromDb}
    onAddCategory={addCategory}
    onRenameCategory={renameCategory}
    onDeleteCategory={removeCategory}
  />
  ```

- [ ] **Step 5.3: 確認 TypeScript 編譯**

  ```bash
  npx tsc --noEmit
  ```

  預期：`FoodDbTab` 會報缺少 props 的錯誤（Task 7 修正），其他無錯誤。

- [ ] **Step 5.4: Commit**

  ```bash
  git add app/page.tsx components/fitness/fitness-app.tsx
  git commit -m "feat(app): 初始載入分類資料，FitnessApp 加入分類 state 與 handlers"
  ```

---

## Task 6: CategoryManagerSheet 元件

**Files:**
- Create: `components/fitness/category-manager-sheet.tsx`

- [ ] **Step 6.1: 建立 `category-manager-sheet.tsx`**

  ```tsx
  'use client'

  import { useState } from 'react'
  import type { FoodCategory } from '@/lib/types'
  import { C } from '@/lib/fitness-constants'

  export function CategoryManagerSheet({
    categories,
    onAdd,
    onRename,
    onDelete,
    onClose,
  }: {
    categories: FoodCategory[]
    onAdd: (name: string) => void
    onRename: (id: number, name: string) => void
    onDelete: (id: number) => void
    onClose: () => void
  }) {
    const [newName, setNewName]     = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName]   = useState('')

    const handleAdd = () => {
      const trimmed = newName.trim()
      if (!trimmed) return
      onAdd(trimmed)
      setNewName('')
    }

    const startEdit = (cat: FoodCategory) => {
      setEditingId(cat.id)
      setEditName(cat.name)
    }

    const commitEdit = (id: number) => {
      const trimmed = editName.trim()
      if (trimmed && trimmed !== categories.find(c => c.id === id)?.name) {
        onRename(id, trimmed)
      }
      setEditingId(null)
    }

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{
          position: 'relative', background: C.bg,
          borderRadius: '20px 20px 0 0', padding: '20px 20px 32px',
          width: '100%', maxWidth: 430,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          maxHeight: '70dvh', display: 'flex', flexDirection: 'column',
        }}>
          {/* 標題列 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>管理分類</div>
            <button onClick={onClose} style={{
              background: C.border, border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.textSec, fontSize: 16,
            }}>×</button>
          </div>

          {/* 分類列表 */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
            {categories.length === 0 && (
              <div style={{ textAlign: 'center', color: C.textSec, fontSize: 13, padding: '24px 0' }}>尚未建立任何分類</div>
            )}
            {categories.map(cat => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0', borderBottom: `1px solid ${C.border}`,
              }}>
                {editingId === cat.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => commitEdit(cat.id)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                    style={{
                      flex: 1, background: C.surface, border: `1px solid ${C.orange}`,
                      borderRadius: 8, padding: '6px 10px', color: C.text, fontSize: 13,
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{cat.name}</span>
                )}
                {editingId !== cat.id && (
                  <>
                    <button onClick={() => startEdit(cat)} style={{
                      background: 'none', border: 'none', color: C.textSec,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px',
                    }}>改名</button>
                    <button onClick={() => {
                      if (window.confirm(`刪除分類「${cat.name}」？該分類的食物將變為未分類。`)) onDelete(cat.id)
                    }} style={{
                      background: 'none', border: 'none', color: C.red,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px',
                    }}>刪除</button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 新增分類 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="新分類名稱…"
              style={{
                flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{
                background: newName.trim() ? C.orange : C.border,
                color: newName.trim() ? '#fff' : C.textSec,
                border: 'none', borderRadius: 10, padding: '9px 18px',
                fontSize: 13, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'not-allowed',
              }}
            >新增</button>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 6.2: Commit**

  ```bash
  git add components/fitness/category-manager-sheet.tsx
  git commit -m "feat(ui): 新增 CategoryManagerSheet 元件"
  ```

---

## Task 7: 更新 FoodDbTab

**Files:**
- Modify: `components/fitness/food-db-tab.tsx`

- [ ] **Step 7.1: 更新 `FoodFormSheet` 加入分類下拉**

  在 `FoodFormSheet` 的 props 加入：

  ```ts
  categories: FoodCategory[]
  ```

  在 `form` state 加入 `categoryId`：

  ```ts
  const [form, setForm] = useState({
    name:        initial?.name                    ?? '',
    servingSize: initial ? String(initial.servingSize) : '',
    calories:    initial ? String(initial.calories)    : '',
    protein:     initial ? String(initial.protein)     : '',
    fat:         initial ? String(initial.fat)          : '',
    carbs:       initial ? String(initial.carbs)        : '',
    categoryId:  initial?.categoryId ?? null as number | null,
  })
  ```

  在食物名稱與基準份量之間插入分類選單：

  ```tsx
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
      分類（選填）
    </label>
    <select
      value={form.categoryId ?? ''}
      onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))}
      style={{
        width: '100%', background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: '9px 14px', color: form.categoryId ? C.text : C.textSec,
        fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, appearance: 'none' as const,
      }}
    >
      <option value="">未分類</option>
      {categories.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  </div>
  ```

  在 `onSave` 呼叫加入 `categoryId`：

  ```ts
  onSave({
    id:          initial?.id || Date.now(),
    name:        form.name.trim(),
    servingSize: parseFloat(form.servingSize) || 100,
    calories:    parseFloat(form.calories) || 0,
    protein:     parseFloat(form.protein)  || 0,
    fat:         parseFloat(form.fat)       || 0,
    carbs:       parseFloat(form.carbs)     || 0,
    categoryId:  form.categoryId ?? undefined,
  })
  ```

  在 `FoodFormSheet` 呼叫處（`FoodDbTab` 底部）加入 `categories` prop：

  ```tsx
  <FoodFormSheet
    initial={editItem ?? undefined}
    title={editItem ? '編輯食物' : '新增食物'}
    categories={categories}
    onSave={...}
    onClose={...}
  />
  ```

- [ ] **Step 7.2: 更新 `FoodDbCard` 顯示分類 Chip**

  在食物名稱旁加入分類 Chip：

  ```tsx
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5, minWidth: 0 }}>
    <span style={{
      fontSize: 14, fontWeight: 700, color: C.text,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{food.name}</span>
    <span style={{ fontSize: 11, color: C.textSec, fontWeight: 600, flexShrink: 0 }}>每 {food.servingSize ?? 100}g/ml</span>
    {food.categoryName ? (
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        background: C.orange + '18', color: C.orange,
      }}>{food.categoryName}</span>
    ) : (
      <span style={{
        fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        background: C.border, color: C.textSec,
      }}>未分類</span>
    )}
  </div>
  ```

- [ ] **Step 7.3: 更新 `FoodDbTab` props 與 state**

  更新 `FoodDbTab` 接收的 props：

  ```ts
  export function FoodDbTab({ foodDb, categories, onAdd, onEdit, onDelete, onAddCategory, onRenameCategory, onDeleteCategory }: {
    foodDb: Food[]
    categories: FoodCategory[]
    onAdd: (f: Food) => void
    onEdit: (f: Food) => void
    onDelete: (id: number) => void
    onAddCategory: (name: string) => void
    onRenameCategory: (id: number, name: string) => void
    onDeleteCategory: (id: number) => void
  })
  ```

  加入 state：

  ```ts
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  ```

  更新 `filtered` 邏輯（同時支援搜尋 + 分類篩選）：

  ```ts
  const filtered = foodDb.filter(f => {
    const matchSearch   = f.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategoryId === null
      ? true
      : selectedCategoryId === -1
        ? !f.categoryId
        : f.categoryId === selectedCategoryId
    return matchSearch && matchCategory
  })
  ```

  > 注意：`selectedCategoryId === -1` 代表「未分類」篩選。

- [ ] **Step 7.4: 在頁面加入 Chip 列與管理分類按鈕**

  在搜尋列 `</div>` 後插入 Chip 列：

  ```tsx
  {/* 分類 Chip 列 */}
  <div style={{ padding: '6px 16px 4px', display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
    {[
      { id: null,  label: '全部' },
      ...categories.map(c => ({ id: c.id, label: c.name })),
      { id: -1, label: '未分類' },
    ].map(chip => (
      <button
        key={chip.id ?? 'all'}
        onClick={() => setSelectedCategoryId(chip.id)}
        style={{
          background: selectedCategoryId === chip.id ? C.orange : C.surface,
          color: selectedCategoryId === chip.id ? '#fff' : C.textSec,
          border: `1px solid ${selectedCategoryId === chip.id ? C.orange : C.border}`,
          borderRadius: 20, padding: '5px 12px',
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const,
          cursor: 'pointer', flexShrink: 0,
        }}
      >{chip.label}</button>
    ))}
  </div>
  ```

  在食物庫計數列旁加入「管理分類」按鈕（將計數列改為 flex 排列）：

  ```tsx
  <div style={{ padding: '4px 18px 10px', fontSize: 11, color: C.textSec, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span>共 {foodDb.length} 項食物{search ? `，搜尋到 ${filtered.length} 項` : ''}</span>
    <button onClick={() => setShowCategoryManager(true)} style={{
      background: C.surfaceHigh, border: 'none', borderRadius: 8,
      padding: '4px 10px', fontSize: 11, fontWeight: 700,
      color: C.textSec, cursor: 'pointer',
    }}>管理分類</button>
  </div>
  ```

- [ ] **Step 7.5: 加入 import 與 CategoryManagerSheet 渲染**

  在 `food-db-tab.tsx` 頂部加入：

  ```ts
  import type { FoodCategory } from '@/lib/types'
  import { CategoryManagerSheet } from '@/components/fitness/category-manager-sheet'
  ```

  在 `FoodFormSheet` 下方（return 的最底部）加入：

  ```tsx
  {showCategoryManager && (
    <CategoryManagerSheet
      categories={categories}
      onAdd={onAddCategory}
      onRename={onRenameCategory}
      onDelete={onDeleteCategory}
      onClose={() => setShowCategoryManager(false)}
    />
  )}
  ```

- [ ] **Step 7.6: 確認 TypeScript 編譯**

  ```bash
  npx tsc --noEmit
  ```

  預期：無錯誤。

- [ ] **Step 7.7: Commit**

  ```bash
  git add components/fitness/food-db-tab.tsx components/fitness/category-manager-sheet.tsx
  git commit -m "feat(ui): 食物庫加入分類 Chip 篩選、管理分類 Sheet、表單分類欄位"
  ```

---

## 自我審查 Checklist

- [x] Spec 的 `food_categories` 表 → Task 1
- [x] `category_id` FK + SET NULL → Task 1
- [x] `getCategories` / `createCategory` / `updateCategory` / `deleteCategory` → Task 3
- [x] `getFoods` LEFT JOIN 分類 → Task 4
- [x] `createFood` / `updateFood` 帶 `categoryId` → Task 4
- [x] 分類 Chip 列（含「全部」與「未分類」）→ Task 7
- [x] 食物卡片顯示分類 Chip → Task 7
- [x] 管理分類按鈕 → Task 7
- [x] 管理分類 Sheet（新增、改名 inline、刪除）→ Task 6
- [x] 新增/編輯表單加分類下拉 → Task 7
- [x] 刪除分類後前端樂觀更新 → Task 5
