'use client'

import { useState } from 'react'
import type { Food } from '@/lib/types'
import { C, MACRO_COLORS } from '@/lib/fitness-constants'

// ── FoodFormSheet ─────────────────────────────────────────────
function FoodFormSheet({ initial, onSave, onClose, title }: {
  initial?: Food
  onSave: (f: Food) => void
  onClose: () => void
  title: string
}) {
  const [form, setForm] = useState({
    name:     initial?.name     ?? '',
    calories: initial ? String(initial.calories) : '',
    protein:  initial ? String(initial.protein)  : '',
    fat:      initial ? String(initial.fat)       : '',
    carbs:    initial ? String(initial.carbs)     : '',
    sugar:    initial ? String(initial.sugar)     : '',
  })
  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const valid = form.name.trim() && form.calories

  const numInp = (field: keyof typeof form, label: string, color: string) => (
    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const }}>
        {label}
      </label>
      <input
        type="number" step="any" value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder="0"
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '9px 6px', color: C.text, fontSize: 15,
          fontWeight: 800, outline: 'none',
          width: '100%', textAlign: 'center' as const, fontVariantNumeric: 'tabular-nums',
          boxSizing: 'border-box' as const,
        }}
      />
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', zIndex: 1,
      }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 16 }}>{title}</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>食物名稱</label>
          <input
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="例：雞胸肉 100g、全脂牛奶 250ml…"
            autoFocus
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
              outline: 'none', boxSizing: 'border-box' as const,
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {numInp('calories', '熱量 kcal', C.orange)}
          {numInp('protein',  '蛋白質 g',  MACRO_COLORS.protein)}
          {numInp('fat',      '脂肪 g',    MACRO_COLORS.fat)}
          {numInp('carbs',    '碳水 g',    MACRO_COLORS.carbs)}
          {numInp('sugar',    '糖 g',      MACRO_COLORS.sugar)}
        </div>

        <button
          onClick={() => {
            if (!valid) return
            onSave({
              id:       initial?.id || Date.now(),
              name:     form.name.trim(),
              calories: parseInt(form.calories) || 0,
              protein:  parseInt(form.protein)  || 0,
              fat:      parseInt(form.fat)       || 0,
              carbs:    parseInt(form.carbs)     || 0,
              sugar:    parseInt(form.sugar)     || 0,
            })
          }}
          disabled={!valid}
          style={{
            width: '100%', background: valid ? C.orange : C.border,
            color: valid ? '#fff' : C.textSec, border: 'none',
            borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 800,
            cursor: valid ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
          }}>儲存食物</button>
      </div>
    </div>
  )
}

// ── FoodDbCard ────────────────────────────────────────────────
function FoodDbCard({ food, onEdit, onDelete }: {
  food: Food; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14,
      border: `1px solid ${C.border}`, padding: '11px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{food.name}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' as const }}>
          <span style={{ color: C.orange, fontWeight: 800 }}>{food.calories} kcal</span>
          <span style={{ color: MACRO_COLORS.protein }}>蛋白 {food.protein}g</span>
          <span style={{ color: MACRO_COLORS.fat     }}>脂肪 {food.fat}g</span>
          <span style={{ color: MACRO_COLORS.carbs   }}>碳水 {food.carbs}g</span>
          <span style={{ color: MACRO_COLORS.sugar   }}>糖 {food.sugar}g</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} style={{
          background: C.surfaceHigh, border: 'none', borderRadius: 8,
          padding: '5px 11px', color: C.textSec, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>編輯</button>
        <button onClick={onDelete} style={{
          background: C.red + '18', border: 'none', borderRadius: 8,
          padding: '5px 11px', color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>刪除</button>
      </div>
    </div>
  )
}

// ── FoodDbTab ─────────────────────────────────────────────────
export function FoodDbTab({ foodDb, onAdd, onEdit, onDelete }: {
  foodDb: Food[]
  onAdd: (f: Food) => void
  onEdit: (f: Food) => void
  onDelete: (id: number) => void
}) {
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Food | null>(null)

  const filtered = foodDb.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
      <div style={{ padding: '10px 16px 6px', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '8px 12px',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="5" stroke={C.textSec} strokeWidth="1.5"/>
            <path d="M10 10l3 3" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋食物…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: C.text, fontSize: 14,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.textSec, fontSize: 16, lineHeight: 1, padding: 0,
            }}>×</button>
          )}
        </div>
      </div>

      <div style={{ padding: '4px 18px 10px', fontSize: 11, color: C.textSec, fontWeight: 500 }}>
        共 {foodDb.length} 項食物{search ? `，搜尋到 ${filtered.length} 項` : ''}
      </div>

      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 }}>
          <div style={{ fontSize: 40 }}>🥗</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.textSec }}>
            {search ? '找不到相符食物' : '食物庫是空的'}
          </div>
          {!search && <div style={{ fontSize: 12, color: C.textTer }}>點下方按鈕新增第一項食物</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
          {filtered.map(food => (
            <FoodDbCard
              key={food.id} food={food}
              onEdit={() => { setEditItem(food); setShowForm(true) }}
              onDelete={() => { if (window.confirm(`刪除「${food.name}」？`)) onDelete(food.id) }}
            />
          ))}
        </div>
      )}

      <div style={{ padding: '14px 16px 20px' }}>
        <button onClick={() => { setEditItem(null); setShowForm(true) }} style={{
          width: '100%', background: C.orange + '10',
          border: `1.5px dashed ${C.orange}50`, borderRadius: 14, padding: '13px',
          color: C.orange, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 新增食物到食物庫
        </button>
      </div>

      {showForm && (
        <FoodFormSheet
          initial={editItem ?? undefined}
          title={editItem ? '編輯食物' : '新增食物'}
          onSave={food => {
            if (editItem) onEdit(food)
            else onAdd(food)
            setShowForm(false)
            setEditItem(null)
          }}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
