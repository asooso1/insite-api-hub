-- ==========================================
-- Migration: 알림 설정에 email_enabled 컬럼 추가
-- Date: 2025-02-03
-- ==========================================

-- notification_settings 테이블에 email_enabled 컬럼 추가
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT FALSE;

-- 기존 데이터 업데이트 (기본값: FALSE)
UPDATE notification_settings
SET email_enabled = FALSE
WHERE email_enabled IS NULL;

-- 변경사항 확인
SELECT
    'notification_settings email_enabled column added' as message,
    COUNT(*) as total_rows
FROM notification_settings;
