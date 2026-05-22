'use client'

import { useState, useEffect } from 'react'
import type { Goals } from '@/lib/types'
import { C } from '@/lib/fitness-constants'
import { logout } from '@/lib/actions/auth'

const SETTINGS_MACRO_COLORS = {
  calories: '#FF8A4C',
  protein:  '#4DA8FF',
  fat:      '#FF6B4D',
  carbs:    '#FFD24D',
  sugar:    '#FF4D8A',
}

// ── GoalRow ───────────────────────────────────────────────────
function GoalRow({ field, label, unit, color, value, onChange }: {
  field: keyof Goals; label: string; unit: string; color: string
  value: number; onChange: (v: number) => void
}) {
  const step = field === 'calories' ? 50 : 5
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
        boxShadow: `0 0 8px ${color}80`,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{label}</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1 }}>{unit}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          style={{
            width: 32, height: 32, background: C.surfaceHigh,
            border: `1px solid ${C.border}`, borderRadius: '8px 0 0 8px',
            color: C.textSec, fontSize: 18, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>−</button>
        <input
          type="number" value={value}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
          style={{
            width: 72, height: 32, background: C.surface,
            border: `1px solid ${C.border}`, borderLeft: 'none', borderRight: 'none',
            color: C.text, fontSize: 14, fontWeight: 800, textAlign: 'center' as const,
            outline: 'none', fontVariantNumeric: 'tabular-nums',
          }}
        />
        <button
          onClick={() => onChange(value + step)}
          style={{
            width: 32, height: 32, background: C.surfaceHigh,
            border: `1px solid ${C.border}`, borderRadius: '0 8px 8px 0',
            color: C.textSec, fontSize: 18, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
      </div>
    </div>
  )
}

// ── MacroRing ─────────────────────────────────────────────────
function MacroRing({ goals }: { goals: Goals }) {
  const protCal = goals.protein * 4
  const fatCal  = goals.fat * 9
  const carbCal = goals.carbs * 4
  const total   = protCal + fatCal + carbCal || 1

  const r = 46, cx = 56, cy = 56, stroke = 14
  const circ = 2 * Math.PI * r

  const segments = [
    { color: SETTINGS_MACRO_COLORS.protein, pct: protCal / total, label: '蛋白質', grams: goals.protein },
    { color: SETTINGS_MACRO_COLORS.fat,     pct: fatCal  / total, label: '脂肪',   grams: goals.fat     },
    { color: SETTINGS_MACRO_COLORS.carbs,   pct: carbCal / total, label: '碳水',   grams: goals.carbs   },
  ]

  let offset = 0
  const arcs = segments.map(s => {
    const dash = s.pct * circ
    const gap  = circ - dash
    const rot  = offset * 360 - 90
    offset += s.pct
    return { ...s, dash, gap, rot }
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20, padding: '16px',
      margin: '12px 16px', background: C.surface, borderRadius: 16,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={112} height={112} viewBox="0 0 112 112">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
          {arcs.map((arc, i) => (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={arc.color} strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeLinecap="butt"
              style={{
                transform: `rotate(${arc.rot}deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                transition: 'stroke-dasharray 0.5s ease',
              }}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle"
            fill={C.orange} fontSize="15" fontWeight="900"
            fontFamily="Space Grotesk, sans-serif">
            {goals.calories.toLocaleString()}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={C.textSec} fontSize="10" fontWeight="500"
            fontFamily="Space Grotesk, sans-serif">
            kcal 目標
          </text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {arcs.map((arc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: arc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.textSec, flex: 1 }}>{arc.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
              {arc.grams}g
            </span>
            <span style={{ fontSize: 10, color: C.textTer, width: 30, textAlign: 'right' as const }}>
              {(arc.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SettingsTab ───────────────────────────────────────────────
export function SettingsTab({ goals, onSave }: {
  goals: Goals
  onSave: (g: Goals) => void
}) {
  const [local, setLocal] = useState<Goals>({ ...goals })
  const [saved, setSaved] = useState(false)

  useEffect(() => { setLocal({ ...goals }) }, [goals])

  const set = (k: keyof Goals, v: number) =>
    setLocal(prev => ({ ...prev, [k]: Math.max(0, v) }))

  const handleSave = () => {
    onSave({ ...local })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const fields: { field: keyof Goals; label: string; unit: string; color: string }[] = [
    { field: 'calories', label: '目標熱量',   unit: '每日 kcal', color: SETTINGS_MACRO_COLORS.calories },
    { field: 'protein',  label: '蛋白質目標', unit: '每日 g',    color: SETTINGS_MACRO_COLORS.protein  },
    { field: 'fat',      label: '脂肪目標',   unit: '每日 g',    color: SETTINGS_MACRO_COLORS.fat      },
    { field: 'carbs',    label: '碳水目標',   unit: '每日 g',    color: SETTINGS_MACRO_COLORS.carbs    },
    { field: 'sugar',    label: '糖目標',     unit: '每日 g',    color: SETTINGS_MACRO_COLORS.sugar    },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '10px 18px 6px', fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
        每日飲食目標
      </div>

      <MacroRing goals={local} />

      <div style={{
        margin: '0 16px 16px', background: C.surface, borderRadius: 16,
        border: `1px solid ${C.border}`, overflow: 'hidden',
      }}>
        {fields.map(({ field, label, unit, color }) => (
          <GoalRow
            key={field} field={field} label={label} unit={unit} color={color}
            value={local[field]}
            onChange={v => set(field, v)}
          />
        ))}
      </div>

      <div style={{ padding: '0 16px 32px' }}>
        <button onClick={handleSave} style={{
          width: '100%',
          background: saved ? '#22c55e' : C.orange,
          color: '#fff', border: 'none',
          borderRadius: 14, padding: '14px',
          fontSize: 15, fontWeight: 800,
          cursor: 'pointer', transition: 'background 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {saved ? '✓ 已儲存' : '儲存設定'}
        </button>
      </div>

      <div style={{ padding: '0 16px 32px' }}>
        <form action={logout}>
          <button type="submit" style={{
            width: '100%',
            background: 'transparent',
            color: C.red,
            border: `1px solid ${C.red}40`,
            borderRadius: 14, padding: '13px',
            fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}>
            登出
          </button>
        </form>
      </div>
    </div>
  )
}
