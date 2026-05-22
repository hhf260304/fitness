# Workout Tab Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為訓練紀錄頁面的 Session 卡片加入拖移排序、總休息時間顯示、以及內嵌編輯名稱三項功能。

**Architecture:** 使用 @dnd-kit/sortable 實作觸控友善的拖移排序，Session 順序透過新增的 `sort_order` 欄位持久化到 Neon PostgreSQL。另外兩項功能（休息時間顯示、名稱編輯）為純 UI 變更，只改 `workout-tab.tsx`。

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + Neon PostgreSQL, @dnd-kit/core + @dnd-kit/sortable, TypeScript, inline CSS-in-JS.

---

## File Map

| 檔案 | 變更說明 |
|------|---------|
| `package.json` | 新增 @dnd-kit/core、@dnd-kit/sortable、@dnd-kit/utilities |
| `lib/db/schema.ts` | `sessions` 表加 `sortOrder integer` 欄位 |
| `lib/db/migrations/` | 由 drizzle-kit generate 自動產生 |
| `lib/actions/sessions.ts` | `getSessions` 改排序；新增 `reorderSessions` action |
| `components/fitness/workout-tab.tsx` | SessionCard 加拖把手 props、名稱編輯、休息時間；新增 SortableSessionCard；WorkoutTab 加 DndContext |
| `components/fitness/fitness-app.tsx` | 新增 `reorderSessions` handler；傳入新 prop |

---

## Task 1: 安裝 @dnd-kit 套件

**Files:**
- Modify: `package.json` (by npm install)

- [ ] **Step 1: 安裝套件**

```bash
cd /Users/user/Desktop/fitness
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: 無 error，`package.json` 中可見三個 @dnd-kit 依賴。

- [ ] **Step 2: 確認安裝**

```bash
cat package.json | grep dnd-kit
```

Expected: 輸出三行，各含版本號。

---

## Task 2: 更新 DB Schema 並產生 migration

**Files:**
- Modify: `lib/db/schema.ts` — sessions 表加 sortOrder
- Create: `lib/db/migrations/` — 由 drizzle-kit 自動產生

- [ ] **Step 1: 更新 schema.ts**

開啟 `lib/db/schema.ts`，在 `sessions` 表定義中加入 `sortOrder` 欄位（加在 `date` 後面）：

```typescript
export const sessions = pgTable('sessions', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  date:      date('date').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
})
```

- [ ] **Step 2: 產生 migration 檔案**

```bash
npx drizzle-kit generate
```

Expected: 在 `lib/db/migrations/` 產生一個新的 `0002_*.sql` 檔案，內容含 `ALTER TABLE "sessions" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL`。

- [ ] **Step 3: 套用 migration 到 Neon DB**

```bash
npx drizzle-kit migrate
```

Expected: 輸出 `migrations applied successfully` 類似訊息，無 error。

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts lib/db/migrations/
git commit -m "feat(db): 為 sessions 表加入 sort_order 欄位"
```

---

## Task 3: 更新 sessions server actions

**Files:**
- Modify: `lib/actions/sessions.ts`

- [ ] **Step 1: 更新 getSessions 的排序邏輯**

在 `lib/actions/sessions.ts` 找到 `getSessions` 函式，將 `orderBy` 由 `desc(t.date)` 改為先按 `sort_order` 升冪、次按 `id` 降冪（讓未拖移過的新 session 保持新的在前）：

```typescript
export async function getSessions(): Promise<Session[]> {
  const { userId } = await verifySession()
  const rows = await db.query.sessions.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    with:  { exercises: true },
    orderBy: (t, { asc, desc }) => [asc(t.sortOrder), desc(t.id)],
  })
  return rows.map(r => toSession(r, r.exercises))
}
```

- [ ] **Step 2: 新增 reorderSessions action**

在 `lib/actions/sessions.ts` 尾端加入：

```typescript
export async function reorderSessions(ids: number[]): Promise<void> {
  const { userId } = await verifySession()
  await Promise.all(
    ids.map((id, index) =>
      db.update(sessions)
        .set({ sortOrder: index })
        .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    )
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/sessions.ts
git commit -m "feat(sessions): 更新排序邏輯並新增 reorderSessions action"
```

---

## Task 4: 更新 SessionCard — 休息時間 + 名稱編輯 + 拖把手 props

**Files:**
- Modify: `components/fitness/workout-tab.tsx` — SessionCard 元件

此 Task 不動拖移邏輯，只改 SessionCard 本身。

- [ ] **Step 1: 更新 SessionCard props 型別**

找到 `function SessionCard(...)` 的 props 定義，改成：

```typescript
import type { DraggableSyntheticListeners } from '@dnd-kit/core'

function SessionCard({
  session, onUpdate, onDelete, dragListeners, dragAttributes,
}: {
  session: Session
  onUpdate: (s: Session) => void
  onDelete: () => void
  dragListeners?:  DraggableSyntheticListeners
  dragAttributes?: React.HTMLAttributes<HTMLElement>
}) {
```

注意：`dragAttributes` 使用 `React.HTMLAttributes<HTMLElement>` 是因為 @dnd-kit 回傳的 aria 屬性（role, tabIndex, aria-*）都是合法 HTML 屬性，此型別可安全地 spread 到 JSX 元素上。

- [ ] **Step 2: 加入新的 state 與計算**

在 SessionCard 函式本體的現有 `const [expanded, ...]` 等 state 宣告後面加入：

```typescript
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState(session.name)

  const totalRestSec = session.exercises.reduce((s, e) => s + e.sets * e.rest, 0)

  const confirmNameEdit = () => {
    setEditingName(false)
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== session.name) {
      onUpdate({ ...session, name: trimmed })
    } else {
      setNameInput(session.name)
    }
  }
```

- [ ] **Step 3: 替換 SessionCard 的 header JSX**

找到 SessionCard return 裡的外層點擊 div（目前以 `<div onClick={() => setExpanded...` 開頭），整段替換為下列內容。注意：展開區塊（`{expanded && ...}`）不動，只改 header 部分。

```tsx
      {/* ── Card header ──────────────────────────────────── */}
      <div
        onClick={() => !editingName && setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'flex-start',
          padding: '13px 14px', cursor: editingName ? 'default' : 'pointer', gap: 10,
        }}
      >
        {/* Drag handle */}
        <div
          {...dragListeners}
          {...dragAttributes}
          onClick={e => e.stopPropagation()}
          style={{
            cursor: 'grab', color: C.textTer, flexShrink: 0,
            display: 'flex', alignItems: 'center', alignSelf: 'center',
            touchAction: 'none', padding: '4px 2px',
          }}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <circle cx="3.5" cy="3"  r="1.5" fill="currentColor"/>
            <circle cx="3.5" cy="8"  r="1.5" fill="currentColor"/>
            <circle cx="3.5" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="8.5" cy="3"  r="1.5" fill="currentColor"/>
            <circle cx="8.5" cy="8"  r="1.5" fill="currentColor"/>
            <circle cx="8.5" cy="13" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        {/* Name + stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={confirmNameEdit}
                onKeyDown={e => {
                  if (e.key === 'Enter')  confirmNameEdit()
                  if (e.key === 'Escape') { setEditingName(false); setNameInput(session.name) }
                }}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, fontSize: 15, fontWeight: 800, color: C.text,
                  background: C.surfaceHigh, border: `1px solid ${C.accent}`,
                  borderRadius: 8, padding: '3px 8px', outline: 'none',
                }}
              />
            ) : (
              <>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                  {session.name}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setEditingName(true) }}
                  style={{
                    background: 'none', border: 'none', color: C.textTer,
                    cursor: 'pointer', padding: '2px', flexShrink: 0, lineHeight: 1,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
                      stroke="currentColor" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </button>
              </>
            )}
          </div>
          <div style={{
            fontSize: 11, color: C.textSec, marginTop: 3,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {session.exercises.length} 個動作 · {totalSets} 總組數
            {session.exercises.length > 0 && (
              ` · 休息 ${Math.floor(totalRestSec / 60)}:${String(totalRestSec % 60).padStart(2, '0')}`
            )}
          </div>
          {muscles.length > 0 && (
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' as const }}>
              {muscles.map(m => <MuscleTag key={m} muscle={m} small />)}
            </div>
          )}
        </div>

        {/* Delete + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={e => {
              e.stopPropagation()
              if (window.confirm(`刪除「${session.name}」？`)) onDelete()
            }}
            style={{
              background: C.red + '18', border: 'none', borderRadius: 8,
              padding: '5px 8px', color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>刪除</button>
          <svg width="10" height="7" viewBox="0 0 10 7" style={{
            transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          }}>
            <path d="M1 1l4 4 4-4" stroke={C.textSec} strokeWidth="1.8"
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
```

- [ ] **Step 4: 確認 TypeScript 編譯無錯誤**

```bash
npx tsc --noEmit
```

Expected: 無 error 輸出。

- [ ] **Step 5: Commit**

```bash
git add components/fitness/workout-tab.tsx
git commit -m "feat(workout): SessionCard 加入休息時間顯示、名稱編輯、拖把手 props"
```

---

## Task 5: 新增 SortableSessionCard 並為 WorkoutTab 加入 DnD

**Files:**
- Modify: `components/fitness/workout-tab.tsx` — 加 import、SortableSessionCard、更新 WorkoutTab

- [ ] **Step 1: 在檔案頂端加入 @dnd-kit imports**

在 `'use client'` 下方、現有 import 之後加入：

```typescript
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
```

- [ ] **Step 2: 在 SessionCard 之後、AddSessionSheet 之前插入 SortableSessionCard**

```tsx
// ── SortableSessionCard ───────────────────────────────────────
function SortableSessionCard({
  session, onUpdate, onDelete,
}: {
  session: Session
  onUpdate: (s: Session) => void
  onDelete: () => void
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: session.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity:  isDragging ? 0.4 : 1,
        position: 'relative' as const,
        zIndex:   isDragging ? 10 : undefined,
      }}
    >
      <SessionCard
        session={session}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  )
}
```

- [ ] **Step 3: 更新 WorkoutTab props 型別並加入 DnD 邏輯**

找到 `export function WorkoutTab(...)` 整段，替換為：

```tsx
// ── WorkoutTab ────────────────────────────────────────────────
export function WorkoutTab({
  sessions, onUpdateSession, onDeleteSession, onAddSession, onReorderSessions,
}: {
  sessions: Session[]
  onUpdateSession: (id: number, updated: Session) => void
  onDeleteSession: (id: number) => void
  onAddSession: (s: Session) => void
  onReorderSessions: (ids: number[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sessions.findIndex(s => s.id === active.id)
    const newIndex = sessions.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sessions, oldIndex, newIndex)
    onReorderSessions(reordered.map(s => s.id))
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
      {sessions.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>🏋️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.textSec }}>尚無訓練紀錄</div>
          <div style={{ fontSize: 12, color: C.textTer }}>點下方按鈕建立第一份訓練</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sessions.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 16px 4px' }}>
              {sessions.map(s => (
                <SortableSessionCard
                  key={s.id}
                  session={s}
                  onUpdate={updated => onUpdateSession(s.id, updated)}
                  onDelete={() => onDeleteSession(s.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div style={{ padding: '10px 16px 20px' }}>
        <button onClick={() => setShowAdd(true)} style={{
          width: '100%', background: C.accent + '10',
          border: `1.5px dashed ${C.accent}50`, borderRadius: 14, padding: '13px',
          color: C.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 新建訓練
        </button>
      </div>

      {showAdd && (
        <AddSessionSheet
          onAdd={s => { onAddSession(s); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: 確認 TypeScript 編譯無錯誤**

```bash
npx tsc --noEmit
```

Expected: 無 error。若出現 `onReorderSessions` 相關 error，代表 FitnessApp 尚未更新（Task 6 會修正）。此時可暫時忽略，繼續下一步。

- [ ] **Step 5: Commit**

```bash
git add components/fitness/workout-tab.tsx
git commit -m "feat(workout): WorkoutTab 加入拖移排序（@dnd-kit）"
```

---

## Task 6: 更新 FitnessApp 接線

**Files:**
- Modify: `components/fitness/fitness-app.tsx`

- [ ] **Step 1: 新增 reorderSessions handler**

在 `fitness-app.tsx` 的 `// ── Session CRUD ──` 區塊裡，`addSession` 函式之後加入：

```typescript
  const reorderSessions = async (ids: number[]) => {
    // 樂觀更新：立即重排 UI
    const map = new Map(sessions.map(s => [s.id, s]))
    setSessions(ids.map(id => map.get(id)!).filter(Boolean))
    await sessionActions.reorderSessions(ids)
  }
```

- [ ] **Step 2: 將 onReorderSessions prop 傳入 WorkoutTab**

找到 JSX 中的 `<WorkoutTab ... />` 區塊，補上新 prop：

```tsx
            <WorkoutTab
              sessions={sessions}
              onUpdateSession={updateSession}
              onDeleteSession={deleteSession}
              onAddSession={addSession}
              onReorderSessions={reorderSessions}
            />
```

- [ ] **Step 3: 確認 TypeScript 編譯無錯誤**

```bash
npx tsc --noEmit
```

Expected: 無 error 輸出。

- [ ] **Step 4: Commit**

```bash
git add components/fitness/fitness-app.tsx
git commit -m "feat(app): 接線 reorderSessions，傳入 WorkoutTab"
```

---

## Task 7: 啟動 dev server 驗證三項功能

**Files:** 無（驗證步驟）

- [ ] **Step 1: 啟動 dev server**

```bash
npm run dev
```

在瀏覽器開啟 `http://localhost:3000`，切換到訓練紀錄頁。

- [ ] **Step 2: 驗證總休息時間**

確認每張 Session 卡片統計列顯示「X 個動作 · Y 總組數 · 休息 M:SS」。若 session 沒有動作，不顯示休息時間部分。

- [ ] **Step 3: 驗證名稱編輯**

點擊 Session 名稱旁的鉛筆圖示 → input 出現，可輸入新名稱 → Enter 確認 → 名稱更新並存入 DB（重整頁面後仍保留）。按 Escape 取消。

- [ ] **Step 4: 驗證拖移排序**

拖動 Session 卡片左側的 `⠿` 圖示，確認可拖移重排。重整頁面後順序保留（已寫入 DB）。手機模擬器（Chrome DevTools Device Mode）測試觸控拖移。

- [ ] **Step 5: 確認無回歸**

瀏覽其他 tab（飲食紀錄、食物庫、個人設定），確認功能正常。展開 Session 卡片測試新增 / 編輯 / 刪除動作功能正常。
