'use client'

import { Calendar, ChevronLeft, ChevronRight, LayoutList } from 'lucide-react'
import { C } from '@/lib/fitness-constants'

// ── 型別 ─────────────────────────────────────────────────────
export type NutritionHeaderProps = {
  selectedDate:      string          // "YYYY-MM-DD"
  calendarOpen:      boolean
  calendarViewMonth: string          // "YYYY-MM"
  activeDates:       string[]        // calendarViewMonth 有紀錄的日期
  onToggleCalendar:  () => void
  onSelectDate:      (date: string) => void
  onChangeMonth:     (year: number, month: number) => void
  onOpenTemplates:   () => void
}

// ── 輔助：產生月曆格子 ────────────────────────────────────────
function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month - 1, 1).getDay() // 0=日
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

// ── 輔助：將 "YYYY-MM-DD" 格式化為 "M月D日 週X" ───────────────
function formatDateLabel(dateStr: string): string {
  const d    = new Date(dateStr + 'T00:00:00')
  const days = ['日','一','二','三','四','五','六']
  return `${d.getMonth() + 1}月${d.getDate()}日 週${days[d.getDay()]}`
}

// ── NutritionHeader ───────────────────────────────────────────
export function NutritionHeader({
  selectedDate,
  calendarOpen,
  calendarViewMonth,
  activeDates,
  onToggleCalendar,
  onSelectDate,
  onChangeMonth,
  onOpenTemplates,
}: NutritionHeaderProps) {
  const today         = new Date().toISOString().slice(0, 10)
  const activeDateSet = new Set(activeDates)

  const [viewYear, viewMonth] = calendarViewMonth.split('-').map(Number)
  const cells = buildCalendarCells(viewYear, viewMonth)

  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth - 2, 1)
    onChangeMonth(d.getFullYear(), d.getMonth() + 1)
  }
  const nextMonth = () => {
    const d = new Date(viewYear, viewMonth, 1)
    onChangeMonth(d.getFullYear(), d.getMonth() + 1)
  }

  // 下個月的第一天 > 今天 → 不可再往前（用 Date 物件避免跨年月份算錯）
  const nextMonthDate  = new Date(viewYear, viewMonth, 1)
  const nextMonthStart = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`
  const isNextDisabled = nextMonthStart > today

  return (
    <>
      {/* ── Header 列 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px', borderBottom: calendarOpen ? 'none' : `1px solid ${C.border}`,
        background: C.bg, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>飲食紀錄</div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 1, fontWeight: 500 }}>
            {formatDateLabel(selectedDate)}
          </div>
        </div>

        {/* 模版 + 日曆 icon 按鈕 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={onOpenTemplates}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 36, boxSizing: 'border-box',
              background: C.orange + '20', border: `1px solid ${C.orange}50`,
              borderRadius: 8, padding: '0 10px', cursor: 'pointer',
            }}
            aria-label="開啟模版管理"
          >
            <LayoutList size={15} color={C.orange} strokeWidth={1.8} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>模版</span>
          </button>
          <button
            type="button"
            onClick={onToggleCalendar}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: calendarOpen ? C.orange + '30' : C.orange + '20',
              border: `1px solid ${calendarOpen ? C.orange + '80' : C.orange + '40'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            aria-label={calendarOpen ? '關閉日曆' : '開啟日曆'}
          >
            <Calendar size={18} color={C.orange} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* ── 月曆展開區 ── */}
      {calendarOpen && (
        <div style={{
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          padding: '10px 16px 14px', flexShrink: 0,
        }}>
          {/* 月份導覽 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              type="button"
              onClick={prevMonth}
              aria-label="上個月"
              style={{
                width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`,
                background: C.surface, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={14} color={C.textSec} strokeWidth={1.8} />
            </button>

            <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
              {viewYear}年{viewMonth}月
            </span>

            <button
              type="button"
              onClick={nextMonth}
              disabled={isNextDisabled}
              aria-label="下個月"
              style={{
                width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`,
                background: C.surface, cursor: isNextDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isNextDisabled ? 0.3 : 1,
              }}
            >
              <ChevronRight size={14} color={C.textSec} strokeWidth={1.8} />
            </button>
          </div>

          {/* 星期標題 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {['日','一','二','三','四','五','六'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: C.textSec, fontWeight: 600, padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />

              const dateStr    = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isSelected = dateStr === selectedDate
              const isToday    = dateStr === today
              const isFuture   = dateStr > today
              const hasRecord  = activeDateSet.has(dateStr)

              return (
                <div
                  key={dateStr}
                  role="button"
                  tabIndex={isFuture ? -1 : 0}
                  onClick={() => { if (!isFuture) onSelectDate(dateStr) }}
                  onKeyDown={e => { if (!isFuture && (e.key === 'Enter' || e.key === ' ')) onSelectDate(dateStr) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '3px 0', cursor: isFuture ? 'not-allowed' : 'pointer', position: 'relative',
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? C.orange : 'transparent',
                    border: (!isSelected && isToday) ? `1.5px solid ${C.orange}` : 'none',
                    fontSize: 12,
                    fontWeight: isSelected || isToday ? 800 : 500,
                    color: isSelected ? '#fff' : isFuture ? C.textTer : C.text,
                  }}>
                    {day}
                  </div>
                  {/* 有紀錄的圓點 */}
                  {hasRecord && !isSelected && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: C.orange, marginTop: 1,
                    }} />
                  )}
                  {/* 選中時也顯示白色圓點 */}
                  {hasRecord && isSelected && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#ffffff99', marginTop: 1,
                    }} />
                  )}
                  {/* 無紀錄的佔位讓高度一致 */}
                  {!hasRecord && (
                    <div style={{ width: 4, height: 4, marginTop: 1 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
