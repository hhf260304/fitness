'use client'

import type { TabId } from '@/lib/types'
import { C } from '@/lib/fitness-constants'

function DumbbellIcon({ active }: { active: boolean }) {
  const fill = active ? '#fff' : C.textSec
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <rect x="0"    y="5"   width="3.5" height="6"  rx="1.2" fill={fill}/>
      <rect x="3.5"  y="2.5" width="2.5" height="11" rx="1"   fill={fill}/>
      <rect x="6"    y="7"   width="10"  height="2"  rx="1"   fill={fill}/>
      <rect x="16"   y="2.5" width="2.5" height="11" rx="1"   fill={fill}/>
      <rect x="18.5" y="5"   width="3.5" height="6"  rx="1.2" fill={fill}/>
    </svg>
  )
}

function ForkKnifeIcon({ active }: { active: boolean }) {
  const stroke = active ? '#fff' : C.textSec
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5"  stroke={stroke} strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="5.5"  stroke={stroke} strokeWidth="1.2"/>
      <line x1="10" y1="4.5"  x2="10" y2="2"    stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="18"   x2="10" y2="15.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4.5" y1="10"  x2="2"  y2="10"   stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18"  y1="10"  x2="15.5" y2="10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function FoodDbIcon({ active }: { active: boolean }) {
  const stroke = active ? '#fff' : C.textSec
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
      <ellipse cx="10" cy="4" rx="8" ry="3" stroke={stroke} strokeWidth="1.5"/>
      <path d="M2 4v4c0 1.66 3.58 3 8 3s8-1.34 8-3V4" stroke={stroke} strokeWidth="1.5"/>
      <path d="M2 8v5c0 1.66 3.58 3 8 3s8-1.34 8-3V8" stroke={stroke} strokeWidth="1.5"/>
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  const stroke = active ? '#fff' : C.textSec
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.8" stroke={stroke} strokeWidth="1.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const TABS: { id: TabId; label: string; Icon: React.FC<{ active: boolean }>; color: string }[] = [
  { id: 'workout',   label: '訓練',  Icon: DumbbellIcon,  color: C.accent },
  { id: 'nutrition', label: '飲食',  Icon: ForkKnifeIcon, color: C.orange },
  { id: 'fooddb',    label: '食物庫', Icon: FoodDbIcon,    color: C.orange },
  { id: 'settings',  label: '設定',  Icon: SettingsIcon,  color: C.accent },
]

export function BottomTabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 8, flexShrink: 0,
      borderTop: `1px solid ${C.border}`,
      background: C.surfaceHigh,
      padding: '6px 16px env(safe-area-inset-bottom, 20px)',
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    }}>
      {TABS.map(({ id, label, Icon, color }) => {
        const active = tab === id
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 5, padding: '9px 8px',
            background: active ? color : 'transparent',
            border: 'none', borderRadius: 13, cursor: 'pointer',
            transition: 'background 0.18s',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20 }}>
              <Icon active={active} />
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.3px',
              color: active ? '#fff' : C.textSec,
            }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
