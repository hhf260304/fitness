'use client'

import type { ReactNode } from 'react'
import { AlertDialog } from 'radix-ui'
import { Trash2, TriangleAlert } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  variant?: 'destructive' | 'warning'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '刪除',
  onConfirm,
  variant = 'destructive',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive'
  const accentColor   = isDestructive ? '#D32F2F' : '#FF4500'
  const iconBg        = isDestructive ? '#D32F2F10' : '#FF450012'

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            animation: 'confirmFadeIn 150ms ease',
          }}
        />
        <AlertDialog.Content
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            background: '#fff',
            borderRadius: 16,
            padding: '28px 24px',
            width: 'min(320px, calc(100vw - 32px))',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            animation: 'confirmDialogIn 150ms ease',
          }}
        >
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              {isDestructive
                ? <Trash2 size={24} color={accentColor} />
                : <TriangleAlert size={24} color={accentColor} />
              }
            </div>

            {/* Title */}
            <AlertDialog.Title style={{
              fontSize: 16, fontWeight: 800, color: '#121212',
              marginBottom: 8, lineHeight: 1.3,
            }}>
              {title}
            </AlertDialog.Title>

            {/* Description */}
            <AlertDialog.Description style={{
              fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0,
              ...(description ? {} : { display: 'none' }),
            }}>
              {description}
            </AlertDialog.Description>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AlertDialog.Action
              onClick={onConfirm}
              style={{
                padding: 11, borderRadius: 10, border: 'none',
                background: accentColor, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                width: '100%',
              }}
            >
              {confirmLabel}
            </AlertDialog.Action>
            <AlertDialog.Cancel
              style={{
                padding: 11, borderRadius: 10,
                border: '1px solid #E0E0E0', background: 'transparent',
                color: '#121212', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', width: '100%',
              }}
            >
              取消
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
