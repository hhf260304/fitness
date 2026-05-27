# 飲食紀錄日曆查詢 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在飲食紀錄頁面 Header 右側加入日曆圖示，點擊後展開月曆選擇器，讓使用者可查看並完整編輯任意日期的飲食紀錄。

**Architecture:** 日期狀態（`selectedDate`、`calendarOpen`、`calendarViewMonth`、`activeDatesCache`）集中在 `FitnessApp`。`NutritionHeader` 改為受控元件，獨立至新檔案 `nutrition-header.tsx`，接收全部日曆 props。`NutritionTab` 新增 `loading` prop 顯示骨架狀態。

**Tech Stack:** Next.js 15 App Router、Server Actions、Drizzle ORM（PostgreSQL）、React useState、純 CSS-in-JS（inline style）

---

## 影響檔案一覽

| 檔案 | 動作 | 說明 |
|------|------|------|
| `lib/actions/nutrition.ts` | 修改 | 新增 `getActiveDates` server action |
| `components/fitness/nutrition-header.tsx` | 新增 | 受控 NutritionHeader + 月曆 UI |
| `components/fitness/fitness-app.tsx` | 修改 | 日期 state/handler、import NutritionHeader、修改 addMeal |
| `components/fitness/nutrition-tab.tsx` | 修改 | NutritionTab 加 `loading` prop 及骨架 UI；移除舊 NutritionHeader |

---

## Task 1：新增 `getActiveDates` server action

**Files:**
- Modify: `lib/actions/nutrition.ts`

- [ ] **Step 1：在 nutrition.ts 頂部加入 `gte`、`lte` import**

找到這一行：
```ts
import { eq, and, asc } from 'drizzle-orm'
```
改為：
```ts
import { eq, and, asc, gte, lte } from 'drizzle-orm'
```

- [ ] **Step 2：在檔案末尾加入 `getActiveDates`**

在 `reorderMeals` 函式之後新增：
```ts
export async function getActiveDates(year: number, month: number): Promise<string[]> {
  const { userId } = await verifySession()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end   = new Date(year, month, 0).toISOString().slice(0, 10)
  const rows  = await db
    .selectDistinct({ date: meals.date })
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.date, start), lte(meals.date, end)))
  return rows.map(r => r.date)
}
```

> 說明：`new Date(year, month, 0)` 利用 JS Date 的溢位特性取得月底日期（month 為 1-indexed）。

- [ ] **Step 3：確認 TypeScript 無錯誤**

```bash
cd /Users/user/Desktop/fitness && npx tsc --noEmit 2>&1 | head -20
```
預期：無輸出（或只有與本次變更無關的既有錯誤）。

- [ ] **Step 4：Commit**

```bash
git add lib/actions/nutrition.ts
git commit -m "feat(nutrition): 新增 getActiveDates server action"
```

---

## Task 2：建立 `NutritionHeader` 元件（含月曆 UI）

**Files:**
- Create: `components/fitness/nutrition-header.tsx`

- [ ] **Step 1：建立檔案，寫入完整元件**

```tsx
'use client'

import { C } from '@/lib/fitness-constants'

// ── 型別 ─────────────────────────────────────────────────────
export type NutritionHeaderProps = {
  selectedDate:      string          // "YYYY-MM-DD"
  calendarOpen:      boolean
  calendarViewMonth: string          // "YYYY-MM"
  activeDates:       string[]        // calendarViewMonth 有紀錄的日期
  onToggleCalendar:  () => void
  onSelectDate:      (date: string) => void
  onChangeMonth:     (year: number, month: number) => void
}

// ── 輔助：產生月曆格子 ────────────────────────────────────────
function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month - 1, 1).getDay() // 0=日
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

// ── 輔助：將 "YYYY-MM-DD" 格式化為 "M月D日 週X" ───────────────
function formatDateLabel(dateStr: string): string {
  const d    = new Date(dateStr + 'T00:00:00')
  const days = ['日','一','二','三','四','五','六']
  return `${d.getMonth() + 1}月${d.getDate()}日 週${days[d.getDay()]}`
}

// ── NutritionHeader ───────────────────────────────────────────
export function NutritionHeader({
  selectedDate,
  calendarOpen,
  calendarViewMonth,
  activeDates,
  onToggleCalendar,
  onSelectDate,
  onChangeMonth,
}: NutritionHeaderProps) {
  const today         = new Date().toISOString().slice(0, 10)
  const activeDateSet = new Set(activeDates)

  const [viewYear, viewMonth] = calendarViewMonth.split('-').map(Number)
  const cells = buildCalendarCells(viewYear, viewMonth)

  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth - 2, 1)
    onChangeMonth(d.getFullYear(), d.getMonth() + 1)
  }
  const nextMonth = () => {
    const d = new Date(viewYear, viewMonth, 1)
    onChangeMonth(d.getFullYear(), d.getMonth() + 1)
  }

  // 下個月的第一天 > 今天 → 不可再往前（用 Date 物件避免跨年月份算錯）
  const nextMonthDate  = new Date(viewYear, viewMonth, 1)  // viewMonth 是 1-indexed，故 month param 正好是「下個月」
  const nextMonthStart = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`
  const isNextDisabled = nextMonthStart > today

  return (
    <>
      {/* ── Header 列 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px', borderBottom: calendarOpen ? 'none' : `1px solid ${C.border}`,
        background: C.bg, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>飲食紀錄</div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>
            {formatDateLabel(selectedDate)}
          </div>
        </div>

        {/* 日曆 icon 按鈕 */}
        <button
          type="button"
          onClick={onToggleCalendar}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: calendarOpen ? C.orange + '30' : C.orange + '20',
            border: `1px solid ${calendarOpen ? C.orange + '80' : C.orange + '40'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          aria-label="開啟日曆"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="14" rx="2" stroke={C.orange} strokeWidth="1.6"/>
            <line x1="6"  y1="2" x2="6"  y2="6"  stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="14" y1="2" x2="14" y2="6"  stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="2"  y1="9" x2="18" y2="9"  stroke={C.orange} strokeWidth="1.6"/>
          </svg>
        </button>
      </div>

      {/* ── 月曆展開區 ── */}
      {calendarOpen && (
        <div style={{
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          padding: '10px 16px 14px', flexShrink: 0,
        }}>
          {/* 月份導覽 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`,
                background: C.surface, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                <path d="M5.5 1L1 5.5l4.5 4.5" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
              {viewYear}年{viewMonth}月
            </span>

            <button
              type="button"
              onClick={nextMonth}
              disabled={isNextDisabled}
              style={{
                width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`,
                background: C.surface, cursor: isNextDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isNextDisabled ? 0.3 : 1,
              }}
            >
              <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                <path d="M1.5 1L6 5.5 1.5 10" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* 星期標題 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {['日','一','二','三','四','五','六'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: C.textSec, fontWeight: 600, padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />

              const dateStr   = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isSelected = dateStr === selectedDate
              const isToday    = dateStr === today
              const isFuture   = dateStr > today
              const hasRecord  = activeDateSet.has(dateStr)

              return (
                <div
                  key={dateStr}
                  role="button"
                  tabIndex={isFuture ? -1 : 0}
                  onClick={() => { if (!isFuture) onSelectDate(dateStr) }}
                  onKeyDown={e => { if (!isFuture && (e.key === 'Enter' || e.key === ' ')) onSelectDate(dateStr) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '3px 0', cursor: isFuture ? 'not-allowed' : 'pointer', position: 'relative',
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? C.orange : 'transparent',
                    border: (!isSelected && isToday) ? `1.5px solid ${C.orange}` : 'none',
                    fontSize: 12,
                    fontWeight: isSelected || isToday ? 800 : 500,
                    color: isSelected ? '#fff' : isFuture ? C.textTer : C.text,
                  }}>
                    {day}
                  </div>
                  {/* 有紀錄的圓點 */}
                  {hasRecord && !isSelected && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: C.orange, marginTop: 1,
                    }} />
                  )}
                  {/* 選中時也顯示白色圓點 */}
                  {hasRecord && isSelected && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#ffffff99', marginTop: 1,
                    }} />
                  )}
                  {/* 無紀錄的佔位讓高度一致 */}
                  {!hasRecord && (
                    <div style={{ width: 4, height: 4, marginTop: 1 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2：確認 TypeScript 無錯誤**

```bash
cd /Users/user/Desktop/fitness && npx tsc --noEmit 2>&1 | head -20
```
預期：無新增錯誤。

- [ ] **Step 3：Commit**

```bash
git add components/fitness/nutrition-header.tsx
git commit -m "feat(nutrition-header): 新增受控 NutritionHeader 含月曆 UI"
```

---

## Task 3：更新 NutritionTab — 新增 `loading` prop 與骨架 UI

**Files:**
- Modify: `components/fitness/nutrition-tab.tsx`

- [ ] **Step 1：在 `NutritionTab` 的 props 加入 `loading`**

找到 `export function NutritionTab({` 的 props 定義：
```ts
export function NutritionTab({ nutritionDay, onUpdateMeal, onAddMeal, onDeleteMeal, onReorderMeals, foodDb, goals }: {
  nutritionDay: NutritionDay | undefined
  onUpdateMeal: (id: number, updated: Meal) => void
  onAddMeal: (meal: Meal) => void
  onDeleteMeal: (id: number) => void
  onReorderMeals: (ids: number[]) => void
  foodDb: Food[]
  goals: Goals
})
```
改為：
```ts
export function NutritionTab({ nutritionDay, onUpdateMeal, onAddMeal, onDeleteMeal, onReorderMeals, foodDb, goals, loading }: {
  nutritionDay: NutritionDay | undefined
  onUpdateMeal: (id: number, updated: Meal) => void
  onAddMeal: (meal: Meal) => void
  onDeleteMeal: (id: number) => void
  onReorderMeals: (ids: number[]) => void
  foodDb: Food[]
  goals: Goals
  loading?: boolean
})
```

- [ ] **Step 2：在 `NutritionTab` return 的頂層 div 中加入骨架 overlay**

找到 `NutritionTab` 的 return 開頭：
```tsx
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <MacroSummary totals={totals} goals={goals} />
```
改為：
```tsx
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: C.bg + 'cc',
          display: 'flex', flexDirection: 'column', gap: 12, padding: '16px',
        }}>
          {[180, 140, 160].map((h, i) => (
            <div key={i} style={{
              height: h, borderRadius: 16,
              background: C.surfaceHigh,
              animation: 'pulse 1.2s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <MacroSummary totals={totals} goals={goals} />
```

> 注意：骨架動畫使用 CSS animation，需在 `app/globals.css` 中確認有無 `@keyframes pulse`。

- [ ] **Step 3：在 `app/globals.css` 補上 pulse 動畫（如果尚未存在）**

開啟 `app/globals.css`，在末尾加入：
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

- [ ] **Step 4：確認 TypeScript 無錯誤**

```bash
cd /Users/user/Desktop/fitness && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5：Commit**

```bash
git add components/fitness/nutrition-tab.tsx app/globals.css
git commit -m "feat(nutrition-tab): 新增 loading prop 與骨架 UI"
```

---

## Task 4：更新 FitnessApp — 日期 state、handlers、串接元件

**Files:**
- Modify: `components/fitness/fitness-app.tsx`

- [ ] **Step 1：新增 import**

在 fitness-app.tsx 頂部的 import 區，加入：
```ts
import { NutritionHeader } from '@/components/fitness/nutrition-header'
import * as nutritionActions from '@/lib/actions/nutrition'  // 已存在，確認有 getActiveDates
```

> 檢查頂部已有 `import * as nutritionActions from '@/lib/actions/nutrition'`，若已有則不需重複。只需確保 NutritionHeader 的 import 加入。

- [ ] **Step 2：更新 `TODAY` 常數位置（維持不變），在 `FitnessApp` 內新增 state**

找到：
```ts
const [nutritionDay, setNutritionDay] = useState<NutritionDay>(initialNutritionDay)
```
在其後加入：
```ts
const [selectedDate,      setSelectedDate]      = useState(TODAY)
const [calendarOpen,      setCalendarOpen]      = useState(false)
const [calendarViewMonth, setCalendarViewMonth] = useState(TODAY.slice(0, 7))
const [activeDatesCache,  setActiveDatesCache]  = useState<Map<string, string[]>>(new Map())
const [nutritionLoading,  setNutritionLoading]  = useState(false)
```

- [ ] **Step 3：新增三個 handler**

在 `// ── Nutrition CRUD ─────` 區塊，於現有 handler 之後加入：
```ts
  const handleOpenCalendar = async () => {
    const key = calendarViewMonth
    setCalendarOpen(true)
    if (!activeDatesCache.has(key)) {
      const [y, m] = key.split('-').map(Number)
      const dates = await nutritionActions.getActiveDates(y, m)
      setActiveDatesCache(prev => new Map(prev).set(key, dates))
    }
  }

  const handleToggleCalendar = () => {
    if (calendarOpen) {
      setCalendarOpen(false)
    } else {
      handleOpenCalendar()
    }
  }

  const handleChangeMonth = async (year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`
    setCalendarViewMonth(key)
    if (!activeDatesCache.has(key)) {
      const dates = await nutritionActions.getActiveDates(year, month)
      setActiveDatesCache(prev => new Map(prev).set(key, dates))
    }
  }

  const handleSelectDate = async (date: string) => {
    setCalendarOpen(false)
    setSelectedDate(date)
    setNutritionLoading(true)
    const day = await nutritionActions.getNutritionDay(date)
    setNutritionDay(day)
    setNutritionLoading(false)
  }
```

- [ ] **Step 4：修改 `addMeal`，改用 `selectedDate`，並更新 activeDatesCache**

找到現有的 `addMeal`：
```ts
  const addMeal = async (meal: Meal) => {
    const created = await nutritionActions.createMeal(TODAY, meal)
    setNutritionDay(prev => ({
      ...prev,
      meals: [...prev.meals, created],
    }))
  }
```
改為：
```ts
  const addMeal = async (meal: Meal) => {
    const created = await nutritionActions.createMeal(selectedDate, meal)
    setNutritionDay(prev => ({
      ...prev,
      meals: [...prev.meals, created],
    }))
    // 若當月已快取且今日尚未在其中，加入
    const key = selectedDate.slice(0, 7)
    setActiveDatesCache(prev => {
      if (!prev.has(key)) return prev
      const existing = prev.get(key)!
      if (existing.includes(selectedDate)) return prev
      return new Map(prev).set(key, [...existing, selectedDate])
    })
  }
```

- [ ] **Step 5：用新的 `NutritionHeader` 取代舊的 `NutritionHeader`**

找到 JSX 中：
```tsx
        {tab === 'nutrition' && <NutritionHeader />}
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
          />
        )}
```

- [ ] **Step 6：傳入 `loading` prop 給 NutritionTab**

找到：
```tsx
          {tab === 'nutrition' && (
            <NutritionTab
              nutritionDay={nutritionDay}
              onUpdateMeal={updateMeal}
              onAddMeal={addMeal}
              onDeleteMeal={deleteMeal}
              onReorderMeals={reorderMeals}
              foodDb={foodDb}
              goals={userGoals}
            />
          )}
```
改為：
```tsx
          {tab === 'nutrition' && (
            <NutritionTab
              nutritionDay={nutritionDay}
              onUpdateMeal={updateMeal}
              onAddMeal={addMeal}
              onDeleteMeal={deleteMeal}
              onReorderMeals={reorderMeals}
              foodDb={foodDb}
              goals={userGoals}
              loading={nutritionLoading}
            />
          )}
```

- [ ] **Step 7：刪除舊的 `NutritionHeader` function（已被新元件取代）**

找到並刪除 `fitness-app.tsx` 中整個 `function NutritionHeader()` 定義（約第 45-75 行），因為已由 `nutrition-header.tsx` 中的受控版本取代。

- [ ] **Step 8：確認 TypeScript 無錯誤**

```bash
cd /Users/user/Desktop/fitness && npx tsc --noEmit 2>&1 | head -30
```
預期：無新增錯誤。

- [ ] **Step 9：確認 lint 無錯誤**

```bash
cd /Users/user/Desktop/fitness && npx eslint components/fitness/fitness-app.tsx components/fitness/nutrition-header.tsx --max-warnings=0 2>&1 | tail -10
```

- [ ] **Step 10：Commit**

```bash
git add components/fitness/fitness-app.tsx
git commit -m "feat(fitness-app): 串接日曆查詢 — 日期 state、handler、NutritionHeader"
```

---

## Task 5：手動驗收測試

**Files:** 無程式碼修改

- [ ] **Step 1：啟動開發伺服器**

```bash
cd /Users/user/Desktop/fitness && npm run dev
```

開啟瀏覽器 `http://localhost:3000`，切換到飲食頁籤。

- [ ] **Step 2：確認 Header 右側日曆 icon 顯示正常**

預期：橙色日曆 icon，左側副標題顯示今天日期（例：「5月27日 週三」）。

- [ ] **Step 3：點擊日曆 icon，確認月曆展開**

預期：
- Header 正下方出現月份導覽列與日期格子
- 今天的日期有橙色邊框圓
- 未來日期為淺灰色
- 有紀錄的日期下方有橙色小點（若當月有資料）

- [ ] **Step 4：點擊過去某個有紀錄的日期**

預期：
- 月曆收合
- Header 副標題更新為所選日期
- NutritionTab 出現短暫骨架動畫
- 骨架消失後顯示該天的餐點紀錄

- [ ] **Step 5：點擊空白日期（無紀錄），新增一餐**

預期：
- 新增的餐點記錄到所選日期（非今天）
- 重新開啟月曆，該日期出現橙色圓點

- [ ] **Step 6：切換月份（點 `<` / `>`）**

預期：
- 月份正確切換
- 下個月若在未來，`>` 按鈕呈灰色不可點
- 切回已查過的月份時，圓點立即出現（不重新 fetch）

- [ ] **Step 7：最終 Commit（若有任何修正）**

```bash
git add -A && git commit -m "fix(calendar): 手動驗收後修正細節"
```
若無修正則跳過此步驟。
