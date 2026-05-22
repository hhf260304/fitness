export const C = {
  bg:          '#080808',
  surface:     '#131313',
  surfaceHigh: '#1C1C1E',
  border:      '#272727',
  accent:      '#C8FF00',
  orange:      '#FF8A4C',
  text:        '#F0F0F0',
  textSec:     '#787878',
  textTer:     '#363636',
  red:         '#FF453A',
} as const

export const MUSCLE_COLORS: Record<string, string> = {
  '胸':  '#4DA8FF',
  '背':  '#34D39A',
  '腿':  '#FF6B4D',
  '肩':  '#C47FFF',
  '二頭': '#FFD24D',
  '三頭': '#FFD24D',
  '背/腿': '#FF984D',
  '核心': '#FF4D8A',
  '全身': '#AAAAAA',
}

export const MACRO_COLORS = {
  protein: '#4DA8FF',
  fat:     '#FF6B4D',
  carbs:   '#FFD24D',
  sugar:   '#FF4D8A',
}

export const MUSCLES = ['胸', '背', '腿', '肩', '二頭', '三頭', '核心', '全身'] as const
