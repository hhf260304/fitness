# Delete Modal 重設計 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以統一的 `ConfirmDialog` 元件取代專案中所有 `window.confirm()`，讓刪除確認與覆蓋確認符合 app 整體視覺設計。

**Architecture:** 建立一個共用的 `components/ui/confirm-dialog.tsx`，底層使用 `radix-ui` 的 `AlertDialog`。各呼叫點各自用本地 `useState` 管理 open 狀態，並將原有的 `window.confirm()` 替換為 `setXxxOpen(true)` + `<ConfirmDialog>` JSX。

**Tech Stack:** React (useState), radix-ui (AlertDialog), lucide-react (Trash2, TriangleAlert), inline styles + C 色票

---

## 檔案異動總覽

| 異動 | 路徑 | 說明 |
|------|------|------|
| 新增 | `components/ui/confirm-dialog.tsx` | 共用確認對話框元件 |
| 修改 | `components/fitness/workout-tab.tsx` | SessionCard 刪除確認（line 512） |
| 修改 | `components/fitness/nutrition-tab.tsx` | MealSection 刪除確認（line 720） |
| 修改 | `components/fitness/food-db-tab.tsx` | FoodDbTab 刪除確認（line 337） |
| 修改 | `components/fitness/category-manager-modal.tsx` | 分類刪除確認（line 96） |
| 修改 | `components/fitness/template-manager.tsx` | 模版刪除確認（line 598） |
| 修改 | `components/fitness/fitness-app.tsx` | 覆蓋餐點確認（line 249） |

---

## Task 1：建立 `ConfirmDialog` 元件

**Files:**
- Create: `components/ui/confirm-dialog.tsx`
- Modify: `app/globals.css`（加入動畫 keyframes）

- [ ] **Step 1：在 `app/globals.css` 結尾加入動畫 keyframes**

緊接現有 `@keyframes pulse` 之後加入：

```css
@keyframes confirmFadeIn {
  from { opacity: 0 }
  to   { opacity: 1 }
}
@keyframes confirmDialogIn {
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.96) }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
}
```

- [ ] **Step 2：建立元件檔案**

```tsx
'use client'

import { AlertDialog } from 'radix-ui'
import { Trash2, TriangleAlert } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  onConfirm: () => void
  variant?: 'destructive' | 'warning'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '刪除',
  onConfirm,
  variant = 'destructive',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive'
  const accentColor   = isDestructive ? '#D32F2F' : '#FF4500'
  const iconBg        = isDestructive ? '#D32F2F10' : '#FF450012'

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            animation: 'confirmFadeIn 150ms ease',
          }}
        />
        <AlertDialog.Content
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            background: '#fff',
            borderRadius: 16,
            padding: '28px 24px',
            width: 'min(320px, calc(100vw - 32px))',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            animation: 'confirmDialogIn 150ms ease',
            outline: 'none',
          }}
        >
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              {isDestructive
                ? <Trash2 size={24} color={accentColor} />
                : <TriangleAlert size={24} color={accentColor} />
              }
            </div>

            {/* Title */}
            <AlertDialog.Title style={{
              fontSize: 16, fontWeight: 800, color: '#121212',
              marginBottom: 8, lineHeight: 1.3,
            }}>
              {title}
            </AlertDialog.Title>

            {/* Description */}
            {description && (
              <AlertDialog.Description style={{
                fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0,
              }}>
                {description}
              </AlertDialog.Description>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AlertDialog.Action
              onClick={onConfirm}
              style={{
                padding: 11, borderRadius: 10, border: 'none',
                background: accentColor, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                width: '100%',
              }}
            >
              {confirmLabel}
            </AlertDialog.Action>
            <AlertDialog.Cancel
              style={{
                padding: 11, borderRadius: 10,
                border: '1px solid #E0E0E0', background: 'transparent',
                color: '#121212', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', width: '100%',
              }}
            >
              取消
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
```

- [ ] **Step 3：Commit**

```bash
git add components/ui/confirm-dialog.tsx app/globals.css
git commit -m "feat(ui): 新增 ConfirmDialog 共用元件"
```

---

## Task 2：更新 `workout-tab.tsx`（訓練課表刪除）

**Files:**
- Modify: `components/fitness/workout-tab.tsx`

受影響元件：`SessionCard`（約 line 361）

- [ ] **Step 1：在 SessionCard 中加入 import 與 state**

在 `workout-tab.tsx` 頂部的 import 區塊加入：

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

在 `SessionCard` 函式的 state 宣告區（緊接現有 `const [expanded, ...]` 等之後）加入：

```tsx
const [deleteOpen, setDeleteOpen] = useState(false)
```

- [ ] **Step 2：替換刪除按鈕的 onClick（line 512 附近）**

將：
```tsx
onClick={e => {
  e.stopPropagation()
  if (window.confirm(`刪除「${session.name}」？`)) onDelete()
}}
```

改為：
```tsx
onClick={e => {
  e.stopPropagation()
  setDeleteOpen(true)
}}
```

- [ ] **Step 3：在 SessionCard 的 return JSX 最後、閉合 `</div>` 之前加入 ConfirmDialog**

在 SessionCard return 最外層 div 的結尾（`</div>` 之前）加入：

```tsx
<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title={`刪除「${session.name}」？`}
  description="此操作無法復原。"
  onConfirm={() => { onDelete(); setDeleteOpen(false) }}
/>
```

- [ ] **Step 4：Commit**

```bash
git add components/fitness/workout-tab.tsx
git commit -m "feat(workout): 以 ConfirmDialog 取代刪除確認"
```

---

## Task 3：更新 `nutrition-tab.tsx`（餐點刪除）

**Files:**
- Modify: `components/fitness/nutrition-tab.tsx`

受影響元件：`MealSection`（約 line 627）

- [ ] **Step 1：加入 import**

在 `nutrition-tab.tsx` 頂部 import 區塊加入：

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

- [ ] **Step 2：在 MealSection 的 state 宣告區加入 state**

緊接 `const [showMealEdit, setShowMealEdit] = useState(false)` 之後加入：

```tsx
const [deleteOpen, setDeleteOpen] = useState(false)
```

- [ ] **Step 3：替換刪除按鈕的 onClick（line 720 附近）**

將：
```tsx
onClick={e => {
  e.stopPropagation()
  if (window.confirm(`刪除「${meal.name}」？`)) onDelete()
}}
```

改為：
```tsx
onClick={e => {
  e.stopPropagation()
  setDeleteOpen(true)
}}
```

- [ ] **Step 4：在 MealSection return 的最外層 div 結尾加入 ConfirmDialog**

```tsx
<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title={`刪除「${meal.name}」？`}
  description="此操作無法復原。"
  onConfirm={() => { onDelete(); setDeleteOpen(false) }}
/>
```

- [ ] **Step 5：Commit**

```bash
git add components/fitness/nutrition-tab.tsx
git commit -m "feat(nutrition): 以 ConfirmDialog 取代餐點刪除確認"
```

---

## Task 4：更新 `food-db-tab.tsx`（食物刪除）

**Files:**
- Modify: `components/fitness/food-db-tab.tsx`

注意：目前的呼叫點是在 `FoodDbTab` 的 inline callback（非獨立元件），需將 state 提升到 `FoodDbTab`。

- [ ] **Step 1：加入 import**

在 `food-db-tab.tsx` 頂部 import 區塊加入：

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

- [ ] **Step 2：在 `FoodDbTab` 函式加入 state**

`FoodDbTab` 的 state 宣告區（約 line 225 後）加入：

```tsx
const [deletingFood, setDeletingFood] = useState<{ id: number; name: string } | null>(null)
```

- [ ] **Step 3：替換 FoodDbCard 的 onDelete prop（line 337 附近）**

將：
```tsx
onDelete={() => { if (window.confirm(`刪除「${food.name}」？`)) onDelete(food.id) }}
```

改為：
```tsx
onDelete={() => setDeletingFood({ id: food.id, name: food.name })}
```

- [ ] **Step 4：在 `FoodDbTab` return 的結尾加入 ConfirmDialog**

在 `FoodDbTab` return 的最外層容器結尾（關閉 `</div>` 之前）加入：

```tsx
<ConfirmDialog
  open={deletingFood !== null}
  onOpenChange={open => { if (!open) setDeletingFood(null) }}
  title={`刪除「${deletingFood?.name}」？`}
  description="此操作無法復原。"
  onConfirm={() => {
    if (deletingFood) onDelete(deletingFood.id)
    setDeletingFood(null)
  }}
/>
```

- [ ] **Step 5：Commit**

```bash
git add components/fitness/food-db-tab.tsx
git commit -m "feat(food-db): 以 ConfirmDialog 取代食物刪除確認"
```

---

## Task 5：更新 `category-manager-modal.tsx`（分類刪除）

**Files:**
- Modify: `components/fitness/category-manager-modal.tsx`

注意：此元件本身已在 Dialog 內，radix-ui 的 AlertDialog 可以正常巢狀於 Dialog 中。

- [ ] **Step 1：加入 import**

在 `category-manager-modal.tsx` 頂部 import 區塊加入：

```tsx
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

（若 `useState` 已 import 則略過）

- [ ] **Step 2：在主元件函式加入 state**

在元件函式的 state 宣告區加入：

```tsx
const [deletingCat, setDeletingCat] = useState<{ id: number; name: string } | null>(null)
```

- [ ] **Step 3：替換刪除按鈕的 onClick（line 96 附近）**

將：
```tsx
if (window.confirm(`刪除分類「${cat.name}」？該分類的食物將變為未分類。`)) onDelete(cat.id)
```

改為：
```tsx
setDeletingCat({ id: cat.id, name: cat.name })
```

- [ ] **Step 4：在 return JSX 結尾加入 ConfirmDialog**

```tsx
<ConfirmDialog
  open={deletingCat !== null}
  onOpenChange={open => { if (!open) setDeletingCat(null) }}
  title={`刪除「${deletingCat?.name}」？`}
  description={
    <>
      此操作無法復原。{' '}
      <span style={{ color: '#D32F2F', fontWeight: 600 }}>
        該分類的食物將變為未分類。
      </span>
    </>
  }
  onConfirm={() => {
    if (deletingCat) onDelete(deletingCat.id)
    setDeletingCat(null)
  }}
/>
```

- [ ] **Step 5：Commit**

```bash
git add components/fitness/category-manager-modal.tsx
git commit -m "feat(food-db): 以 ConfirmDialog 取代分類刪除確認"
```

---

## Task 6：更新 `template-manager.tsx`（模版刪除）

**Files:**
- Modify: `components/fitness/template-manager.tsx`

- [ ] **Step 1：加入 import**

在 `template-manager.tsx` 頂部 import 區塊加入：

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

- [ ] **Step 2：在包含刪除選單的元件中找到適合的 state 位置**

刪除按鈕位在 `TemplateManagerModal` 函式（或 `TemplateListView` 之類）內的選單。先確認 `window.confirm` 所在的函式名稱（約 line 598），然後在該函式的 state 宣告區加入：

```tsx
const [deletingTemplate, setDeletingTemplate] = useState<{ id: number; name: string } | null>(null)
```

- [ ] **Step 3：替換刪除按鈕的 onClick（line 598 附近）**

將：
```tsx
onClick={async () => {
  if (window.confirm(`刪除「${t.name}」模版？`)) {
    await onDelete(t.id)
  }
  setMenuOpenId(null)
}}
```

改為：
```tsx
onClick={() => {
  setDeletingTemplate({ id: t.id, name: t.name })
  setMenuOpenId(null)
}}
```

- [ ] **Step 4：在該函式 return JSX 結尾加入 ConfirmDialog**

```tsx
<ConfirmDialog
  open={deletingTemplate !== null}
  onOpenChange={open => { if (!open) setDeletingTemplate(null) }}
  title={`刪除「${deletingTemplate?.name}」？`}
  description="此操作無法復原。"
  onConfirm={async () => {
    if (deletingTemplate) await onDelete(deletingTemplate.id)
    setDeletingTemplate(null)
  }}
/>
```

- [ ] **Step 5：Commit**

```bash
git add components/fitness/template-manager.tsx
git commit -m "feat(template): 以 ConfirmDialog 取代模版刪除確認"
```

---

## Task 7：更新 `fitness-app.tsx`（覆蓋餐點確認）

**Files:**
- Modify: `components/fitness/fitness-app.tsx`

此場景使用 `variant="warning"`，且原本的控制流程在 try/catch 內，需重構成 state-based 方式。

- [ ] **Step 1：加入 import**

在 `fitness-app.tsx` 頂部 import 區塊加入：

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
```

- [ ] **Step 2：加入 state（在現有 state 宣告區）**

```tsx
const [overwriteOpen, setOverwriteOpen] = useState(false)
```

- [ ] **Step 3：重構 try/catch 內的覆蓋確認（line 249 附近）**

將：
```tsx
try {
  await applyAndUpdate(false)
} catch (e: unknown) {
  if (e instanceof Error && e.message === 'ALREADY_HAS_MEALS') {
    const ok = window.confirm('此日期已有餐點記錄，確定要以模版覆蓋嗎？')
    if (!ok) return
    await applyAndUpdate(true)
  } else {
    throw e
  }
}
```

改為：
```tsx
try {
  await applyAndUpdate(false)
} catch (e: unknown) {
  if (e instanceof Error && e.message === 'ALREADY_HAS_MEALS') {
    setOverwriteOpen(true)
  } else {
    throw e
  }
}
```

- [ ] **Step 4：在 fitness-app return JSX 結尾加入 ConfirmDialog**

找到 `fitness-app` return 的最外層元素結尾，加入：

```tsx
<ConfirmDialog
  open={overwriteOpen}
  onOpenChange={setOverwriteOpen}
  title="覆蓋現有餐點記錄？"
  description="此日期已有餐點記錄，套用模版將會覆蓋現有內容。"
  confirmLabel="確認覆蓋"
  variant="warning"
  onConfirm={async () => {
    setOverwriteOpen(false)
    await applyAndUpdate(true)
  }}
/>
```

- [ ] **Step 5：Commit**

```bash
git add components/fitness/fitness-app.tsx
git commit -m "feat(nutrition): 以 ConfirmDialog 取代覆蓋餐點確認"
```

---

## Task 8：視覺驗證

- [ ] **Step 1：啟動開發伺服器**

```bash
npm run dev
```

- [ ] **Step 2：逐一測試 6 個場景**

| 場景 | 操作步驟 | 預期結果 |
|------|----------|----------|
| 刪除訓練課表 | 點課表列的「刪除」 | 置中 Dialog 出現，有垃圾桶圖示和實心紅色按鈕 |
| 刪除餐點 | 進入餐點編輯模式，點「刪除」 | 同上 |
| 刪除食物 | 在食物庫點食物的刪除按鈕 | 同上 |
| 刪除食物分類 | 分類管理 Modal 中點「刪除」 | 同上，description 有紅色警告字 |
| 刪除模版 | 模版選單點「刪除」 | 同上 |
| 覆蓋餐點 | 對有餐點的日期套用模版 | Dialog 出現，橘色三角形圖示，「確認覆蓋」按鈕 |

- [ ] **Step 3：確認動畫與 ESC/點遮罩關閉正常**

- [ ] **Step 4：Commit（如有視覺調整）**

```bash
git add -p
git commit -m "fix(ui): 調整 ConfirmDialog 視覺細節"
```
