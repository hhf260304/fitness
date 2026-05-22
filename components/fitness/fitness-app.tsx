'use client'

import { useState } from 'react'
import type { TabId, Session, Food, Goals, NutritionDay, Meal } from '@/lib/types'
import { C } from '@/lib/fitness-constants'
import * as sessionActions   from '@/lib/actions/sessions'
import * as nutritionActions from '@/lib/actions/nutrition'
import * as foodActions      from '@/lib/actions/food-catalog'
import { WorkoutTab }   from '@/components/fitness/workout-tab'
import { NutritionTab } from '@/components/fitness/nutrition-tab'
import { FoodDbTab }    from '@/components/fitness/food-db-tab'
import { SettingsTab }  from '@/components/fitness/settings-tab'
import { BottomTabBar } from '@/components/fitness/bottom-tab-bar'

// ── Tab headers（從 page.tsx 搬入，原封不動）─────────────────
function WorkoutHeader({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px 10px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>訓練紀錄</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>共 {count} 份訓練</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.accent + '20', border: `1px solid ${C.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect x="0"  y="4"  width="3" height="5"  rx="1" fill={C.accent}/>
          <rect x="3"  y="2"  width="2" height="9"  rx="1" fill={C.accent}/>
          <rect x="5"  y="6"  width="8" height="2"  rx="1" fill={C.accent}/>
          <rect x="13" y="2"  width="2" height="9"  rx="1" fill={C.accent}/>
          <rect x="15" y="4"  width="3" height="5"  rx="1" fill={C.accent}/>
        </svg>
      </div>
    </div>
  )
}

function NutritionHeader() {
  const d    = new Date()
  const days = ['日','一','二','三','四','五','六']
  const label = `${d.getMonth() + 1}月${d.getDate()}日 週${days[d.getDay()]}`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>飲食紀錄</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.orange + '20', border: `1px solid ${C.orange}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8"  stroke={C.orange} strokeWidth="1.6"/>
          <circle cx="10" cy="10" r="5"  stroke={C.orange} strokeWidth="1.2"/>
          <line x1="10" y1="2"    x2="10" y2="4.5"  stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="10" y1="15.5" x2="10" y2="18"   stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="2"  y1="10"   x2="4.5" y2="10"  stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="15.5" y1="10" x2="18" y2="10"   stroke={C.orange} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

function FoodDbHeader({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px 10px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>食物庫</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>共 {count} 項食物</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.orange + '20', border: `1px solid ${C.orange}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="16" viewBox="0 0 20 18" fill="none">
          <ellipse cx="10" cy="4" rx="8" ry="3" stroke={C.orange} strokeWidth="1.6"/>
          <path d="M2 4v4c0 1.66 3.58 3 8 3s8-1.34 8-3V4" stroke={C.orange} strokeWidth="1.6"/>
          <path d="M2 8v5c0 1.66 3.58 3 8 3s8-1.34 8-3V8" stroke={C.orange} strokeWidth="1.6"/>
        </svg>
      </div>
    </div>
  )
}

function SettingsHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
      background: C.bg, flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>個人設定</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>每日飲食目標</div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.accent + '20', border: `1px solid ${C.accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="2.8" stroke={C.accent} strokeWidth="1.6"/>
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
            stroke={C.accent} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────
type Props = {
  initialSessions:     Session[]
  initialFoodDb:       Food[]
  initialGoals:        Goals
  initialNutritionDay: NutritionDay
}

const TODAY = new Date().toISOString().slice(0, 10)

// ── Main Client Component ─────────────────────────────────────
export function FitnessApp({ initialSessions, initialFoodDb, initialGoals, initialNutritionDay }: Props) {
  const [tab, setTab]           = useState<TabId>('workout')
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [foodDb, setFoodDb]     = useState<Food[]>(initialFoodDb)
  const [userGoals, setUserGoals] = useState<Goals>(initialGoals)
  const [nutritionDay, setNutritionDay] = useState<NutritionDay>(initialNutritionDay)

  // ── Session CRUD ──────────────────────────────────────────
  const updateSession = async (id: number, updated: Session) => {
    const result = await sessionActions.updateSession(id, updated)
    setSessions(prev => prev.map(s => s.id === id ? result : s))
  }
  const deleteSession = async (id: number) => {
    await sessionActions.deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }
  const addSession = async (s: Session) => {
    const created = await sessionActions.createSession(s)
    setSessions(prev => [created, ...prev])
  }

  // ── Food DB CRUD ──────────────────────────────────────────
  const addFoodToDb = async (f: Food) => {
    const created = await foodActions.createFood(f)
    setFoodDb(prev => [...prev, created])
  }
  const editFoodInDb = async (f: Food) => {
    const updated = await foodActions.updateFood(f.id, f)
    setFoodDb(prev => prev.map(x => x.id === f.id ? updated : x))
  }
  const deleteFoodFromDb = async (id: number) => {
    await foodActions.deleteFood(id)
    setFoodDb(prev => prev.filter(x => x.id !== id))
  }

  // ── Nutrition CRUD ────────────────────────────────────────
  const updateMeal = async (id: number, updated: Meal) => {
    const result = await nutritionActions.updateMeal(id, updated)
    setNutritionDay(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === id ? result : m),
    }))
  }
  const addMeal = async (meal: Meal) => {
    const created = await nutritionActions.createMeal(TODAY, meal)
    setNutritionDay(prev => ({
      ...prev,
      meals: [...prev.meals, created],
    }))
  }
  const deleteMeal = async (id: number) => {
    await nutritionActions.deleteMeal(id)
    setNutritionDay(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id),
    }))
  }
  const saveGoals = async (g: Goals) => {
    await nutritionActions.upsertGoals(TODAY, g)
    setUserGoals(g)
    setNutritionDay(prev => ({ ...prev, goals: g }))
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'stretch',
      minHeight: '100dvh', background: '#050505',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: C.bg,
        position: 'relative', overflow: 'hidden',
      }}>
        {tab === 'workout'   && <WorkoutHeader   count={sessions.length} />}
        {tab === 'nutrition' && <NutritionHeader />}
        {tab === 'fooddb'    && <FoodDbHeader    count={foodDb.length} />}
        {tab === 'settings'  && <SettingsHeader />}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'workout' && (
            <WorkoutTab
              sessions={sessions}
              onUpdateSession={updateSession}
              onDeleteSession={deleteSession}
              onAddSession={addSession}
            />
          )}
          {tab === 'nutrition' && (
            <NutritionTab
              nutritionDay={nutritionDay}
              onUpdateMeal={updateMeal}
              onAddMeal={addMeal}
              onDeleteMeal={deleteMeal}
              foodDb={foodDb}
              goals={userGoals}
            />
          )}
          {tab === 'fooddb' && (
            <FoodDbTab
              foodDb={foodDb}
              onAdd={addFoodToDb}
              onEdit={editFoodInDb}
              onDelete={deleteFoodFromDb}
            />
          )}
          {tab === 'settings' && (
            <SettingsTab goals={userGoals} onSave={saveGoals} />
          )}
        </div>

        <BottomTabBar tab={tab} setTab={setTab} />
      </div>
    </div>
  )
}
