'use server'

import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/auth'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, sessions as workoutSessions, meals, goals, foodCatalog } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'

type FormState = { error: string } | undefined

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: '請填寫所有欄位' }

  try {
    await signIn('credentials', { email, password, redirectTo: '/' })
  } catch (err) {
    if (err instanceof AuthError) return { error: '帳號或密碼錯誤' }
    throw err
  }
}

export async function register(prevState: FormState, formData: FormData): Promise<FormState> {
  const email           = formData.get('email')           as string
  const password        = formData.get('password')        as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !confirmPassword) return { error: '請填寫所有欄位' }
  if (password !== confirmPassword)            return { error: '兩次密碼不一致' }
  if (password.length < 8)                     return { error: '密碼至少需要 8 個字元' }

  const normalizedEmail = email.toLowerCase().trim()

  const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail))
  if (existing) return { error: '此帳號已被使用' }

  const allUsers    = await db.select({ id: users.id }).from(users)
  const isFirstUser = allUsers.length === 0

  const hashedPassword = await bcrypt.hash(password, 12)
  const [newUser] = await db.insert(users).values({ email: normalizedEmail, hashedPassword }).returning()

  if (isFirstUser) {
    await Promise.all([
      db.update(workoutSessions).set({ userId: newUser.id }).where(isNull(workoutSessions.userId)),
      db.update(meals).set({ userId: newUser.id }).where(isNull(meals.userId)),
      db.update(goals).set({ userId: newUser.id }).where(isNull(goals.userId)),
      db.update(foodCatalog).set({ userId: newUser.id }).where(isNull(foodCatalog.userId)),
    ])
  }

  try {
    await signIn('credentials', { email, password, redirectTo: '/' })
  } catch (err) {
    if (err instanceof AuthError) return { error: '帳號建立成功，但自動登入失敗，請手動登入' }
    throw err
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}
