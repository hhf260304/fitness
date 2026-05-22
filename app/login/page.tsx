'use client'

import { useActionState, useState } from 'react'
import { login, register } from '@/lib/actions/auth'
import { C } from '@/lib/fitness-constants'

type FormState = { error: string } | undefined

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: C.text,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loginState,    loginAction,    loginPending]    = useActionState<FormState, FormData>(login,    undefined)
  const [registerState, registerAction, registerPending] = useActionState<FormState, FormData>(register, undefined)

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100dvh', background: C.surfaceHigh, padding: '0 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>
            Fitness<span style={{ color: C.accent }}>Log</span>
          </div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>健身與飲食紀錄</div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', background: C.surface, borderRadius: 12,
          padding: 4, border: `1px solid ${C.border}`, marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px',
              background: tab === t ? C.surfaceHigh : 'transparent',
              color: tab === t ? C.text : C.textSec,
              border: tab === t ? `1px solid ${C.border}` : '1px solid transparent',
              borderRadius: 9, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t === 'login' ? '登入' : '註冊'}
            </button>
          ))}
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input name="email"    type="email"    placeholder="Email"   required style={inputStyle} />
            <input name="password" type="password" placeholder="密碼"     required style={inputStyle} />
            {loginState?.error && (
              <div style={{
                color: C.red, fontSize: 13, padding: '9px 12px',
                background: C.red + '18', borderRadius: 8,
              }}>
                {loginState.error}
              </div>
            )}
            <button type="submit" disabled={loginPending} style={{
              padding: '13px', background: C.accent, color: '#000',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
              cursor: loginPending ? 'not-allowed' : 'pointer',
              opacity: loginPending ? 0.7 : 1, marginTop: 4,
            }}>
              {loginPending ? '登入中…' : '登入'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form action={registerAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input name="email"           type="email"    placeholder="Email"         required style={inputStyle} />
            <input name="password"        type="password" placeholder="密碼（至少 8 字元）" required style={inputStyle} />
            <input name="confirmPassword" type="password" placeholder="確認密碼"           required style={inputStyle} />
            {registerState?.error && (
              <div style={{
                color: C.red, fontSize: 13, padding: '9px 12px',
                background: C.red + '18', borderRadius: 8,
              }}>
                {registerState.error}
              </div>
            )}
            <button type="submit" disabled={registerPending} style={{
              padding: '13px', background: C.orange, color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
              cursor: registerPending ? 'not-allowed' : 'pointer',
              opacity: registerPending ? 0.7 : 1, marginTop: 4,
            }}>
              {registerPending ? '建立中…' : '建立帳號'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
