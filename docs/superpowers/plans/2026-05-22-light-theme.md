# Light Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 FitnessLog APP 從深色系全面換為爆發動能淺色風（白底 + `#FF4500` 橘紅 accent）。

**Architecture:** 顏色系統集中在 `lib/fitness-constants.ts`，所有元件透過 `C.*` 引用自動繼承。額外修補 5 個散落的硬編碼值與 1 個底部導覽列的本地常數覆蓋問題。

**Tech Stack:** Next.js 15, Tailwind CSS v4, inline style（無 CSS Modules）

---

## File Map

| 檔案 | 變更內容 |
|------|---------|
| `lib/fitness-constants.ts` | 全換 `C`、`MUSCLE_COLORS`、`MACRO_COLORS` |
| `app/globals.css` | `--background`、`--foreground`、`body` 背景與文字色 |
| `components/fitness/bottom-tab-bar.tsx` | 移除本地 `ACCENT`/`ORANGE` 常數，改用 `C.accent`/`C.orange` |
| `components/fitness/fitness-app.tsx` | 外層容器 `#050505` → `#F0F0F0` |
| `app/login/page.tsx` | 外層容器 `#050505` → `#F0F0F0` |

---

## Task 1: 更新核心色板 (`lib/fitness-constants.ts`)

**Files:**
- Modify: `lib/fitness-constants.ts`

- [ ] **Step 1: 將 `fitness-constants.ts` 完整替換為新色板**

```ts
export const C = {
  bg:          '#FFFFFF',
  surface:     '#F7F7F7',
  surfaceHigh: '#EBEBEB',
  border:      '#E0E0E0',
  accent:      '#FF4500',
  orange:      '#FF4500',
  text:        '#121212',
  textSec:     '#888888',
  textTer:     '#D0D0D0',
  red:         '#D32F2F',
} as const

export const MUSCLE_COLORS: Record<string, string> = {
  '胸':   '#1A6FAA',
  '背':   '#167A54',
  '腿':   '#C44022',
  '肩':   '#7030B8',
  '二頭':  '#8B6500',
  '三頭':  '#8B6500',
  '背/腿': '#B84E15',
  '核心':  '#B02060',
  '全身':  '#505050',
}

export const MACRO_COLORS = {
  protein: '#1A6FAA',
  fat:     '#C44022',
  carbs:   '#8B6500',
  sugar:   '#B02060',
}

export const MUSCLES = ['胸', '背', '腿', '肩', '二頭', '三頭', '核心', '全身'] as const
```

- [ ] **Step 2: Commit**

```bash
git add lib/fitness-constants.ts
git commit -m "feat(theme): 更換淺色色板，accent 改為橘紅 #FF4500"
```

---

## Task 2: 更新 CSS 全域樣式 (`app/globals.css`)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: 更新 `:root` 的 CSS 自定義屬性**

將 `globals.css` 中的 `:root` 區塊從：
```css
:root {
  --background: #080808;
  --foreground: #F0F0F0;
  --radius: 0.625rem;
}
```
改為：
```css
:root {
  --background: #FFFFFF;
  --foreground: #121212;
  --radius: 0.625rem;
}
```

- [ ] **Step 2: 更新 `body` 樣式**

將 `body` 區塊從：
```css
body {
  background: #080808;
  color: #F0F0F0;
  font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}
```
改為：
```css
body {
  background: #FFFFFF;
  color: #121212;
  font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): 更新 globals.css 背景與前景為淺色"
```

---

## Task 3: 修復底部導覽列本地常數 (`components/fitness/bottom-tab-bar.tsx`)

**Files:**
- Modify: `components/fitness/bottom-tab-bar.tsx`

> **背景：** 此檔案頂部定義了本地常數 `ACCENT = '#C8FF00'` 和 `ORANGE = '#FF8A4C'`，這兩個值被 `TABS` 陣列直接引用，會蓋過 `fitness-constants.ts` 的 `C.accent`/`C.orange`，導致底部 Tab 仍顯示舊色。

- [ ] **Step 1: 移除本地常數，改用 `C`**

將檔案頂部的：
```ts
const ACCENT = '#C8FF00'
const ORANGE = '#FF8A4C'
```
完全刪除（共 2 行）。

- [ ] **Step 2: 更新 `TABS` 陣列，改為引用 `C.accent` / `C.orange`**

將：
```ts
const TABS: { id: TabId; label: string; Icon: React.FC<{ active: boolean }>; color: string }[] = [
  { id: 'workout',   label: '訓練',   Icon: DumbbellIcon,  color: ACCENT },
  { id: 'nutrition', label: '飲食',   Icon: ForkKnifeIcon, color: ORANGE },
  { id: 'fooddb',    label: '食物庫',  Icon: FoodDbIcon,    color: ORANGE },
  { id: 'settings',  label: '設定',   Icon: SettingsIcon,  color: ACCENT },
]
```
改為：
```ts
const TABS: { id: TabId; label: string; Icon: React.FC<{ active: boolean }>; color: string }[] = [
  { id: 'workout',   label: '訓練',   Icon: DumbbellIcon,  color: C.accent },
  { id: 'nutrition', label: '飲食',   Icon: ForkKnifeIcon, color: C.orange },
  { id: 'fooddb',    label: '食物庫',  Icon: FoodDbIcon,    color: C.orange },
  { id: 'settings',  label: '設定',   Icon: SettingsIcon,  color: C.accent },
]
```

- [ ] **Step 3: Commit**

```bash
git add components/fitness/bottom-tab-bar.tsx
git commit -m "fix(theme): 移除底部導覽列本地色彩常數，改用 C.accent/C.orange"
```

---

## Task 4: 修補硬編碼背景色

**Files:**
- Modify: `components/fitness/fitness-app.tsx:205`
- Modify: `app/login/page.tsx:30`

- [ ] **Step 1: 修改 `fitness-app.tsx` 外層容器**

找到第 205 行附近的：
```ts
minHeight: '100dvh', background: '#050505',
```
改為：
```ts
minHeight: '100dvh', background: '#F0F0F0',
```

- [ ] **Step 2: 修改 `login/page.tsx` 外層容器**

找到第 30 行附近的：
```ts
minHeight: '100dvh', background: '#050505', padding: '0 24px',
```
改為：
```ts
minHeight: '100dvh', background: '#F0F0F0', padding: '0 24px',
```

- [ ] **Step 3: Commit**

```bash
git add components/fitness/fitness-app.tsx app/login/page.tsx
git commit -m "fix(theme): 修補外層容器硬編碼深色背景"
```

---

## Task 5: 視覺驗證

**Files:** 無

- [ ] **Step 1: 啟動開發伺服器**

```bash
npm run dev
```

在瀏覽器開啟 `http://localhost:3000`。

- [ ] **Step 2: 逐頁目視確認（檢查清單）**

| 頁面/元件 | 確認項目 |
|----------|---------|
| 登入頁 | 背景白色，Logo 文字清晰，輸入框淺灰底深色文字 |
| 訓練 Tab | 背景白色，卡片淺灰，Header icon 橘紅色 |
| 飲食 Tab | 背景白色，Header icon 橘紅色 |
| 食物庫 Tab | 背景白色，Header icon 橘紅色 |
| 設定 Tab | 背景白色，Header icon 橘紅色 |
| 底部導覽列 | active 按鈕橘紅色背景，非 active 為淺灰文字 |
| 肌肉標籤 | 顏色可見（非淡黃、非淡灰），各色相保留 |
| 刪除按鈕 | 紅色仍可識別（`#D32F2F`） |

- [ ] **Step 3: 若發現視覺問題，回對應 Task 修正後重新驗證**

- [ ] **Step 4: 停止開發伺服器（Ctrl+C）**
