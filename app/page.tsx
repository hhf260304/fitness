import { getSessions }                          from '@/lib/actions/sessions'
import { getFoods }                            from '@/lib/actions/food-catalog'
import { getCategories }                       from '@/lib/actions/food-categories'
import { getGoals, getNutritionDay }           from '@/lib/actions/nutrition'
import { getTemplates, applyTemplate }         from '@/lib/actions/meal-templates'
import { FitnessApp }                          from '@/components/fitness/fitness-app'

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

  // 伺服器端套用預設模版（避免 React Strict Mode 在 client 造成競爭重複）
  // Server Component 每 request 恰好執行一次，不會有 double-invocation 問題
  let finalNutritionDay = nutritionDay
  let initialToastMessage: string | null = null

  if (nutritionDay.meals.length === 0) {
    const defaultTemplate = templates.find(t => t.isDefault)
    if (defaultTemplate) {
      try {
        // force=true：覆蓋舊資料，確保冪等性
        const newMeals = await applyTemplate(defaultTemplate.id, TODAY, true)
        finalNutritionDay = { ...nutritionDay, meals: newMeals }
        initialToastMessage = `已套用預設模版「${defaultTemplate.name}」`
      } catch {
        // 其他錯誤：維持空白天
      }
    }
  }

  return (
    <FitnessApp
      initialSessions={sessions}
      initialFoodDb={foodDb}
      initialCategories={categories}
      initialGoals={goals}
      initialNutritionDay={finalNutritionDay}
      initialTemplates={templates}
      initialToastMessage={initialToastMessage}
    />
  )
}
