import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string
  }
}

// 用於時序攻擊防護：當使用者不存在時仍執行 bcrypt，避免回應時間差異洩漏帳號資訊
const dummyHash = '$2b$12$invalidhashfortimingprotectiononly.XXXXXXXXXXXXXXXXX'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        // bcrypt 只處理前 72 bytes，超長密碼可能造成 DoS
        if (password.length > 72) return null

        // 正規化 email，避免大小寫或空白造成查詢不一致
        const normalizedEmail = email.toLowerCase().trim()

        const [user] = await db
          .select({ id: users.id, email: users.email, hashedPassword: users.hashedPassword })
          .from(users)
          .where(eq(users.email, normalizedEmail))

        // 使用者不存在時仍執行 dummy bcrypt，防止時序攻擊枚舉有效信箱
        if (!user) {
          await bcrypt.compare(password, dummyHash)
          return null
        }

        const match = await bcrypt.compare(password, user.hashedPassword)
        if (!match) return null

        return { id: String(user.id), email: user.email }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
