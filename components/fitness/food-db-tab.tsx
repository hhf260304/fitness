'use client'

import { useState, useEffect } from 'react'
import type { Food, FoodCategory } from '@/lib/types'
import { C, MACRO_COLORS } from '@/lib/fitness-constants'
import { CategoryManagerModal } from '@/components/fitness/category-manager-modal'

// ── FoodFormModal ─────────────────────────────────────────────
function FoodFormModal({ initial, onSave, onClose, title, categories }: {
  initial?: Food
  onSave: (f: Food) => void
  onClose: () => void
  title: string
  categories: FoodCategory[]
}) {
  const [form, setForm] = useState({
    name:        initial?.name                    ?? '',
    servingSize: initial ? String(initial.servingSize) : '',
    calories:    initial ? String(initial.calories)    : '',
    protein:     initial ? String(initial.protein)     : '',
    fat:         initial ? String(initial.fat)          : '',
    carbs:       initial ? String(initial.carbs)        : '',
    categoryId:  initial?.categoryId ?? null as number | null,
  })
  type StringField = 'name' | 'servingSize' | 'calories' | 'protein' | 'fat' | 'carbs'
  const set = (k: StringField, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const valid = form.name.trim() && form.calories && parseFloat(form.servingSize) > 0

  const sanitizeNum = (v: string) => {
    let s = v.replace(/[^\d.]/g, '')
    const dot = s.indexOf('.')
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
    s = s.replace(/^0+(\d)/, '$1')
    return s
  }

  const numInp = (field: StringField, label: string, color: string) => (
    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const }}>
        {label}
      </label>
      <input
        type="text" inputMode="decimal" value={form[field]}
        onChange={e => set(field, sanitizeNum(e.target.value))}
        placeholder=""
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: 20, padding: '20px 20px 24px', zIndex: 1,
        width: '100%', maxWidth: 430, boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{
            background: C.border, border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.textSec, fontSize: 16, lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>食物名稱</label>
          <input
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder=""
            autoFocus
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
              outline: 'none', boxSizing: 'border-box' as const,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
            分類（選填）
          </label>
          <select
            value={form.categoryId ?? ''}
            onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))}
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '9px 14px', color: form.categoryId ? C.text : C.textSec,
              fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, appearance: 'none' as const,
            }}
          >
            <option value="">未分類</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
            基準份量（g / ml）
          </label>
          <input
            type="number" step="1" min="1" value={form.servingSize}
            onChange={e => set('servingSize', e.target.value)}
            placeholder=""
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '9px 14px', color: C.text, fontSize: 15,
              fontWeight: 700, outline: 'none', fontVariantNumeric: 'tabular-nums',
              boxSizing: 'border-box' as const,
            }}
          />
          <div style={{ fontSize: 10, color: C.textTer, marginTop: 4 }}>以下營養數值對應此份量</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 10 }}>
            {numInp('calories', '熱量 kcal', C.orange)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {numInp('protein', '蛋白質 g', MACRO_COLORS.protein)}
            {numInp('fat',     '脂肪 g',   MACRO_COLORS.fat)}
            {numInp('carbs',   '碳水 g',   MACRO_COLORS.carbs)}
          </div>
        </div>

        <button
          onClick={() => {
            if (!valid) return
            onSave({
              id:          initial?.id || Date.now(),
              name:        form.name.trim(),
              servingSize: parseFloat(form.servingSize) || 100,
              calories:    parseFloat(form.calories) || 0,
              protein:     parseFloat(form.protein)  || 0,
              fat:         parseFloat(form.fat)       || 0,
              carbs:       parseFloat(form.carbs)     || 0,
              categoryId:  form.categoryId ?? undefined,
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5, minWidth: 0 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{food.name}</span>
          <span style={{ fontSize: 11, color: C.textSec, fontWeight: 600, flexShrink: 0 }}>每 {food.servingSize ?? 100}g/ml</span>
          {food.categoryName ? (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
              background: C.orange + '18', color: C.orange,
            }}>{food.categoryName}</span>
          ) : (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
              background: C.border, color: C.textSec,
            }}>未分類</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' as const }}>
          <span style={{ color: C.orange, fontWeight: 800 }}>熱量 {food.calories} kcal</span>
          <span style={{ color: MACRO_COLORS.protein }}>蛋白 {food.protein}g</span>
          <span style={{ color: MACRO_COLORS.fat     }}>脂肪 {food.fat}g</span>
          <span style={{ color: MACRO_COLORS.carbs   }}>碳水 {food.carbs}g</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} style={{
          background: C.surfaceHigh, border: 'none', borderRadius: 8,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.textSec, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2L12 4.5L5 11.5H2.5V9L9.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={onDelete} style={{
          background: C.red + '18', border: 'none', borderRadius: 8,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.red, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 3.5l.5 7.5M9 3.5l-.5 7.5M3 3.5l.5 8a1 1 0 001 .5h5a1 1 0 001-.5l.5-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── FoodDbTab ─────────────────────────────────────────────────
export function FoodDbTab({ foodDb, categories, onAdd, onEdit, onDelete, onAddCategory, onRenameCategory, onDeleteCategory }: {
  foodDb: Food[]
  categories: FoodCategory[]
  onAdd: (f: Food) => void
  onEdit: (f: Food) => void
  onDelete: (id: number) => void
  onAddCategory: (name: string) => void
  onRenameCategory: (id: number, name: string) => void
  onDeleteCategory: (id: number) => void
}) {
  const [search,               setSearch]               = useState('')
  const [showForm,             setShowForm]             = useState(false)
  const [editItem,             setEditItem]             = useState<Food | null>(null)
  const [selectedCategoryId,   setSelectedCategoryId]   = useState<number | null>(null)
  const [showCategoryManager,  setShowCategoryManager]  = useState(false)

  // Reset category filter if the selected category is deleted
  useEffect(() => {
    if (selectedCategoryId !== null && selectedCategoryId !== -1) {
      if (!categories.find(c => c.id === selectedCategoryId)) {
        setSelectedCategoryId(null)
      }
    }
  }, [categories, selectedCategoryId])

  const filtered = foodDb.filter(f => {
    const matchSearch   = f.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategoryId === null
      ? true
      : selectedCategoryId === -1
        ? !f.categoryId
        : f.categoryId === selectedCategoryId
    return matchSearch && matchCategory
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        <div style={{ padding: '12px 16px 6px', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
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

        {/* 分類 Chip 列 */}
        {categories.length > 0 && (
          <div style={{ padding: '4px 16px 2px', display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
            {[
              { id: null,  label: '全部' },
              ...categories.map(c => ({ id: c.id as number | null, label: c.name })),
              { id: -1 as number | null, label: '未分類' },
            ].map(chip => (
              <button
                key={chip.id ?? 'all'}
                onClick={() => setSelectedCategoryId(chip.id)}
                style={{
                  background: selectedCategoryId === chip.id ? C.orange : C.surface,
                  color: selectedCategoryId === chip.id ? '#fff' : C.textSec,
                  border: `1px solid ${selectedCategoryId === chip.id ? C.orange : C.border}`,
                  borderRadius: 20, padding: '5px 12px',
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >{chip.label}</button>
            ))}
          </div>
        )}

        <div style={{ padding: '4px 18px 10px', fontSize: 11, color: C.textSec, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>共 {foodDb.length} 項食物{search ? `，搜尋到 ${filtered.length} 項` : ''}</span>
          <button onClick={() => setShowCategoryManager(true)} style={{
            background: C.surfaceHigh, border: 'none', borderRadius: 8,
            padding: '4px 10px', fontSize: 11, fontWeight: 700,
            color: C.textSec, cursor: 'pointer',
          }}>管理分類</button>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 8px' }}>
            {filtered.map(food => (
              <FoodDbCard
                key={food.id} food={food}
                onEdit={() => { setEditItem(food); setShowForm(true) }}
                onDelete={() => { if (window.confirm(`刪除「${food.name}」？`)) onDelete(food.id) }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
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
        <FoodFormModal
          initial={editItem ?? undefined}
          title={editItem ? '編輯食物' : '新增食物'}
          categories={categories}
          onSave={food => {
            if (editItem) onEdit(food)
            else onAdd(food)
            setShowForm(false)
            setEditItem(null)
          }}
          onClose={() => { setShowForm(false); setEditItem(null) }}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          onAdd={onAddCategory}
          onRename={onRenameCategory}
          onDelete={onDeleteCategory}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  )
}
