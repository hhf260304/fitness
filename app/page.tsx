import { getSessions }                from '@/lib/actions/sessions'
import { getFoods }                  from '@/lib/actions/food-catalog'
import { getCategories }             from '@/lib/actions/food-categories'
import { getGoals, getNutritionDay } from '@/lib/actions/nutrition'
import { getTemplates }              from '@/lib/actions/meal-templates'
import { FitnessApp }                from '@/components/fitness/fitness-app'

export const dynamic = 'force-dynamic'

// 取本地時區今日日期（toISOString 永遠回傳 UTC，在 JST 早上 9 點前會取到昨天）
const _d = new Date()
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`

export default async function Page() {
  const [sessions, foodDb, categories, goals, nutritionDay, templates] = await Promise.all([
    getSessions(),
    getFoods(),
    getCategories(),
    getGoals(),
    getNutritionDay(TODAY),
    getTemplates(),
  ])

  return (
    <FitnessApp
      initialSessions={sessions}
      initialFoodDb={foodDb}
      initialCategories={categories}
      initialGoals={goals}
      initialNutritionDay={nutritionDay}
      initialTemplates={templates}
    />
  )
}
