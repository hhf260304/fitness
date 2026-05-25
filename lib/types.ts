export type MuscleGroup = '胸' | '背' | '腿' | '肩' | '二頭' | '三頭' | '背/腿' | '核心' | '全身'

export type Exercise = {
  id: number
  name: string
  nameEn?: string
  muscle: MuscleGroup
  sets: number
  reps: number
  weight: number
  rest: number
}

export type Session = {
  id: number
  name: string
  date: string
  exercises: Exercise[]
}

export type Food = {
  id: number
  name: string
  servingSize?: number   // g 或 ml，食物庫的基準份量（meal food 紀錄不需要）
  catalogFoodId?: number // 來源食物庫 ID（從食物庫新增時設定）
  amountG?: number       // 當時填寫的克數（用於重新計算）
  calories: number
  protein: number
  fat: number
  carbs: number
  categoryId?: number | null
  categoryName?: string | null
}

export type Meal = {
  id: number
  name: string
  time: string
  foods: Food[]
}

export type Goals = {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export type NutritionDay = {
  goals: Goals
  meals: Meal[]
}

export type TabId = 'workout' | 'nutrition' | 'fooddb' | 'settings'

export type FoodCategory = {
  id: number
  name: string
}
