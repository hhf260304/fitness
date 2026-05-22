# Auth 設計文件：多人帳號登入登出

**日期：** 2026-05-22
**狀態：** 已確認

---

## 目標

為 FitLog 健身紀錄 App 加入帳號系統，讓多位使用者各自登入並只看到自己的資料。

---

## 技術選型

- **Auth.js（NextAuth v5）**，使用 Credentials Provider
- **bcrypt** 作為密碼雜湊
- Session 以加密 JWT cookie 儲存

---

## 整體架構

```
/app
  /login/page.tsx        ← 登入／註冊頁面（不受保護）
  /page.tsx              ← 主頁（受保護）
  /layout.tsx            ← 不變

/auth.ts                 ← Auth.js NextAuth() 設定
/middleware.ts           ← 攔截未登入請求，重導向 /login
/lib/actions/auth.ts     ← register Server Action（signIn/signOut 直接用 Auth.js）
```

**路由保護規則：**
- `middleware.ts` 攔截所有路由；`/login` 加入白名單，其餘一律要求登入
- 未登入者導向 `/login`，登入後導向 `/`

---

## 資料庫 Schema

### 新增 `users` 表

```sql
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT now()
);
```

### 修改現有資料表（加 userId FK）

| 資料表 | 變動 |
|---|---|
| `sessions`（workout）| 加 `user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `meals` | 同上 |
| `goals` | 同上；unique 約束改為 `(date, user_id)` |
| `food_catalog` | 同上；unique 約束改為 `(name, user_id)` |

`exercises`、`meal_foods` 透過父表 cascade，不需直接加 `user_id`。

### 資料遷移

第一個完成註冊的帳號承接所有 `user_id = NULL` 的孤立紀錄。實作於 `register` Server Action 中：

```ts
// 若此為第一位使用者，遷移孤立資料
if (isFirstUser) {
  await db.update(sessions).set({ userId }).where(isNull(sessions.userId))
  await db.update(meals).set({ userId }).where(isNull(meals.userId))
  await db.update(goals).set({ userId }).where(isNull(goals.userId))
  await db.update(foodCatalog).set({ userId }).where(isNull(foodCatalog.userId))
}
```

---

## Auth 流程

### 登入頁面

`/login` 同一頁以 tab 切換「登入」和「註冊」。

### 登入

1. 使用者提交 email + 密碼
2. Auth.js Credentials Provider 查 `users` 表，`bcrypt.compare` 驗證
3. 成功 → 回傳 `{ id, email }`，Auth.js 寫 session cookie → 導向 `/`
4. 失敗 → 顯示「帳號或密碼錯誤」

### 註冊

1. 使用者提交 email + 密碼 + 確認密碼
2. 前端驗證密碼一致
3. Server Action 確認 email 不重複
4. `bcrypt.hash(password, 12)` 後寫入 `users`
5. 若為第一位使用者，遷移孤立資料
6. 呼叫 `signIn('credentials', ...)` 自動登入 → 導向 `/`

### 登出

Header 或設定頁加入「登出」按鈕，呼叫 Server Action 執行 `signOut()`，清除 session cookie，導向 `/login`。

---

## 資料隔離

所有現有 Server Actions 需修改，從 session 取 `userId` 後加入 where 條件：

```ts
// 修改前
export async function getSessions() {
  return db.select().from(sessions).orderBy(desc(sessions.date))
}

// 修改後
export async function getSessions() {
  const session = await auth()
  const userId = session!.user.id
  return db.select().from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.date))
}
```

受影響的 actions：
- `lib/actions/sessions.ts`（所有函式）
- `lib/actions/nutrition.ts`（所有函式）
- `lib/actions/food-catalog.ts`（所有函式）

---

## 錯誤處理

| 情境 | 處理方式 |
|---|---|
| email 已被註冊 | 回傳 `"此 email 已被使用"` |
| 帳號或密碼錯誤 | 回傳 `"帳號或密碼錯誤"`（不區分是哪個） |
| 密碼不一致 | 前端即時驗證，不送出請求 |
| Session 過期 | middleware 導向 `/login` |

---

## 不在本次範圍內

- 忘記密碼 / 重設密碼
- Email 驗證
- OAuth 登入
- 帳號管理（改密碼、刪帳號）
