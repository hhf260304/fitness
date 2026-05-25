# 食物庫分類功能 — 設計文件

日期：2026-05-25

## 背景

食物庫目前是平鋪列表，無任何分組或篩選機制。當食物數量增多時，尋找特定食物需依賴搜尋。加入分類功能可讓使用者快速篩選同類食物。

## 需求

- 使用者可自行建立、改名、刪除分類
- 每筆食物最多屬於一個分類（single-select）
- 分類指派在新增／編輯食物表單中完成
- 食物庫頁面可依分類篩選（篩選頁籤 Chip 列）
- 未指派分類的食物顯示「未分類」標示

## 資料模型

### 新增：`food_categories` 表

```sql
CREATE TABLE food_categories (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  UNIQUE(user_id, name)
);
```

### 修改：`food_catalog` 表

```sql
ALTER TABLE food_catalog
  ADD COLUMN category_id INTEGER REFERENCES food_categories(id) ON DELETE SET NULL;
```

刪除分類時，底下食物的 `category_id` 自動設為 `null`，食物本身不受影響。

## UI 設計

### 1. 分類 Chip 列

位置：搜尋欄正下方，橫向捲動。

- 第一個 Chip 固定為「全部」（選取時為橘色，其餘為灰底）
- 其後依序顯示使用者建立的分類
- 點擊 Chip 篩選；再點「全部」回到無篩選狀態
- 食物卡片上以小 Chip 顯示分類名稱；`categoryId` 為 null 者顯示灰色「未分類」

### 2. 管理分類 Sheet

入口：食物庫頁面右上角「管理分類」按鈕。

功能：
- 列出所有分類，每項顯示「改名」與「刪除」按鈕
- 改名：點「改名」按鈕後，名稱文字變成 inline input，可直接編輯後按 Enter 或失焦儲存
- 刪除：`window.confirm` 確認後刪除，底下食物變未分類
- 底部輸入框 + 「新增」按鈕可建立新分類

### 3. 新增／編輯食物表單

在「基準份量」欄位前新增「分類（選填）」下拉選單：
- 選項來自 `getCategories()` 回傳的分類清單
- 預設空白（未分類）
- 選到某分類後 Chip 以橘色邊框標示

## Server Actions

檔案：`lib/actions/food-categories.ts`（新增）

| Action | 簽名 | 說明 |
|---|---|---|
| `getCategories` | `() => Promise<Category[]>` | 取得目前使用者所有分類 |
| `createCategory` | `(name: string) => Promise<Category>` | 新增分類；重名拋錯 |
| `updateCategory` | `(id: number, name: string) => Promise<Category>` | 改名 |
| `deleteCategory` | `(id: number) => Promise<void>` | 刪除，底下食物變未分類 |

檔案：`lib/actions/food-catalog.ts`（修改）

- `getFoods()` JOIN `food_categories`，回傳含 `categoryId` 與 `categoryName` 的食物
- `createFood` / `updateFood` 加入 `categoryId` 參數

## 型別

```ts
// lib/types.ts 新增
export type FoodCategory = {
  id: number
  name: string
}

// Food 型別新增
categoryId?: number
categoryName?: string
```

## Migration

新增 migration 檔案：
1. 建立 `food_categories` 表
2. `food_catalog` 加 `category_id` 欄位

## 影響範圍

| 檔案 | 變更類型 |
|---|---|
| `lib/db/schema.ts` | 新增 `foodCategories` 表定義；`foodCatalog` 加 `categoryId` 欄位 |
| `lib/types.ts` | 新增 `FoodCategory` 型別；`Food` 加 `categoryId`、`categoryName` |
| `lib/actions/food-categories.ts` | 新增 |
| `lib/actions/food-catalog.ts` | 修改 `getFoods`、`createFood`、`updateFood` |
| `components/fitness/food-db-tab.tsx` | 加入 Chip 列、管理分類 Sheet、表單分類欄 |
| `lib/db/migrations/` | 新增 migration SQL |

## 不在本次範圍

- 分類自訂排序（drag-to-reorder）
- 分類顏色標籤
- 跨使用者共享分類
