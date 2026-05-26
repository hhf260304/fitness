-- Goals 改為全域設定，不綁定日期
-- 每個 user 只保留最新一筆，再移除 date 欄位

-- 刪除同一 user 的舊記錄，只留 date 最大的一筆
DELETE FROM goals g1
WHERE EXISTS (
  SELECT 1 FROM goals g2
  WHERE g2.user_id = g1.user_id
    AND g2.date > g1.date
);

-- 移除舊的 unique constraint 和 date 欄位
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_date_unique;
ALTER TABLE goals DROP COLUMN IF EXISTS date;

-- 加上新的 user_id unique constraint
ALTER TABLE goals ADD CONSTRAINT goals_user_id_unique UNIQUE (user_id);
