import 'server-only'
import { cache } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const verifySession = cache(async (): Promise<{ userId: number }> => {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return { userId: parseInt(session!.user.id, 10) }
})
