import { getSessions }                from '@/lib/actions/sessions'
import { getFoods }                  from '@/lib/actions/food-catalog'
import { getCategories }             from '@/lib/actions/food-categories'
import { getGoals, getNutritionDay } from '@/lib/actions/nutrition'
import { FitnessApp }                from '@/components/fitness/fitness-app'

export const dynamic = 'force-dynamic'

const TODAY = new Date().toISOString().slice(0, 10)

export default async function Page() {
  const [sessions, foodDb, categories, goals, nutritionDay] = await Promise.all([
    getSessions(),
    getFoods(),
    getCategories(),
    getGoals(),
    getNutritionDay(TODAY),
  ])

  return (
    <FitnessApp
      initialSessions={sessions}
      initialFoodDb={foodDb}
      initialCategories={categories}
      initialGoals={goals}
      initialNutritionDay={nutritionDay}
    />
  )
}
