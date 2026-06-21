'use client'

import { useState } from 'react'
import type { FoodCategory } from '@/lib/types'
import { C } from '@/lib/fitness-constants'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function CategoryManagerModal({
  categories,
  onAdd,
  onRename,
  onDelete,
  onClose,
}: {
  categories: FoodCategory[]
  onAdd: (name: string) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [newName, setNewName]     = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName]   = useState('')
  const [deletingCat, setDeletingCat] = useState<{ id: number; name: string } | null>(null)

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewName('')
  }

  const startEdit = (cat: FoodCategory) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const commitEdit = (id: number) => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== categories.find(c => c.id === id)?.name) {
      onRename(id, trimmed)
    }
    setEditingId(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
      <div style={{
        position: 'relative', background: C.surfaceHigh,
        borderRadius: 20, padding: '20px 20px 24px', zIndex: 1,
        width: '100%', maxWidth: 430,
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        {/* 標題列 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>管理分類</div>
          <button onClick={onClose} style={{
            background: C.border, border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.textSec, fontSize: 16,
          }}>×</button>
        </div>

        {/* 分類列表 */}
        <div style={{ marginBottom: 14 }}>
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', color: C.textSec, fontSize: 13, padding: '24px 0' }}>尚未建立任何分類</div>
          )}
          {categories.map(cat => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 0', borderBottom: `1px solid ${C.border}`,
            }}>
              {editingId === cat.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => commitEdit(cat.id)}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                  style={{
                    flex: 1, background: C.surface, border: `1px solid ${C.orange}`,
                    borderRadius: 8, padding: '6px 10px', color: C.text, fontSize: 13,
                    outline: 'none',
                  }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{cat.name}</span>
              )}
              {editingId !== cat.id && (
                <>
                  <button onClick={() => startEdit(cat)} style={{
                    background: 'none', border: 'none', color: C.textSec,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px',
                  }}>改名</button>
                  <button onClick={() => {
                    setDeletingCat({ id: cat.id, name: cat.name })
                  }} style={{
                    background: 'none', border: 'none', color: C.red,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px',
                  }}>刪除</button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 新增分類 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            placeholder="新分類名稱…"
            style={{
              flex: 1, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '9px 12px', color: C.text, fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            style={{
              background: newName.trim() ? C.orange : C.border,
              color: newName.trim() ? '#fff' : C.textSec,
              border: 'none', borderRadius: 10, padding: '9px 18px',
              fontSize: 13, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'not-allowed',
            }}
          >新增</button>
        </div>
      </div>
    </div>
    <ConfirmDialog
      open={deletingCat !== null}
      onOpenChange={open => { if (!open) setDeletingCat(null) }}
      title={`刪除「${deletingCat?.name}」？`}
      description={
        <>
          此操作無法復原。{' '}
          <span style={{ color: '#D32F2F', fontWeight: 600 }}>
            該分類的食物將變為未分類。
          </span>
        </>
      }
      onConfirm={() => {
        if (deletingCat) onDelete(deletingCat.id)
        setDeletingCat(null)
      }}
    />
  )
}
