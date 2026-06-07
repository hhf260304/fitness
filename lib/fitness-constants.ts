export const C = {
  bg:          '#FFFFFF',
  surface:     '#F7F7F7',
  surfaceHigh: '#EBEBEB',
  border:      '#E0E0E0',
  accent:      '#FF4500',
  orange:      '#FF4500',
  text:        '#121212',
  textSec:     '#888888',
  textTer:     '#D0D0D0',
  red:         '#D32F2F',
} as const

export const MUSCLE_COLORS: Record<string, string> = {
  '胸':   '#1A6FAA',
  '背':   '#167A54',
  '腿':   '#C44022',
  '肩':   '#7030B8',
  '二頭':  '#8B6500',
  '三頭':  '#8B6500',
  '背/腿': '#B84E15',
  '核心':  '#B02060',
  '全身':  '#505050',
}

export const MACRO_COLORS = {
  protein: '#1A6FAA',
  fat:     '#C44022',
  carbs:   '#8B6500',
}

export const MUSCLES = ['胸', '背', '腿', '肩', '二頭', '三頭', '核心'] as const
