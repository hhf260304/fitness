# 飲食紀錄日曆查詢功能 — 設計文件

**日期**：2026-05-27  
**狀態**：已核准，待實作

---

## 功能概述

在飲食紀錄頁面的 Header 右側加入日曆圖示按鈕，點擊後於 Header 下方展開月曆選擇器，讓使用者能查看並完整編輯任意日期的飲食紀錄。有紀錄的日期在月曆上顯示橙色小圓點提示。

---

## 使用者決策紀錄

| 問題 | 決定 |
|------|------|
| 查詢後的操作權限 | 完整編輯（新增、修改、刪除餐點） |
| 日曆入口 | Header 右側日曆圖示（取代現有橙色圓形 icon） |
| 日曆展開方式 | Header 正下方展開，內容往下推（非 modal/bottom sheet） |
| 有紀錄日期標示 | 顯示橙色小圓點（2px） |

---

## 架構設計

### 方案：日期狀態提升至 FitnessApp（方案一）

所有 async 資料管理集中在 `FitnessApp`，與現有 `updateMeal / addMeal` 模式一致。

### 新增 Server Action

```ts
// lib/actions/nutrition.ts
export async function getActiveDates(year: number, month: number): Promise<string[]>
```

- 查詢 `meals` 表中當月（`YYYY-MM-01` 至月底）有紀錄的不重複日期
- 回傳格式：`["2026-05-15", "2026-05-27"]`

---

## FitnessApp 狀態變更

### 新增 state

```ts
const [selectedDate, setSelectedDate]         = useState(TODAY)
const [calendarOpen, setCalendarOpen]         = useState(false)
const [calendarViewMonth, setCalendarViewMonth] = useState(TODAY.slice(0, 7)) // "YYYY-MM"
const [activeDatesCache, setActiveDatesCache] = useState<Map<string, string[]>>(new Map())
const [nutritionLoading, setNutritionLoading] = useState(false)
```

### 新增 handler

```ts
// 打開日曆：若當月尚未快取則呼叫 getActiveDates
const handleOpenCalendar = async () => {
  setCalendarOpen(true)
  const key = calendarViewMonth
  if (!activeDatesCache.has(key)) {
    const [year, month] = key.split('-').map(Number)
    const dates = await getActiveDates(year, month)
    setActiveDatesCache(prev => new Map(prev).set(key, dates))
  }
}

// 切換日曆檢視月份
const handleChangeMonth = async (year: number, month: number) => {
  const key = `${year}-${String(month).padStart(2, '0')}`
  setCalendarViewMonth(key)
  if (!activeDatesCache.has(key)) {
    const dates = await getActiveDates(year, month)
    setActiveDatesCache(prev => new Map(prev).set(key, dates))
  }
}

// 選定日期：關閉日曆、拉新一天資料
const handleSelectDate = async (date: string) => {
  setCalendarOpen(false)
  setSelectedDate(date)
  setNutritionLoading(true)
  const day = await getNutritionDay(date)
  setNutritionDay(day)
  setNutritionLoading(false)
}
```

### 修改現有邏輯

- `addMeal`：`createMeal(TODAY, meal)` → `createMeal(selectedDate, meal)`
- `NutritionHeader` 改為受控元件，傳入以下 props

---

## NutritionHeader — 介面變更

```ts
function NutritionHeader({
  selectedDate,      // string "YYYY-MM-DD"
  calendarOpen,      // boolean
  calendarViewMonth, // string "YYYY-MM"（日曆當前檢視月份）
  activeDates,       // string[]（calendarViewMonth 對應的有紀錄日期）
  onToggleCalendar,  // () => void
  onSelectDate,      // (date: string) => void
  onChangeMonth,     // (year: number, month: number) => void
}: NutritionHeaderProps)
```

`FitnessApp` 傳入 `activeDatesCache.get(calendarViewMonth) ?? []` 作為 `activeDates`。

月曆 UI 整合在此元件內，不另立新元件。

---

## 月曆 UI 細節

### 視覺規格

```
┌─────────────────────────────────┐
│ 飲食紀錄          [日曆 icon]    │  ← 點 icon 切換展開/收合
├─────────────────────────────────┤
│  < 2026年5月 >                  │  ← 月份導覽
│                                 │
│  日  一  二  三  四  五  六      │
│               1●  2   3        │
│   4   5   6   7   8●  9  10   │
│  11  12  13  14  15● 16  17   │
│  18  19  20  21  22  23  24   │
│  25  26 [27] 28  29  30  31   │
└─────────────────────────────────┘
```

### 日期狀態對應樣式

| 狀態 | 樣式 |
|------|------|
| 一般日期 | 灰色數字 |
| 今天（未選中） | 橙色邊框圓 |
| 選中日 | 橙色實心圓底、白字 |
| 未來日期 | 更淺灰色、不可點擊 |
| 有紀錄 | 日期數字下方 2px 橙色圓點 |

### Header Icon 狀態

| 狀態 | 外觀 |
|------|------|
| 今天、日曆關閉 | 橙色日曆 icon（正常） |
| 非今天、日曆關閉 | 橙色日曆 icon，副標題顯示所選日期 |
| 日曆展開中 | Icon 背景加深（active 狀態） |

---

## 資料流時序

```
點日曆 icon
  → calendarOpen = true
  → 若 calendarViewMonth 不在 activeDatesCache → 呼叫 getActiveDates
  → activeDates 更新，圓點出現

點 < / >（切換月份）
  → calendarViewMonth 更新
  → 若新月份不在 activeDatesCache → 呼叫 getActiveDates
  → activeDates 更新

點某天（例：5/15）
  → calendarOpen = false
  → selectedDate = "2026-05-15"
  → nutritionLoading = true
  → 呼叫 getNutritionDay("2026-05-15")
  → nutritionDay 更新、nutritionLoading = false
```

---

## 月份快取策略

`activeDates` 為 `Map<"YYYY-MM", string[]>`，key 為 `"2026-05"` 格式。  
切換月份時若 key 已存在則直接讀取，不重複打 API。

---

## 邊界條件與錯誤處理

| 情境 | 處理方式 |
|------|----------|
| 選到空白日期 | 正常顯示 0 kcal，可新增餐點 |
| 在非今天日期新增餐點 | `createMeal(selectedDate, meal)` |
| 新增餐點後，`activeDates` 更新 | 若當月已快取，在 `activeDates` Map 中加入該日期 |
| 切換日期時 loading | `NutritionTab` 顯示灰色骨架條，避免空白 |
| 網路錯誤 | 保留上一天資料，顯示錯誤 toast（沿用現有模式） |
| 初始載入 | `page.tsx` 僅 SSR 今天資料，其他日期靠 client fetch |

---

## 不在本次範圍內

- 跨日期複製餐點
- 日期範圍統計（週/月總覽）
- 滑動手勢切換日期

---

## 影響檔案

| 檔案 | 變更類型 |
|------|----------|
| `lib/actions/nutrition.ts` | 新增 `getActiveDates` |
| `components/fitness/fitness-app.tsx` | 新增 state/handler、修改 `addMeal`、傳 props |
| `components/fitness/nutrition-tab.tsx` | `NutritionHeader` 改為受控、加入月曆 UI |
