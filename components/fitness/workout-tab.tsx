'use client'

import { useState } from 'react'
import type { Session, Exercise, MuscleGroup } from '@/lib/types'
import { C, MUSCLE_COLORS, MUSCLES } from '@/lib/fitness-constants'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── MuscleTag ─────────────────────────────────────────────────
function MuscleTag({ muscle, small }: { muscle: string; small?: boolean }) {
  const mc = MUSCLE_COLORS[muscle] || '#AAA'
  return (
    <span style={{
      fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: '0.3px',
      color: mc, background: mc + '20', padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 99, border: `1px solid ${mc}30`, whiteSpace: 'nowrap',
    }}>{muscle}</span>
  )
}

// ── ExerciseRow ───────────────────────────────────────────────
function ExerciseRow({ exercise, onEdit }: { exercise: Exercise; onEdit: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 14px', gap: 10,
      borderBottom: `1px solid ${C.border}30`,
    }}>
      <div style={{
        width: 3, alignSelf: 'stretch', borderRadius: 2,
        background: MUSCLE_COLORS[exercise.muscle] || '#AAA', flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{exercise.name}</span>
          {exercise.nameEn && <span style={{ fontSize: 11, color: C.textSec }}>{exercise.nameEn}</span>}
          <MuscleTag muscle={exercise.muscle} small />
        </div>
        <div style={{
          fontSize: 12, color: C.textSec, marginTop: 4,
          display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ color: C.text, fontWeight: 700 }}>
            {exercise.sets} 組 × {exercise.reps} 次
          </span>
          <span style={{ color: C.textTer }}>·</span>
          <span>{exercise.weight} kg</span>
          <span style={{ color: C.textTer }}>·</span>
          <span>休息 {exercise.rest}s</span>
        </div>
      </div>
      <button onClick={onEdit} style={{
        background: C.surfaceHigh, border: 'none', borderRadius: 20,
        padding: '5px 12px', color: C.textSec, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', flexShrink: 0,
      }}>編輯</button>
    </div>
  )
}

// ── ExerciseEditCard ──────────────────────────────────────────
function ExerciseEditCard({
  exercise, onSave, onDelete,
}: {
  exercise: Exercise
  onSave: (e: Exercise) => void
  onDelete: () => void
}) {
  const [local, setLocal] = useState<Exercise>({ ...exercise })
  const set = <K extends keyof Exercise>(k: K, v: Exercise[K]) =>
    setLocal(prev => ({ ...prev, [k]: v }))

  type NumKey = 'sets' | 'reps' | 'weight' | 'rest'
  const [strVals, setStrVals] = useState<Record<NumKey, string>>({
    sets: String(exercise.sets), reps: String(exercise.reps),
    weight: String(exercise.weight), rest: String(exercise.rest),
  })

  const numField = (key: NumKey, label: string, color: string) => (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const }}>
        {label}
      </label>
      <input
        type="number" value={strVals[key]}
        onChange={e => {
          setStrVals(prev => ({ ...prev, [key]: e.target.value }))
          const n = parseFloat(e.target.value)
          if (!isNaN(n)) set(key, n as never)
        }}
        onBlur={() => {
          const n = parseFloat(strVals[key])
          const safe = isNaN(n) ? 0 : n
          setStrVals(prev => ({ ...prev, [key]: String(safe) }))
          set(key, safe as never)
        }}
        style={{
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '9px 6px', color: C.text,
          fontSize: 16, fontWeight: 800, textAlign: 'center' as const,
          outline: 'none', width: '100%', fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  )

  return (
    <div style={{
      background: C.surfaceHigh, borderRadius: 14,
      border: `1px solid ${C.accent}40`, padding: '14px', margin: '6px 10px',
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={local.name}
          onChange={e => set('name', e.target.value)}
          placeholder="動作名稱"
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 14,
            fontWeight: 700, outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 12 }}>
        {MUSCLES.map(m => {
          const mc = MUSCLE_COLORS[m] || '#AAA'
          const sel = local.muscle === m
          return (
            <button key={m} onClick={() => set('muscle', m as MuscleGroup)} style={{
              background: sel ? mc + '25' : C.surface, color: sel ? mc : C.textSec,
              border: `1px solid ${sel ? mc + '60' : C.border}`,
              borderRadius: 99, padding: '4px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>{m}</button>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {numField('sets',   '組數',    C.accent)}
        {numField('reps',   '次數',    MUSCLE_COLORS['胸'])}
        {numField('weight', '重量 kg', MUSCLE_COLORS['背'])}
        {numField('rest',   '休息 s',  MUSCLE_COLORS['肩'])}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave(local)} style={{
          flex: 1, background: C.accent, color: '#000', border: 'none',
          borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
        }}>✓ 完成</button>
        <button onClick={onDelete} style={{
          background: C.red + '18', color: C.red,
          border: `1px solid ${C.red}30`, borderRadius: 10, padding: '10px 14px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>刪除</button>
      </div>
    </div>
  )
}

// ── AddExerciseSheet ──────────────────────────────────────────
function AddExerciseSheet({
  onAdd, onClose,
}: {
  onAdd: (e: Exercise) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: '', muscle: '' as MuscleGroup | '', sets: 3, weight: 60, reps: 10, rest: 90,
  })
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  type NumKey2 = 'sets' | 'reps' | 'weight' | 'rest'
  const [strVals, setStrVals] = useState<Record<NumKey2, string>>({
    sets: '3', reps: '10', weight: '60', rest: '90',
  })

  const numInp = (key: NumKey2, label: string, color: string) => (
    <div key={key}>
      <label style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type="number" value={strVals[key]}
        onChange={e => {
          setStrVals(prev => ({ ...prev, [key]: e.target.value }))
          const n = parseFloat(e.target.value)
          if (!isNaN(n)) set(key, n as never)
        }}
        onBlur={() => {
          const n = parseFloat(strVals[key])
          const safe = isNaN(n) ? 0 : n
          setStrVals(prev => ({ ...prev, [key]: String(safe) }))
          set(key, safe as never)
        }}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '9px 6px', color: C.text, fontSize: 16,
          fontWeight: 800, textAlign: 'center' as const, outline: 'none',
          width: '100%', fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  )

  const valid = form.name.trim() && form.muscle

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', zIndex: 1,
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 16 }}>新增訓練動作</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>動作名稱</label>
          <input
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="例：臥推、深蹲…" autoFocus
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>訓練部位</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
            {MUSCLES.map(m => {
              const mc = MUSCLE_COLORS[m] || '#AAA'
              const sel = form.muscle === m
              return (
                <button key={m} onClick={() => set('muscle', m as MuscleGroup)} style={{
                  background: sel ? mc + '25' : C.surface, color: sel ? mc : C.textSec,
                  border: `1px solid ${sel ? mc + '60' : C.border}`,
                  borderRadius: 99, padding: '6px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{m}</button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {numInp('sets',   '組數',    C.accent)}
          {numInp('reps',   '次數',    MUSCLE_COLORS['胸'])}
          {numInp('weight', '重量 kg', MUSCLE_COLORS['背'])}
          {numInp('rest',   '休息 s',  MUSCLE_COLORS['肩'])}
        </div>

        <button
          onClick={() => {
            if (!valid) return
            onAdd({ id: Date.now(), ...form, muscle: form.muscle as MuscleGroup })
          }}
          disabled={!valid}
          style={{
            width: '100%', background: valid ? C.accent : C.border,
            color: valid ? '#000' : C.textSec, border: 'none',
            borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 800,
            cursor: valid ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
          }}>新增動作</button>
      </div>
    </div>
  )
}

// ── SessionCard ───────────────────────────────────────────────
function SessionCard({
  session, onUpdate, onDelete, dragListeners, dragAttributes,
}: {
  session: Session
  onUpdate: (s: Session) => void
  onDelete: () => void
  dragListeners?:  DraggableSyntheticListeners
  dragAttributes?: React.HTMLAttributes<HTMLElement>
}) {
  const [expanded, setExpanded]   = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddEx, setShowAddEx] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState(session.name)

  const muscles   = [...new Set(session.exercises.map(e => e.muscle))].slice(0, 4)
  const totalSets = session.exercises.reduce((s, e) => s + (e.sets || 0), 0)

  const totalRestSec = session.exercises.reduce((s, e) => s + (e.sets || 0) * (e.rest || 0), 0)

  const confirmNameEdit = () => {
    setEditingName(false)
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== session.name) {
      onUpdate({ ...session, name: trimmed })
    } else {
      setNameInput(session.name)
    }
  }


  const updateEx = (id: number, updated: Exercise) =>
    onUpdate({ ...session, exercises: session.exercises.map(e => e.id === id ? updated : e) })
  const deleteEx = (id: number) =>
    onUpdate({ ...session, exercises: session.exercises.filter(e => e.id !== id) })
  const addEx = (ex: Exercise) =>
    onUpdate({ ...session, exercises: [...session.exercises, ex] })

  return (
    <div style={{
      background: C.surface, borderRadius: 16,
      border: `1px solid ${expanded ? C.border + 'AA' : C.border}`,
      overflow: 'hidden', transition: 'border-color 0.2s', position: 'relative',
    }}>
      {/* ── Card header ──────────────────────────────────── */}
      <div
        onClick={() => !editingName && setExpanded(p => !p)}
        style={{
          display: 'flex', alignItems: 'flex-start',
          padding: '13px 14px', cursor: editingName ? 'default' : 'pointer', gap: 10,
        }}
      >
        {/* Drag handle */}
        {dragListeners && (
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
        )}

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
                  if (e.key === 'Enter')  e.currentTarget.blur()
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
                  onClick={e => { e.stopPropagation(); setNameInput(session.name); setEditingName(true) }}
                  style={{
                    background: 'none', border: 'none', color: C.textTer,
                    cursor: 'pointer', padding: '6px', flexShrink: 0, lineHeight: 1,
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

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, position: 'relative' }}>
          {session.exercises.length === 0 && (
            <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: C.textTer }}>
              尚未新增動作
            </div>
          )}
          {session.exercises.map(ex =>
            editingId === ex.id ? (
              <ExerciseEditCard key={ex.id} exercise={ex}
                onSave={updated => { updateEx(ex.id, updated); setEditingId(null) }}
                onDelete={() => { deleteEx(ex.id); setEditingId(null) }}
              />
            ) : (
              <ExerciseRow key={ex.id} exercise={ex}
                onEdit={() => setEditingId(prev => prev === ex.id ? null : ex.id)}
              />
            )
          )}
          <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${C.border}30` }}>
            <button onClick={() => setShowAddEx(true)} style={{
              width: '100%', background: C.accent + '10',
              border: `1.5px dashed ${C.accent}50`, borderRadius: 10, padding: '10px',
              color: C.accent, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>+ 新增動作</button>
          </div>
          {showAddEx && (
            <AddExerciseSheet
              onAdd={ex => { addEx(ex); setShowAddEx(false) }}
              onClose={() => setShowAddEx(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

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
        transform: CSS.Translate.toString(transform),
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

// ── AddSessionSheet ───────────────────────────────────────────
function AddSessionSheet({
  onAdd, onClose,
}: {
  onAdd: (s: Session) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/')

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', zIndex: 1,
      }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 16 }}>新建訓練</div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>訓練名稱</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="例：推日訓練、腿日…" autoFocus
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => {
            if (!name.trim()) return
            onAdd({ id: Date.now(), name: name.trim(), date: todayStr, exercises: [] })
          }}
          disabled={!name.trim()}
          style={{
            width: '100%', background: name.trim() ? C.accent : C.border,
            color: name.trim() ? '#000' : C.textSec, border: 'none',
            borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 800,
            cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
          }}>建立訓練</button>
      </div>
    </div>
  )
}

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
    if (oldIndex === -1 || newIndex === -1) return
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
