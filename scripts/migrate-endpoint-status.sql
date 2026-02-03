-- ==========================================
-- API 엔드포인트 상태 관리 마이그레이션
-- ==========================================

-- 1. endpoints 테이블에 status 컬럼 추가
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- 2. status 컬럼에 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_endpoints_status ON endpoints(status);

-- 3. 기존 데이터에 대해 기본값 설정 (이미 NULL이 아니지만 명시적으로)
UPDATE endpoints SET status = 'draft' WHERE status IS NULL;

-- 4. 상태값 검증을 위한 체크 제약 조건 추가 (선택사항)
-- ALTER TABLE endpoints ADD CONSTRAINT chk_endpoint_status
-- CHECK (status IN ('draft', 'review', 'approved', 'deprecated'));

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: endpoint status column added successfully';
END $$;
