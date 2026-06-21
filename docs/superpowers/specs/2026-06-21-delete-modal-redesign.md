# Delete Modal 重設計規格

**日期：** 2026-06-21  
**狀態：** 待實作

## 問題

專案中所有刪除確認與覆蓋確認共 6 處全部使用 `window.confirm()`，無法套用任何 UI 樣式，與 app 整體設計風格不符。

## 目標

以統一的 `ConfirmDialog` 元件取代所有 `window.confirm()` 呼叫，並依場景使用兩種 variant。

## 設計決策

- **樣式**：置中對話框 + 灰色遮罩，帶輕微縮放 + 淡入動畫
- **底層**：`radix-ui` 的 `AlertDialog`（已在 deps，語意正確，內建 focus trap 與鍵盤支援）
- **刪除按鈕**：實心深紅底（`#D32F2F`），白色文字
- **取消按鈕**：透明底 + 邊框，放在確認按鈕下方

## 新元件：`components/ui/confirm-dialog.tsx`

### Props

| Prop | Type | 預設值 | 說明 |
|------|------|--------|------|
| `open` | `boolean` | — | 控制顯示 |
| `onOpenChange` | `(open: boolean) => void` | — | 關閉回調（點遮罩/ESC） |
| `title` | `string` | — | 標題，例如「刪除「胸背日」？」 |
| `description` | `ReactNode?` | — | 說明文字，可傳 JSX 做顏色強調 |
| `confirmLabel` | `string?` | `"刪除"` | 確認按鈕文字 |
| `onConfirm` | `() => void` | — | 點確認後執行 |
| `variant` | `"destructive" \| "warning"` | `"destructive"` | 圖示與按鈕配色 |

### Variant 規格

**destructive**
- 圖示：`Trash2`（lucide-react），`#D32F2F`，淺紅圓形背景 `#D32F2F10`
- 確認按鈕：`background: #D32F2F`，白字

**warning**
- 圖示：`TriangleAlert`（lucide-react），`#FF4500`，淺橘圓形背景 `#FF450012`
- 確認按鈕：`background: #FF4500`，白字

### 視覺規格

```
Dialog 容器：
  border-radius: 16px
  padding: 28px 24px
  max-width: 320px
  box-shadow: 0 8px 40px rgba(0,0,0,0.2)

圖示容器：
  width/height: 52px, border-radius: 50%
  margin: 0 auto 14px

Title：
  font-size: 16px, font-weight: 800, color: #121212
  margin-bottom: 8px, text-align: center

Description：
  font-size: 12px, color: #888, line-height: 1.6, text-align: center

確認按鈕：
  width: 100%, padding: 11px
  border-radius: 10px, border: none
  font-size: 13px, font-weight: 700

取消按鈕：
  width: 100%, padding: 11px
  border-radius: 10px
  border: 1px solid #E0E0E0, background: transparent
  color: #121212, font-size: 13px, font-weight: 600

按鈕排列：flex-direction: column, gap: 8px
```

## 改動範圍（6 個呼叫點）

### 1. `workout-tab.tsx:512`
- 觸發：刪除訓練課表列的「刪除」按鈕
- title：`刪除「${session.name}」？`
- description：`此操作無法復原。`
- variant：`destructive`
- confirmLabel：`刪除`

### 2. `nutrition-tab.tsx:720`
- 觸發：餐點卡片編輯模式下的「刪除」按鈕
- title：`刪除「${meal.name}」？`
- description：`此操作無法復原。`
- variant：`destructive`
- confirmLabel：`刪除`

### 3. `food-db-tab.tsx:337`
- 觸發：食物卡片的刪除按鈕
- title：`刪除「${food.name}」？`
- description：`此操作無法復原。`
- variant：`destructive`
- confirmLabel：`刪除`

### 4. `category-manager-modal.tsx:96`
- 觸發：分類列的「刪除」按鈕（此處已在 Modal 內，需嵌套 AlertDialog）
- title：`刪除「${cat.name}」？`
- description：`此操作無法復原。該分類的食物將變為未分類。`（「食物將變未分類」以紅色 `#D32F2F` 強調）
- variant：`destructive`
- confirmLabel：`刪除`

### 5. `template-manager.tsx:598`
- 觸發：模版選單中的「刪除」選項
- title：`刪除「${t.name}」？`
- description：`此操作無法復原。`
- variant：`destructive`
- confirmLabel：`刪除`

### 6. `fitness-app.tsx:249`
- 觸發：套用模版時偵測到已有餐點記錄
- title：`覆蓋現有餐點記錄？`
- description：`此日期已有餐點記錄，套用模版將會覆蓋現有內容。`
- variant：`warning`
- confirmLabel：`確認覆蓋`

## 狀態管理模式

每個呼叫點各自用本地 `useState` 管理 open 狀態，pattern 如下：

```tsx
const [deleteOpen, setDeleteOpen] = useState(false)

// 觸發
<button onClick={e => { e.stopPropagation(); setDeleteOpen(true) }}>刪除</button>

// Dialog
<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title={`刪除「${name}」？`}
  description="此操作無法復原。"
  onConfirm={() => { onDelete(); setDeleteOpen(false) }}
/>
```

## 不在範圍內

- `template-manager.tsx` 的餐點食物行內刪除（`handleDeleteFood`）是即時刪除，不需確認
- 任何新增/編輯流程的 Modal
