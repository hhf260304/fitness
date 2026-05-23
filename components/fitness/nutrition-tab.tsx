'use client'

import { useState } from 'react'
import type { Meal, Food, Goals, NutritionDay } from '@/lib/types'
import { C, MACRO_COLORS } from '@/lib/fitness-constants'

// ── MacroRow ──────────────────────────────────────────────────
function MacroRow({ label, value, goal, color }: {
  label: string; value: number; goal: number; color: string
}) {
  const pct  = Math.min(100, goal > 0 ? (value / goal) * 100 : 0)
  const over = value > goal
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 40, flexShrink: 0, letterSpacing: '0.2px' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color, borderRadius: 3,
          transition: 'width 0.5s ease',
          boxShadow: over ? `0 0 6px ${color}88` : 'none',
        }} />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 800, color: over ? color : C.text,
        fontVariantNumeric: 'tabular-nums', width: 70, textAlign: 'right' as const, flexShrink: 0,
      }}>
        {value}<span style={{ fontSize: 10, color: C.textSec, fontWeight: 500 }}>/{goal}g</span>
      </span>
    </div>
  )
}

// ── MacroSummary ──────────────────────────────────────────────
function MacroSummary({ totals, goals }: {
  totals: Goals; goals: Goals
}) {
  const calPct    = Math.min(100, goals.calories > 0 ? (totals.calories / goals.calories) * 100 : 0)
  const remaining = Math.max(0, goals.calories - totals.calories)

  return (
    <div style={{
      margin: '8px 16px 12px', background: C.surface, borderRadius: 18,
      border: `1px solid ${C.border}`, padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const }}>
        <span style={{
          fontSize: 38, fontWeight: 900, color: C.orange,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-1px',
        }}>
          {totals.calories.toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>
          / {goals.calories.toLocaleString()} kcal
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: C.textSec, fontWeight: 600,
          background: C.surfaceHigh, padding: '3px 10px', borderRadius: 99,
          border: `1px solid ${C.border}`, whiteSpace: 'nowrap',
        }}>
          剩餘 {remaining.toLocaleString()} kcal
        </span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          height: '100%', width: `${calPct}%`,
          background: `linear-gradient(90deg, ${C.orange}, #FF5500)`,
          borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MacroRow label="蛋白質" value={totals.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
        <MacroRow label="脂肪"   value={totals.fat}     goal={goals.fat}     color={MACRO_COLORS.fat} />
        <MacroRow label="碳水"   value={totals.carbs}   goal={goals.carbs}   color={MACRO_COLORS.carbs} />
        <MacroRow label="糖"     value={totals.sugar}   goal={goals.sugar}   color={MACRO_COLORS.sugar} />
      </div>
    </div>
  )
}

// ── FoodRow ───────────────────────────────────────────────────
function FoodRow({ food, isEditing, onDelete }: {
  food: Food; isEditing: boolean; onDelete: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '9px 14px', borderBottom: `1px solid ${C.border}30`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: C.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{food.name}</div>
        <div style={{
          fontSize: 11, color: C.textSec, marginTop: 3,
          display: 'flex', gap: 8, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' as const,
        }}>
          <span style={{ color: MACRO_COLORS.protein }}>蛋白 {food.protein}g</span>
          <span style={{ color: MACRO_COLORS.fat     }}>脂肪 {food.fat}g</span>
          <span style={{ color: MACRO_COLORS.carbs   }}>碳水 {food.carbs}g</span>
          <span style={{ color: MACRO_COLORS.sugar   }}>糖 {food.sugar}g</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.orange, fontVariantNumeric: 'tabular-nums' }}>
          {food.calories}
        </span>
        <span style={{ fontSize: 10, color: C.textSec, fontWeight: 500 }}>kcal</span>
        {isEditing && (
          <button onClick={onDelete} style={{
            background: C.red + '18', border: 'none', cursor: 'pointer',
            color: C.red, fontSize: 15, lineHeight: 1, padding: '3px 7px',
            borderRadius: 6, display: 'flex', alignItems: 'center',
          }}>×</button>
        )}
      </div>
    </div>
  )
}

// ── AddFoodSheet ──────────────────────────────────────────────
function AddFoodSheet({ onAdd, onClose, foodDb }: {
  onAdd: (f: Food) => void
  onClose: () => void
  foodDb: Food[]
}) {
  const [mode, setMode]     = useState<'db' | 'manual'>(foodDb.length > 0 ? 'db' : 'manual')
  const [search, setSearch] = useState('')
  const [form, setForm]     = useState({
    name: '', calories: '', protein: '', fat: '', carbs: '', sugar: '',
  })
  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const applyDbItem = (food: Food) => {
    setForm({
      name:     food.name,
      calories: String(food.calories),
      protein:  String(food.protein),
      fat:      String(food.fat),
      carbs:    String(food.carbs),
      sugar:    String(food.sugar),
    })
    setMode('manual')
  }

  const handleAdd = () => {
    if (!form.name.trim() || !form.calories) return
    onAdd({
      id:       Date.now(),
      name:     form.name.trim(),
      calories: parseInt(form.calories) || 0,
      protein:  parseInt(form.protein)  || 0,
      fat:      parseInt(form.fat)      || 0,
      carbs:    parseInt(form.carbs)    || 0,
      sugar:    parseInt(form.sugar)    || 0,
    })
  }

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

  const valid    = form.name.trim() && form.calories
  const filtered = foodDb.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: 20, padding: '20px 20px 24px', zIndex: 1,
        width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>新增食物</div>
          <button onClick={onClose} style={{
            background: C.border, border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.textSec, fontSize: 16, lineHeight: 1,
          }}>×</button>
        </div>

        {foodDb.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: C.surface, borderRadius: 10, padding: 4 }}>
            {(['db', 'manual'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === m ? C.orange : 'transparent',
                color: mode === m ? '#fff' : C.textSec,
                fontSize: 12, fontWeight: 700, transition: 'background 0.15s',
              }}>{m === 'db' ? '從食物庫選取' : '手動輸入'}</button>
            ))}
          </div>
        )}

        {mode === 'db' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '8px 12px', marginBottom: 10,
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="6" cy="6" r="5" stroke={C.textSec} strokeWidth="1.5"/>
                <path d="M10 10l3 3" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="搜尋食物庫…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: C.text, fontSize: 13,
                }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', fontSize: 13, color: C.textTer }}>找不到符合的食物</div>
              ) : filtered.map(food => (
                <button key={food.id} onClick={() => applyDbItem(food)} style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left' as const,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{food.name}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' as const }}>
                    <span style={{ color: C.orange, fontWeight: 800 }}>{food.calories} kcal</span>
                    <span style={{ color: MACRO_COLORS.protein }}>蛋白 {food.protein}g</span>
                    <span style={{ color: MACRO_COLORS.fat }}>脂肪 {food.fat}g</span>
                    <span style={{ color: MACRO_COLORS.carbs }}>碳水 {food.carbs}g</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>食物名稱</label>
              <input
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="例：雞胸肉 200g" autoFocus
                style={{
                  width: '100%', background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {numInp('calories', '熱量 kcal', C.orange)}
              {numInp('protein',  '蛋白質 g',  MACRO_COLORS.protein)}
              {numInp('fat',      '脂肪 g',    MACRO_COLORS.fat)}
              {numInp('carbs',    '碳水 g',    MACRO_COLORS.carbs)}
              {numInp('sugar',    '糖 g',      MACRO_COLORS.sugar)}
            </div>
            <button onClick={handleAdd} disabled={!valid} style={{
              width: '100%', background: valid ? C.orange : C.border,
              color: valid ? '#fff' : C.textSec, border: 'none',
              borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 800,
              cursor: valid ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
            }}>新增食物</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AddMealSheet ──────────────────────────────────────────────
function AddMealSheet({ onAdd, onClose }: {
  onAdd: (m: Meal) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const presets = ['早餐', '上午點心', '午餐', '下午點心', '晚餐', '宵夜']
  const valid = name.trim()

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', zIndex: 1,
      }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 16 }}>新增一餐</div>

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7, marginBottom: 14 }}>
          {presets.map(p => {
            const sel = name === p
            return (
              <button key={p} onClick={() => setName(p)} style={{
                background: sel ? C.orange + '25' : C.surface,
                color: sel ? C.orange : C.textSec,
                border: `1px solid ${sel ? C.orange + '60' : C.border}`,
                borderRadius: 99, padding: '6px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>{p}</button>
            )
          })}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>餐點名稱</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="自訂名稱…"
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
              outline: 'none', boxSizing: 'border-box' as const,
            }}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>時間（選填）</label>
          <input
            value={time} onChange={e => setTime(e.target.value)}
            placeholder="例：12:30"
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14,
              outline: 'none', boxSizing: 'border-box' as const,
            }}
          />
        </div>

        <button
          onClick={() => {
            if (!valid) return
            onAdd({ id: Date.now(), name: name.trim(), time: time.trim() || '—', foods: [] })
          }}
          disabled={!valid}
          style={{
            width: '100%', background: valid ? C.orange : C.border,
            color: valid ? '#fff' : C.textSec, border: 'none',
            borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 800,
            cursor: valid ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
          }}>新增一餐</button>
      </div>
    </div>
  )
}

// ── MealSection ───────────────────────────────────────────────
function MealSection({ meal, onUpdate, onDelete, foodDb }: {
  meal: Meal
  onUpdate: (m: Meal) => void
  onDelete: () => void
  foodDb: Food[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [expanded, setExpanded]   = useState(true)

  const mealCal  = meal.foods.reduce((s, f) => s + f.calories, 0)
  const mealProt = meal.foods.reduce((s, f) => s + f.protein, 0)
  const mealFat  = meal.foods.reduce((s, f) => s + f.fat, 0)
  const mealCarb = meal.foods.reduce((s, f) => s + f.carbs, 0)

  const addFood = (food: Food) => { onUpdate({ ...meal, foods: [...meal.foods, food] }); setShowAdd(false) }
  const delFood = (id: number) => onUpdate({ ...meal, foods: meal.foods.filter(f => f.id !== id) })

  return (
    <div style={{
      margin: '0 16px 10px', background: C.surface, borderRadius: 16,
      border: `1px solid ${isEditing ? C.orange + '50' : C.border}`,
      overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s',
    }}>
      <div onClick={() => setExpanded(p => !p)} style={{
        display: 'flex', alignItems: 'center', padding: '11px 14px', cursor: 'pointer', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{meal.name}</span>
            {meal.time && meal.time !== '—' && (
              <span style={{
                fontSize: 10, color: C.textSec, fontWeight: 500,
                background: C.surfaceHigh, padding: '2px 7px', borderRadius: 99,
                border: `1px solid ${C.border}`,
              }}>{meal.time}</span>
            )}
          </div>
          <div style={{ fontSize: 11, marginTop: 3, display: 'flex', gap: 8, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' as const }}>
            <span style={{ color: C.orange, fontWeight: 800 }}>{mealCal} kcal</span>
            <span style={{ color: MACRO_COLORS.protein }}>蛋白 {mealProt}g</span>
            <span style={{ color: MACRO_COLORS.fat     }}>脂肪 {mealFat}g</span>
            <span style={{ color: MACRO_COLORS.carbs   }}>碳水 {mealCarb}g</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isEditing && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (window.confirm(`刪除「${meal.name}」？`)) onDelete()
              }}
              style={{
                background: C.red + '18', color: C.red,
                border: 'none', borderRadius: 8, padding: '4px 8px',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>刪除</button>
          )}
          <button
            onClick={e => { e.stopPropagation(); setIsEditing(p => !p) }}
            style={{
              background: isEditing ? C.orange : C.surfaceHigh,
              color: isEditing ? '#fff' : C.textSec, border: 'none',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>{isEditing ? '完成' : '編輯'}</button>
          <svg width="10" height="7" viewBox="0 0 10 7" style={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s', flexShrink: 0,
          }}>
            <path d="M1 1l4 4 4-4" stroke={C.textSec} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {meal.foods.length === 0 && (
            <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: C.textTer }}>
              尚未新增食物
            </div>
          )}
          {meal.foods.map(food => (
            <FoodRow key={food.id} food={food} isEditing={isEditing} onDelete={() => delFood(food.id)} />
          ))}
          {isEditing && (
            <button onClick={() => setShowAdd(true)} style={{
              width: '100%', background: 'none', border: 'none',
              borderTop: `1px dashed ${C.border}`,
              padding: '10px', color: C.orange, fontSize: 13,
              fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新增食物
            </button>
          )}
        </div>
      )}

      {showAdd && (
        <AddFoodSheet onAdd={addFood} onClose={() => setShowAdd(false)} foodDb={foodDb} />
      )}
    </div>
  )
}

// ── NutritionTab ──────────────────────────────────────────────
export function NutritionTab({ nutritionDay, onUpdateMeal, onAddMeal, onDeleteMeal, foodDb, goals }: {
  nutritionDay: NutritionDay | undefined
  onUpdateMeal: (id: number, updated: Meal) => void
  onAddMeal: (meal: Meal) => void
  onDeleteMeal: (id: number) => void
  foodDb: Food[]
  goals: Goals
}) {
  const [showAddMeal, setShowAddMeal] = useState(false)
  const meals  = nutritionDay?.meals || []
  const totals = meals.reduce((acc, meal) => {
    meal.foods.forEach(f => {
      acc.calories += f.calories; acc.protein += f.protein
      acc.fat += f.fat; acc.carbs += f.carbs; acc.sugar += f.sugar
    })
    return acc
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, sugar: 0 })

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
      <MacroSummary totals={totals} goals={goals} />

      {meals.map(meal => (
        <MealSection
          key={meal.id} meal={meal}
          onUpdate={updated => onUpdateMeal(meal.id, updated)}
          onDelete={() => onDeleteMeal(meal.id)}
          foodDb={foodDb}
        />
      ))}

      <div style={{ padding: '4px 16px 20px' }}>
        <button onClick={() => setShowAddMeal(true)} style={{
          width: '100%', background: C.orange + '10',
          border: `1.5px dashed ${C.orange}50`, borderRadius: 14, padding: '13px',
          color: C.orange, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 新增一餐
        </button>
      </div>

      {showAddMeal && (
        <AddMealSheet
          onAdd={meal => { onAddMeal(meal); setShowAddMeal(false) }}
          onClose={() => setShowAddMeal(false)}
        />
      )}
    </div>
  )
}
