# Workout Tab Enhancements — Design Spec
Date: 2026-05-23

## Overview

Three UX improvements to the 訓練紀錄 (WorkoutTab) page:

1. **Drag-to-reorder** — Session cards can be reordered via touch drag
2. **Total rest time** — Session header shows Σ(sets × rest) formatted as `m:ss`
3. **Edit session name** — Session name is editable inline after creation

---

## Feature 1: Drag-to-reorder Session Cards

### Scope
Only top-level Session cards are reorderable. Exercises within a session are not in scope.

### Library
Install `@dnd-kit/core` and `@dnd-kit/sortable`. These are touch-friendly and work well with React state. No other drag library is introduced.

### UI
Each `SessionCard` gets a `≡` drag-handle icon on the far left of the card header, before the name/stats block. The handle is visible at all times so the affordance is clear. Dragging the handle lifts the card; other cards shift to show the insertion point.

### Persistence
The current DB `getSessions` query orders by `date DESC`. To persist custom order across reloads, a `sort_order integer` column is added to the `sessions` table (default `0`). Existing rows get a one-time migration that sets `sort_order` based on their insertion order (ascending `id`).

After a drag operation:
1. `sessions` state is reordered immediately (optimistic update).
2. A `reorderSessions(ids: number[])` server action fires in the background, bulk-updating `sort_order` for all sessions belonging to the user.
3. `getSessions` is updated to `ORDER BY sort_order ASC, id ASC` (id as tiebreaker for new sessions before any drag).

### Data Flow
```
WorkoutTab (DndContext + SortableContext)
  └─ SessionCard (useSortable, drag handle)
       └─ onDragEnd → WorkoutTab reorders local state
                    → calls onReorderSessions(newIds)
                         → FitnessApp.reorderSessions(ids)
                              → sessionActions.reorderSessions(ids)
```

### New Prop
`WorkoutTab` receives a new prop: `onReorderSessions: (ids: number[]) => void`.

---

## Feature 2: Total Rest Time in Session Header

### Calculation
```
totalRestSec = Σ (exercise.sets × exercise.rest)   for all exercises in session
```

### Display
Added to the existing stats line:

```
6 個動作 · 18 總組數 · 休息 8:30
```

Format: `m:ss` (minutes colon zero-padded seconds). Hidden entirely when the session has no exercises.

### Implementation
Pure UI change in `SessionCard`. No DB or prop changes needed.

---

## Feature 3: Inline Edit of Session Name

### UI
A small pencil SVG icon (`✏` equivalent) appears to the right of the session name text, always visible (not hover-only, since this is a touch UI). Tapping the icon:
- Toggles a `editingName` boolean state in `SessionCard`
- Replaces the `<span>` with a focused `<input>` pre-filled with the current name
- The expand/collapse click handler is suppressed while editing

Confirming (Enter key or onBlur):
- Trims the value; if empty, reverts to the original name
- Calls `onUpdate({ ...session, name: trimmedName })`
- Returns to display mode

Cancelling (Escape key):
- Reverts to original name without saving

### No new props needed
Uses the existing `onUpdate: (s: Session) => void` callback.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `sortOrder` integer column to `sessions` table |
| `lib/db/migrations/0002_add_sort_order.sql` | Migration: add column + populate from `id` |
| `lib/actions/sessions.ts` | Update `getSessions` order; add `reorderSessions` action |
| `lib/types.ts` | No change (sort_order is DB-internal) |
| `components/fitness/workout-tab.tsx` | DnD wrappers, drag handle, rest time display, name edit |
| `components/fitness/fitness-app.tsx` | Add `reorderSessions` handler; pass `onReorderSessions` prop |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable` |

---

## Out of Scope

- Reordering exercises within a session
- Editing the session date
- Any animation beyond what @dnd-kit provides by default
