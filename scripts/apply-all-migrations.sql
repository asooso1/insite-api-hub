-- ==========================================
-- 통합 마이그레이션 스크립트
-- ==========================================
-- 모든 마이그레이션을 한 번에 적용합니다.
-- 각 마이그레이션은 IF NOT EXISTS를 사용하여 중복 실행해도 안전합니다.
--
-- 실행 방법:
-- psql postgresql://apihub:apihub_password@localhost:7000/apihub -f scripts/apply-all-migrations.sql
--
-- 또는:
-- bash scripts/run-migrations.sh
-- ==========================================

\echo '=========================================='
\echo '마이그레이션 시작'
\echo '=========================================='

-- ==========================================
-- 1. Mock 설정 테이블 (Sprint 11)
-- ==========================================
\echo '[1/6] Mock 설정 테이블 확인...'

CREATE TABLE IF NOT EXISTS mock_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default',
    enabled BOOLEAN DEFAULT TRUE,
    status_code INTEGER DEFAULT 200,
    response_template JSONB,
    use_dynamic_generation BOOLEAN DEFAULT TRUE,
    delay_ms INTEGER DEFAULT 0,
    delay_random_min INTEGER DEFAULT 0,
    delay_random_max INTEGER DEFAULT 0,
    use_random_delay BOOLEAN DEFAULT FALSE,
    simulate_timeout BOOLEAN DEFAULT FALSE,
    timeout_ms INTEGER DEFAULT 30000,
    simulate_network_error BOOLEAN DEFAULT FALSE,
    network_error_type TEXT DEFAULT 'CONNECTION_REFUSED',
    network_error_probability REAL DEFAULT 0.5,
    scenario_enabled BOOLEAN DEFAULT FALSE,
    scenario_config JSONB,
    sequence_enabled BOOLEAN DEFAULT FALSE,
    sequence_responses JSONB,
    conditional_rules JSONB,
    error_scenarios JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_configs_project_id ON mock_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_mock_configs_endpoint_id ON mock_configs(endpoint_id);

-- ==========================================
-- 2. Notifications 테이블 확장 (Sprint 17)
-- ==========================================
\echo '[2/6] Notifications 테이블 확장...'

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- ==========================================
-- 3. Endpoints 상태 컬럼 (Sprint 17)
-- ==========================================
\echo '[3/6] Endpoints 상태 컬럼 추가...'

ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
CREATE INDEX IF NOT EXISTS idx_endpoints_status ON endpoints(status);
UPDATE endpoints SET status = 'draft' WHERE status IS NULL;

-- ==========================================
-- 4. Notification Settings 이메일 설정 (Sprint 17)
-- ==========================================
\echo '[4/6] Notification Settings 이메일 컬럼 추가...'

ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT FALSE;
UPDATE notification_settings SET email_enabled = FALSE WHERE email_enabled IS NULL;

-- ==========================================
-- 5. Review Requests 테이블 (Sprint 17)
-- ==========================================
\echo '[5/6] Review Requests 테이블 확인...'

CREATE TABLE IF NOT EXISTS review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    title TEXT NOT NULL,
    description TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_review_requests_endpoint ON review_requests(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_requester ON review_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_reviewer ON review_requests(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON review_requests(status);

-- ==========================================
-- 6. Digest Settings 테이블 (Sprint 17)
-- ==========================================
\echo '[6/6] Digest Settings 테이블 확인...'

CREATE TABLE IF NOT EXISTS digest_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    frequency TEXT DEFAULT 'daily',
    send_time TEXT DEFAULT '09:00',
    include_comments BOOLEAN DEFAULT TRUE,
    include_api_changes BOOLEAN DEFAULT TRUE,
    include_test_results BOOLEAN DEFAULT TRUE,
    include_review_requests BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_digest_settings_user_id ON digest_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_settings_enabled ON digest_settings(enabled);

-- ==========================================
-- 7. Endpoint Watchers 테이블 (Sprint 16)
-- ==========================================
\echo '[7/7] Endpoint Watchers 테이블 확인...'

CREATE TABLE IF NOT EXISTS endpoint_watchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_endpoint_watchers_endpoint_id ON endpoint_watchers(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_watchers_user_id ON endpoint_watchers(user_id);

-- ==========================================
-- 완료
-- ==========================================
\echo '=========================================='
\echo '마이그레이션 완료!'
\echo '=========================================='

-- 결과 확인
SELECT
    'endpoints' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'endpoints') as column_count
UNION ALL
SELECT 'notifications', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications')
FROM notifications
UNION ALL
SELECT 'mock_configs', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'mock_configs')
FROM mock_configs
UNION ALL
SELECT 'review_requests', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'review_requests')
FROM review_requests
UNION ALL
SELECT 'digest_settings', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'digest_settings')
FROM digest_settings
UNION ALL
SELECT 'endpoint_watchers', COUNT(*), (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'endpoint_watchers')
FROM endpoint_watchers;
