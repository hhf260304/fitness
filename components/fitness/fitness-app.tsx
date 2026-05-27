'use client'

import { useState } from 'react'
import type { TabId, Session, Food, Goals, NutritionDay, Meal, FoodCategory } from '@/lib/types'
import { C } from '@/lib/fitness-constants'
import * as sessionActions   from '@/lib/actions/sessions'
import * as nutritionActions from '@/lib/actions/nutrition'
import * as foodActions      from '@/lib/actions/food-catalog'
import * as categoryActions  from '@/lib/actions/food-categories'
import { WorkoutTab }   from '@/components/fitness/workout-tab'
import { NutritionTab } from '@/components/fitness/nutrition-tab'
import { FoodDbTab }    from '@/components/fitness/food-db-tab'
import { SettingsTab }  from '@/components/fitness/settings-tab'
import { BottomTabBar } from '@/components/fitness/bottom-tab-bar'
import { NutritionHeader } from '@/components/fitness/nutrition-header'

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
  initialCategories:   FoodCategory[]
  initialGoals:        Goals
  initialNutritionDay: NutritionDay
}

const TODAY = new Date().toISOString().slice(0, 10)

// ── Main Client Component ─────────────────────────────────────
export function FitnessApp({ initialSessions, initialFoodDb, initialCategories, initialGoals, initialNutritionDay }: Props) {
  const [tab, setTab]           = useState<TabId>('workout')
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [foodDb, setFoodDb]     = useState<Food[]>(initialFoodDb)
  const [categories, setCategories] = useState<FoodCategory[]>(initialCategories)
  const [userGoals, setUserGoals] = useState<Goals>(initialGoals)
  const [nutritionDay, setNutritionDay] = useState<NutritionDay>(initialNutritionDay)
  const [selectedDate,      setSelectedDate]      = useState(TODAY)
  const [calendarOpen,      setCalendarOpen]      = useState(false)
  const [calendarViewMonth, setCalendarViewMonth] = useState(TODAY.slice(0, 7))
  const [activeDatesCache,  setActiveDatesCache]  = useState<Map<string, string[]>>(new Map())
  const [nutritionLoading,  setNutritionLoading]  = useState(false)

  // ── Session CRUD ──────────────────────────────────────────
  const updateSession = async (id: number, updated: Session) => {
    setSessions(prev => prev.map(s => s.id === id ? updated : s))
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
  const reorderSessions = async (ids: number[]) => {
    // 樂觀更新：立即重排 UI
    const map = new Map(sessions.map(s => [s.id, s]))
    setSessions(ids.map(id => map.get(id)).filter((s): s is Session => s !== undefined))
    await sessionActions.reorderSessions(ids)
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
  const addCategory = async (name: string) => {
    const created = await categoryActions.createCategory(name)
    setCategories(prev => [...prev, created])
  }
  const renameCategory = async (id: number, name: string) => {
    const updated = await categoryActions.updateCategory(id, name)
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
  }
  const removeCategory = async (id: number) => {
    await categoryActions.deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setFoodDb(prev => prev.map(f => f.categoryId === id ? { ...f, categoryId: undefined, categoryName: undefined } : f))
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
    const created = await nutritionActions.createMeal(selectedDate, meal)
    setNutritionDay(prev => ({
      ...prev,
      meals: [...prev.meals, created],
    }))
    // 若當月已快取且今日尚未在其中，加入
    const key = selectedDate.slice(0, 7)
    setActiveDatesCache(prev => {
      if (!prev.has(key)) return prev
      const existing = prev.get(key)!
      if (existing.includes(selectedDate)) return prev
      return new Map(prev).set(key, [...existing, selectedDate])
    })
  }
  const deleteMeal = async (id: number) => {
    await nutritionActions.deleteMeal(id)
    setNutritionDay(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id),
    }))
  }
  const reorderMeals = async (ids: number[]) => {
    const map = new Map(nutritionDay.meals.map(m => [m.id, m]))
    setNutritionDay(prev => ({
      ...prev,
      meals: ids.map(id => map.get(id)).filter((m): m is Meal => m !== undefined),
    }))
    await nutritionActions.reorderMeals(ids)
  }
  const saveGoals = async (g: Goals) => {
    await nutritionActions.upsertGoals(g)
    setUserGoals(g)
    setNutritionDay(prev => ({ ...prev, goals: g }))
  }

  const handleOpenCalendar = async () => {
    const key = calendarViewMonth
    setCalendarOpen(true)
    if (!activeDatesCache.has(key)) {
      const [y, m] = key.split('-').map(Number)
      const dates = await nutritionActions.getActiveDates(y, m)
      setActiveDatesCache(prev => new Map(prev).set(key, dates))
    }
  }

  const handleToggleCalendar = () => {
    if (calendarOpen) {
      setCalendarOpen(false)
    } else {
      handleOpenCalendar()
    }
  }

  const handleChangeMonth = async (year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`
    setCalendarViewMonth(key)
    if (!activeDatesCache.has(key)) {
      const dates = await nutritionActions.getActiveDates(year, month)
      setActiveDatesCache(prev => new Map(prev).set(key, dates))
    }
  }

  const handleSelectDate = async (date: string) => {
    setCalendarOpen(false)
    setSelectedDate(date)
    setNutritionLoading(true)
    const day = await nutritionActions.getNutritionDay(date)
    setNutritionDay(day)
    setNutritionLoading(false)
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'stretch',
      minHeight: '100dvh', background: C.surfaceHigh,
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: C.bg,
        position: 'relative', overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        {tab === 'workout'   && <WorkoutHeader   count={sessions.length} />}
        {tab === 'nutrition' && (
          <NutritionHeader
            selectedDate={selectedDate}
            calendarOpen={calendarOpen}
            calendarViewMonth={calendarViewMonth}
            activeDates={activeDatesCache.get(calendarViewMonth) ?? []}
            onToggleCalendar={handleToggleCalendar}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
          />
        )}
        {tab === 'fooddb'    && <FoodDbHeader    count={foodDb.length} />}
        {tab === 'settings'  && <SettingsHeader />}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'workout' && (
            <WorkoutTab
              sessions={sessions}
              onUpdateSession={updateSession}
              onDeleteSession={deleteSession}
              onAddSession={addSession}
              onReorderSessions={reorderSessions}
            />
          )}
          {tab === 'nutrition' && (
            <NutritionTab
              nutritionDay={nutritionDay}
              onUpdateMeal={updateMeal}
              onAddMeal={addMeal}
              onDeleteMeal={deleteMeal}
              onReorderMeals={reorderMeals}
              foodDb={foodDb}
              goals={userGoals}
              loading={nutritionLoading}
            />
          )}
          {tab === 'fooddb' && (
            <FoodDbTab
              foodDb={foodDb}
              categories={categories}
              onAdd={addFoodToDb}
              onEdit={editFoodInDb}
              onDelete={deleteFoodFromDb}
              onAddCategory={addCategory}
              onRenameCategory={renameCategory}
              onDeleteCategory={removeCategory}
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
