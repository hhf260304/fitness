# Neon + Drizzle ORM 整合設計

**日期：** 2026-05-22
**範圍：** 將現有靜態 mock 資料遷移至 Neon PostgreSQL，使用 Drizzle ORM + Server Actions

---

## 目標

將 `lib/data.ts` 中的靜態資料（Sessions、Food DB、Nutrition、Goals）全部遷移至 Neon PostgreSQL，透過 Drizzle ORM 與 Next.js Server Actions 進行 CRUD 操作。

---

## 技術選型

| 項目 | 選擇 | 原因 |
|------|------|------|
| 資料庫 | Neon PostgreSQL | 使用者已有帳號與連線字串 |
| ORM | Drizzle ORM | 輕量、type-safe、原生支援 Neon serverless driver |
| 資料存取 | Next.js Server Actions | 無需額外 API routes，Next.js 原生方式 |

---

## 資料庫 Schema（6 張表）

### sessions
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | serial PK | |
| name | text, not null | 訓練名稱 |
| date | date, not null | 訓練日期 |

### exercises
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | serial PK | |
| session_id | int FK → sessions.id | cascade delete |
| name | text, not null | 動作名稱（中文） |
| name_en | text | 動作名稱（英文，可空） |
| muscle | text, not null | 肌群 |
| sets | int, not null | 組數 |
| reps | int, not null | 次數 |
| weight | numeric, not null | 重量（kg） |
| rest | int, not null | 休息時間（秒） |

### food_catalog
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | serial PK | |
| name | text, not null | 食物名稱 |
| calories | int, not null | 熱量（kcal） |
| protein | numeric, not null | 蛋白質（g） |
| fat | numeric, not null | 脂肪（g） |
| carbs | numeric, not null | 碳水（g） |
| sugar | numeric, not null | 糖（g） |

### meals
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | serial PK | |
| date | date, not null | 餐點日期 |
| name | text, not null | 餐點名稱（早餐、午餐…） |
| time | text, not null | 時間字串（HH:mm） |

### meal_foods
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | serial PK | |
| meal_id | int FK → meals.id | cascade delete |
| name | text, not null | 食物名稱（獨立儲存，不 FK 到 food_catalog） |
| calories | int, not null | |
| protein | numeric, not null | |
| fat | numeric, not null | |
| carbs | numeric, not null | |
| sugar | numeric, not null | |

### goals
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | serial PK | |
| date | date, not null, unique | 每日目標（唯一） |
| calories | int, not null | |
| protein | int, not null | |
| fat | int, not null | |
| carbs | int, not null | |
| sugar | int, not null | |

> `meal_foods` 獨立儲存完整數值（不 FK 至 food_catalog），因為飲食日記的食物名稱與食物庫不一定對應。

---

## 專案結構

```
lib/
  db/
    schema.ts          ← Drizzle schema 定義（6 張表）
    index.ts           ← Neon + Drizzle client singleton
    seed.ts            ← 將 lib/data.ts mock 資料寫入 DB
    migrations/        ← drizzle-kit 自動產生的 migration SQL
  actions/
    sessions.ts        ← Server Actions：CRUD sessions + exercises
    nutrition.ts       ← Server Actions：CRUD meals + meal_foods + goals
    food-catalog.ts    ← Server Actions：CRUD food_catalog
drizzle.config.ts      ← drizzle-kit 設定
.env.local             ← DATABASE_URL（不 commit）
```

---

## 資料流

```
React 元件
  → 呼叫 Server Action（lib/actions/*.ts）
    → Drizzle query（lib/db/index.ts）
      → Neon PostgreSQL（serverless HTTP driver）
```

---

## 安裝套件

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

---

## Migration 流程（一次性）

1. 設定 `.env.local`：`DATABASE_URL=postgresql://...`
2. 設定 `drizzle.config.ts`
3. 定義 `lib/db/schema.ts`（6 張表）
4. `npx drizzle-kit generate` — 產生 migration SQL 至 `lib/db/migrations/`
5. `npx drizzle-kit migrate` — 推送 schema 至 Neon
6. `npx tsx lib/db/seed.ts` — 將 mock 資料寫入 DB

---

## Server Actions 邊界

| 檔案 | Actions |
|------|---------|
| `lib/actions/sessions.ts` | `getSessions`, `getSession`, `createSession`, `updateSession`, `deleteSession`, `addExercise`, `updateExercise`, `deleteExercise` |
| `lib/actions/nutrition.ts` | `getNutritionDay`, `createMeal`, `updateMeal`, `deleteMeal`, `addMealFood`, `deleteMealFood`, `getGoals`, `upsertGoals` |
| `lib/actions/food-catalog.ts` | `getFoods`, `createFood`, `updateFood`, `deleteFood` |

---

## 不在此範圍內

- 使用者認證（無 user_id，所有資料為單一用戶）
- 跨裝置同步以外的功能
- 現有 `lib/types.ts` 不變動
- 元件層 UI 邏輯不在此次範圍（資料層為主）
