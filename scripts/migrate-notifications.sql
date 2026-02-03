-- ==========================================
-- notifications 테이블 마이그레이션
-- ==========================================
-- Sprint 17 사전 작업: actor_id, metadata 컬럼 추가
--
-- 실행 방법:
-- psql postgresql://apihub:apihub_password@localhost:7000/apihub -f scripts/migrate-notifications.sql

-- 기존 DB에 컬럼 추가
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
