# Light Theme Design

**Date:** 2026-05-22
**Status:** Approved

## Goal

將 FitnessLog APP 從深色系（黑底螢光）改為淺色系（白底橘紅動能風），全面替換色板，保留品牌力量感。

## Selected Direction

**爆發動能風（淺色版）** — 純白底 + 動感橘紅 `#FF4500` accent（訓練/飲食/設定統一），高對比高能量。

## Approach

只更新 `lib/fitness-constants.ts` 中的 `C` 物件、`MUSCLE_COLORS`、`MACRO_COLORS`，再修補 3 個散落的硬編碼 hex，以及 `globals.css`。所有元件透過 `C.*` 引用自動繼承新色，不觸碰元件邏輯。

## New Color Palette

### `C` Object (`lib/fitness-constants.ts`)

| Token      | 舊值（深色）  | 新值（淺色）  | 說明                        |
|------------|-------------|-------------|---------------------------|
| `bg`       | `#080808`   | `#FFFFFF`   | 主背景                      |
| `surface`  | `#131313`   | `#F7F7F7`   | 卡片/清單背景                |
| `surfaceHigh` | `#1C1C1E` | `#EBEBEB`  | 底部導覽列背景               |
| `border`   | `#272727`   | `#E0E0E0`   | 分隔線、卡片邊框              |
| `accent`   | `#C8FF00`   | `#FF4500`   | 訓練/設定 active accent     |
| `orange`   | `#FF8A4C`   | `#FF4500`   | 飲食/食物庫 accent（與 accent 統一）|
| `text`     | `#F0F0F0`   | `#121212`   | 主要文字                     |
| `textSec`  | `#787878`   | `#888888`   | 次要文字                     |
| `textTer`  | `#363636`   | `#D0D0D0`   | 分隔點等極淡元素              |
| `red`      | `#FF453A`   | `#D32F2F`   | 刪除/錯誤狀態                |

### `MUSCLE_COLORS` (`lib/fitness-constants.ts`)

原始色在白底對比嚴重不足（如 `#FFD24D` 對比度 1.59:1），全部加深並保留色相，確保 WCAG AA（4.5:1）。

| 肌群        | 舊值       | 新值       |
|------------|-----------|-----------|
| 胸          | `#4DA8FF` | `#1A6FAA` |
| 背          | `#34D39A` | `#167A54` |
| 腿          | `#FF6B4D` | `#C44022` |
| 肩          | `#C47FFF` | `#7030B8` |
| 二頭 / 三頭  | `#FFD24D` | `#8B6500` |
| 背/腿       | `#FF984D` | `#B84E15` |
| 核心        | `#FF4D8A` | `#B02060` |
| 全身        | `#AAAAAA` | `#505050` |

### `MACRO_COLORS` (`lib/fitness-constants.ts`)

同樣加深，色相不變：

| Token     | 舊值       | 新值       |
|-----------|-----------|-----------|
| `protein` | `#4DA8FF` | `#1A6FAA` |
| `fat`     | `#FF6B4D` | `#C44022` |
| `carbs`   | `#FFD24D` | `#8B6500` |
| `sugar`   | `#FF4D8A` | `#B02060` |

## Hardcoded Values to Patch

| 檔案                                        | 現值       | 新值       |
|--------------------------------------------|-----------|-----------|
| `components/fitness/fitness-app.tsx` 外層容器 | `#050505` | `#F0F0F0` |
| `app/login/page.tsx` 外層容器                | `#050505` | `#F0F0F0` |
| `app/globals.css` `--background`            | `#080808` | `#FFFFFF` |
| `app/globals.css` `--foreground`            | `#F0F0F0` | `#121212` |
| `app/globals.css` `body background`         | `#080808` | `#FFFFFF` |
| `app/globals.css` `body color`              | `#F0F0F0` | `#121212` |

## Active Tab Accessibility

底部導覽列 active 狀態：`#121212`（接近黑）文字/圖示 on `#FF4500` 背景 → 對比度 5.4:1，通過 WCAG AA。不需變更程式碼。

## Files Touched

1. `lib/fitness-constants.ts` — 更新 `C`、`MUSCLE_COLORS`、`MACRO_COLORS`
2. `app/globals.css` — 更新 `--background`、`body background`、`body color`
3. `components/fitness/fitness-app.tsx` — 修補外層容器硬編碼背景色
4. `app/login/page.tsx` — 修補外層容器硬編碼背景色

## Out of Scope

- 深色模式切換功能（此次為固定淺色，無需 toggle）
- 元件邏輯或 layout 調整
- 字體或圓角變更
