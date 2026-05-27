# 飲食模版功能設計文件

**日期：** 2026-05-27  
**狀態：** 已確認，待實作

---

## 功能概述

讓使用者建立「飲食模版」——一整天的餐點結構加上食物清單。可建立多個命名模版，並設定其中一個為「預設模版」。切換到尚無飲食記錄的日期時，系統自動套用預設模版，省去重複輸入的工夫。

---

## 資料模型

### 新增三張 DB 表

#### `meal_templates`
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | serial PK | |
| `userId` | integer → users.id (cascade) | |
| `name` | text NOT NULL | 模版名稱，如「減脂日」 |
| `isDefault` | boolean NOT NULL default false | 每個 user 最多一個 true |

#### `meal_template_meals`
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | serial PK | |
| `templateId` | integer → meal_templates.id (cascade) | |
| `name` | text NOT NULL | 餐名，如「早餐」 |
| `time` | time (nullable) | 可選填用餐時間 |
| `sortOrder` | integer NOT NULL default 0 | 排序 |

#### `meal_template_foods`
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | serial PK | |
| `templateMealId` | integer → meal_template_meals.id (cascade) | |
| `catalogFoodId` | integer → food_catalog.id (set null, nullable) | |
| `amountG` | numeric(8,1) nullable | |
| `name` | text NOT NULL | |
| `calories` | numeric(7,1) NOT NULL | |
| `protein` | numeric(6,1) NOT NULL | |
| `fat` | numeric(6,1) NOT NULL | |
| `carbs` | numeric(6,1) NOT NULL | |

**`isDefault` 的唯一性保證：** `setDefaultTemplate` 在 application 層使用 transaction，先把同 userId 的所有模版 `isDefault` 設為 false，再把目標模版設為 true。不使用 partial unique index，以避免 Drizzle 的複雜性。

`meal_template_foods` 欄位與 `meal_foods` 完全一致，便於套用時直接複製資料。

---

## Server Actions

新增 `lib/actions/meal-templates.ts`：

| 函式 | 說明 |
|---|---|
| `getTemplates()` | 取得目前使用者的所有模版（含巢狀 meals＋foods），依 id asc 排序 |
| `createTemplate(name, meals)` | 建立新模版，`meals` 為含 foods 的陣列 |
| `updateTemplate(id, name, meals)` | 整批替換模版的 meals＋foods（先刪後建） |
| `deleteTemplate(id)` | 刪除模版（cascade 自動清除 meals＋foods） |
| `setDefaultTemplate(id \| null)` | 設定預設；傳 null 表示取消預設 |
| `saveDayAsTemplate(date, name)` | 把指定日期的 meals＋meal_foods 複製成新模版 |
| `applyTemplate(templateId, date)` | 把模版的 meals＋foods 寫入指定日期的 meals＋meal_foods，回傳新建的 Meal[] |

**`applyTemplate` 行為細節：**
- 若目標日期已有餐點，**不做任何事**（不覆蓋）並拋出錯誤，由呼叫端處理
- 使用 DB transaction 確保原子性
- 回傳寫入後的完整 `Meal[]`，讓前端直接更新 state

---

## 類型定義（`lib/types.ts` 新增）

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
  time: string   // '—' 表示無
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

---

## UI 元件

### 新增元件

#### `TemplateManagerModal`
- **觸發**：點擊 `NutritionHeader` 右側「模版」按鈕
- **內容**：
  - 頂部兩個快捷操作：「＋ 新增模版」、「📋 另存今天」（另存目前選擇的日期）
  - 模版清單：每張模版卡片顯示名稱、摘要（餐數 / 總 kcal）、「套用」按鈕、「⋯」選單
  - 預設模版以橘色邊框＋「預設」標籤標示
- **⋯ 選單操作**：設為預設、編輯模版、刪除（刪除前 `window.confirm`）

#### `TemplateEditorModal`
- **觸發**：點「新增模版」或「編輯模版」
- **內容**：
  - 模版名稱輸入欄
  - 可拖拉排序的餐點卡片列表（點擊卡片展開食物清單）
  - 食物編輯完全複用現有 `AddFoodModal` 與 `EditFoodModal`
  - 底部顯示總熱量摘要
  - 頂部「儲存」按鈕（name 不為空時啟用）

#### `TemplateAppliedToast`
- 在 `NutritionTab` 頂部短暫顯示「已套用預設模版『xxx』」
- 2 秒後自動消失（`setTimeout` 清除 state）

### 修改現有元件

#### `NutritionHeader`
- 新增 prop `onOpenTemplates: () => void`
- 在月曆按鈕左側加入橘色「模版」按鈕

#### `FitnessApp`
- 新增 state：`templates: MealTemplate[]`
- `initialTemplates` 從 `page.tsx` 傳入（SSR 預載）
- `handleSelectDate` 修改：若切換後的日期 `meals` 為空 **且** `templates` 中有 `isDefault === true` 的模版 → 自動呼叫 `applyTemplate`，將回傳的 `Meal[]` 寫入 `nutritionDay`，並觸發 `TemplateAppliedToast`
- 新增 handler：`handleOpenTemplates`、`handleApplyTemplate`、`handleSaveDayAsTemplate`、`handleCreateTemplate`、`handleUpdateTemplate`、`handleDeleteTemplate`、`handleSetDefaultTemplate`

---

## 自動套用邏輯

```
handleSelectDate(date):
  1. 關閉月曆，setNutritionLoading(true)
  2. 從 DB 取得 nutritionDay（getNutritionDay）
  3. 若 nutritionDay.meals.length === 0：
       找 templates.find(t => t.isDefault)
       若存在 → applyTemplate(template.id, date)
                → setNutritionDay({ ...day, meals: newMeals })
                → setToastMessage(`已套用預設模版「${template.name}」`)
  4. 否則直接 setNutritionDay(day)
  5. setNutritionLoading(false)
```

**邊界案例：**
- 套用失敗（網路錯誤）→ 靜默失敗，顯示空的當天，不卡住畫面
- 使用者在自動套用後刪除所有餐點 → 不重新套用（只在切換日期那一刻判斷）
- 沒有預設模版 → 不做任何事，顯示空白當天

---

## Migration

新增 `lib/db/migrations/0012_meal_templates.sql`（由 `drizzle-kit generate` 產生）：
- 建立 `meal_templates`、`meal_template_meals`、`meal_template_foods` 三張表
- `drizzle-kit migrate` 執行後生效

---

## 錯誤處理

- `applyTemplate` 若目標日期已有資料 → 拋出 `Error('ALREADY_HAS_MEALS')`，呼叫端 catch 後不處理（不顯示錯誤，直接顯示現有餐點）
- 刪除有 `isDefault` 的模版 → 刪除後不自動指定新預設，使用者需手動設定
- 模版名稱重複 → 允許（不做唯一性限制）

---

## 不在範圍內

- 按星期分別指定不同預設模版
- 模版分享或匯出
- 套用模版時可選擇「只套用餐點結構（不含食物）」
