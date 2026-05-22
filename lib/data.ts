import type { Session, Food, Goals, NutritionDay } from './types'

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const DAY_BEFORE = new Date(Date.now() - 172800000).toISOString().slice(0, 10)

export const DEFAULT_SESSIONS: Session[] = [
  {
    id: 1, name: '推日訓練', date: TODAY,
    exercises: [
      { id: 11, name: '臥推',     nameEn: 'Bench Press',     muscle: '胸',  sets: 4, weight: 80,  reps: 10, rest: 90  },
      { id: 12, name: '上斜啞鈴', nameEn: 'Incline DB',      muscle: '胸',  sets: 3, weight: 22,  reps: 12, rest: 75  },
      { id: 13, name: '三頭下壓', nameEn: 'Tricep Pushdown', muscle: '三頭', sets: 3, weight: 35, reps: 15, rest: 60  },
    ],
  },
  {
    id: 2, name: '拉日訓練', date: YESTERDAY,
    exercises: [
      { id: 21, name: '硬舉',     nameEn: 'Deadlift',      muscle: '背/腿', sets: 3, weight: 130, reps: 5,  rest: 180 },
      { id: 22, name: '滑輪下拉', nameEn: 'Lat Pulldown',  muscle: '背',    sets: 4, weight: 65,  reps: 10, rest: 75  },
      { id: 23, name: '二頭彎舉', nameEn: 'Bicep Curl',    muscle: '二頭',  sets: 3, weight: 18,  reps: 12, rest: 60  },
    ],
  },
  {
    id: 3, name: '腿日訓練', date: DAY_BEFORE,
    exercises: [
      { id: 31, name: '背蹲舉',   nameEn: 'Back Squat',  muscle: '腿', sets: 4, weight: 110, reps: 8,  rest: 120 },
      { id: 32, name: '腿推',     nameEn: 'Leg Press',   muscle: '腿', sets: 3, weight: 180, reps: 12, rest: 90  },
      { id: 33, name: '坐姿腿彎', nameEn: 'Leg Curl',    muscle: '腿', sets: 3, weight: 50,  reps: 12, rest: 75  },
      { id: 34, name: '站姿提踵', nameEn: 'Calf Raise',  muscle: '腿', sets: 4, weight: 80,  reps: 20, rest: 60  },
    ],
  },
]

export const DEFAULT_FOOD_DB: Food[] = [
  { id: 101, name: '雞胸肉 100g',      calories: 110, protein: 23, fat: 1,  carbs: 0,  sugar: 0  },
  { id: 102, name: '水煮蛋 1 顆',       calories: 78,  protein: 6,  fat: 5,  carbs: 1,  sugar: 0  },
  { id: 103, name: '全脂牛奶 250ml',    calories: 152, protein: 8,  fat: 8,  carbs: 12, sugar: 11 },
  { id: 104, name: '燕麥 50g',          calories: 189, protein: 6,  fat: 3,  carbs: 34, sugar: 1  },
  { id: 105, name: '糙米飯 100g',       calories: 130, protein: 3,  fat: 1,  carbs: 28, sugar: 0  },
  { id: 106, name: '乳清蛋白 1 匙 30g', calories: 120, protein: 25, fat: 1,  carbs: 3,  sugar: 1  },
  { id: 107, name: '鮭魚 100g',         calories: 178, protein: 25, fat: 9,  carbs: 0,  sugar: 0  },
  { id: 108, name: '地瓜 100g',         calories: 86,  protein: 2,  fat: 0,  carbs: 20, sugar: 4  },
  { id: 109, name: '希臘優格 150g',     calories: 100, protein: 17, fat: 0,  carbs: 6,  sugar: 5  },
  { id: 110, name: '香蕉 1 根',         calories: 89,  protein: 1,  fat: 0,  carbs: 23, sugar: 12 },
]

export const DEFAULT_GOALS: Goals = {
  calories: 2800, protein: 180, fat: 80, carbs: 320, sugar: 60,
}

export const DEFAULT_NUTRITION: Record<string, NutritionDay> = {
  [TODAY]: {
    goals: { calories: 2800, protein: 180, fat: 80, carbs: 320, sugar: 60 },
    meals: [
      { id: 1, name: '早餐', time: '07:30', foods: [
        { id: 11, name: '燕麥粥',      calories: 150, protein: 6,  fat: 3,  carbs: 27, sugar: 2  },
        { id: 12, name: '水煮蛋 × 2',  calories: 156, protein: 13, fat: 11, carbs: 1,  sugar: 0  },
        { id: 13, name: '牛奶 250ml',  calories: 122, protein: 8,  fat: 5,  carbs: 12, sugar: 11 },
      ]},
      { id: 2, name: '午餐', time: '12:00', foods: [
        { id: 21, name: '雞胸肉 200g', calories: 220, protein: 46, fat: 3,  carbs: 0,  sugar: 0  },
        { id: 22, name: '糙米飯 180g', calories: 234, protein: 5,  fat: 2,  carbs: 49, sugar: 0  },
        { id: 23, name: '花椰菜 150g', calories: 55,  protein: 4,  fat: 0,  carbs: 11, sugar: 3  },
      ]},
      { id: 3, name: '點心', time: '15:00', foods: [
        { id: 31, name: '乳清蛋白 1 匙', calories: 120, protein: 25, fat: 1, carbs: 3,  sugar: 1  },
        { id: 32, name: '香蕉',          calories: 89,  protein: 1,  fat: 0, carbs: 23, sugar: 12 },
      ]},
      { id: 4, name: '晚餐', time: '18:30', foods: [
        { id: 41, name: '鮭魚 150g', calories: 267, protein: 37, fat: 13, carbs: 0,  sugar: 0  },
        { id: 42, name: '地瓜 150g', calories: 129, protein: 2,  fat: 0,  carbs: 30, sugar: 6  },
        { id: 43, name: '生菜沙拉',  calories: 45,  protein: 2,  fat: 2,  carbs: 5,  sugar: 2  },
      ]},
    ],
  },
  [YESTERDAY]: {
    goals: { calories: 2800, protein: 180, fat: 80, carbs: 320, sugar: 60 },
    meals: [
      { id: 1, name: '早餐', time: '07:00', foods: [
        { id: 11, name: '希臘優格', calories: 130, protein: 17, fat: 0, carbs: 9,  sugar: 7  },
        { id: 12, name: '藍莓',     calories: 57,  protein: 1,  fat: 0, carbs: 14, sugar: 10 },
      ]},
      { id: 2, name: '午餐', time: '12:30', foods: [
        { id: 21, name: '鮪魚沙拉',     calories: 180, protein: 30, fat: 4, carbs: 5,  sugar: 1 },
        { id: 22, name: '全麥吐司 × 2', calories: 160, protein: 7,  fat: 2, carbs: 30, sugar: 3 },
      ]},
      { id: 3, name: '晚餐', time: '19:00', foods: [
        { id: 31, name: '牛排 200g', calories: 340, protein: 48, fat: 16, carbs: 0,  sugar: 0 },
        { id: 32, name: '烤地瓜',    calories: 130, protein: 2,  fat: 0,  carbs: 30, sugar: 6 },
        { id: 33, name: '蒸青花菜',  calories: 34,  protein: 3,  fat: 0,  carbs: 7,  sugar: 2 },
      ]},
    ],
  },
}
