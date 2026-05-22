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
  calories: number
  protein: number
  fat: number
  carbs: number
  sugar: number
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
  sugar: number
}

export type NutritionDay = {
  goals: Goals
  meals: Meal[]
}

export type TabId = 'workout' | 'nutrition' | 'fooddb' | 'settings'
