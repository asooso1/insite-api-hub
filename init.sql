-- ==========================================
-- API Hub Database Schema (init.sql)
-- ==========================================

-- 1. 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    dooray_webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'USER', -- ADMIN, USER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 프로젝트 멤버 테이블
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER', -- OWNER, MEMBER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- 4. API 엔드포인트 테이블
CREATE TABLE IF NOT EXISTS endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    class_name TEXT,
    method_name TEXT,
    summary TEXT,
    request_body_model TEXT,
    response_type TEXT,
    version TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    owner_name TEXT,
    owner_contact TEXT,
    status TEXT DEFAULT 'draft', -- draft | review | approved | deprecated
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_endpoints_project_id ON endpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_owner_id ON endpoints(owner_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_status ON endpoints(status);

-- 5. 데이터 모델(DTO/VO) 테이블
CREATE TABLE IF NOT EXISTS api_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fields JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_models_project_id ON api_models(project_id);
CREATE INDEX IF NOT EXISTS idx_api_models_fields_gin ON api_models USING gin (fields);

-- 6. 서버 환경 설정 테이블
CREATE TABLE IF NOT EXISTS environments (
    id SERIAL PRIMARY KEY,
    env_type TEXT NOT NULL UNIQUE, -- DEV, STG, PRD
    base_url TEXT,
    token TEXT,
    dooray_webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 환경 데이터 삽입
INSERT INTO environments (env_type, base_url) VALUES
('DEV', 'http://localhost:8080'),
('STG', ''),
('PRD', '')
ON CONFLICT (env_type) DO NOTHING;

-- 7. 테스트 케이스 테이블
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    api_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    payload TEXT,
    headers TEXT,
    expected_status INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_api_id ON test_cases(api_id);

-- 8. 테스트 히스토리 테이블
CREATE TABLE IF NOT EXISTS test_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    api_id VARCHAR(255) NOT NULL,
    test_case_id UUID,
    env VARCHAR(50) NOT NULL,
    status INTEGER,
    response_time INTEGER,
    success BOOLEAN,
    response_body TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_test_history_project_id ON test_history(project_id);
CREATE INDEX IF NOT EXISTS idx_test_history_api_id ON test_history(api_id);
CREATE INDEX IF NOT EXISTS idx_test_history_executed_at ON test_history(executed_at DESC);

-- 9. 테스트 시나리오 테이블
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);

-- 10. API 버전 스냅샷 테이블
CREATE TABLE IF NOT EXISTS api_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_tag TEXT NOT NULL,
    description TEXT,
    endpoints_snapshot JSONB NOT NULL,
    models_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_versions_project_id ON api_versions(project_id);

-- 11. API 댓글/질문 테이블
CREATE TABLE IF NOT EXISTS api_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES api_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'COMMENT', -- COMMENT, QUESTION, ANSWER
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_api_comments_project_id ON api_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_api_comments_endpoint_id ON api_comments(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_comments_user_id ON api_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_api_comments_parent_id ON api_comments(parent_id);

-- 12. 웹훅 로그 테이블
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_project_id ON webhook_logs(project_id);

-- 13. Mock 설정 테이블
CREATE TABLE IF NOT EXISTS mock_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default',
    enabled BOOLEAN DEFAULT TRUE,
    -- Response configuration
    status_code INTEGER DEFAULT 200,
    response_template JSONB,
    use_dynamic_generation BOOLEAN DEFAULT TRUE,
    -- Network simulation
    delay_ms INTEGER DEFAULT 0,
    delay_random_min INTEGER DEFAULT 0,
    delay_random_max INTEGER DEFAULT 0,
    use_random_delay BOOLEAN DEFAULT FALSE,
    simulate_timeout BOOLEAN DEFAULT FALSE,
    timeout_ms INTEGER DEFAULT 30000,
    simulate_network_error BOOLEAN DEFAULT FALSE,
    network_error_type TEXT DEFAULT 'CONNECTION_REFUSED',
    network_error_probability REAL DEFAULT 0.5,
    -- Scenario
    scenario_enabled BOOLEAN DEFAULT FALSE,
    scenario_config JSONB,
    sequence_enabled BOOLEAN DEFAULT FALSE,
    sequence_responses JSONB,
    -- Conditional rules
    conditional_rules JSONB,
    -- Error scenarios
    error_scenarios JSONB,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mock_configs_project_id ON mock_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_mock_configs_endpoint_id ON mock_configs(endpoint_id);

-- 14. 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- 15. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- MENTION, COMMENT, REPLY, QUESTION_RESOLVED, API_CHANGE, TEST_FAILED, WEBHOOK_EVENT
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 16. 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL, -- API_ADDED, API_DELETED, API_MODIFIED, MODEL_ADDED, etc.
    target_type TEXT, -- ENDPOINT, MODEL, TEST, SCENARIO, etc.
    target_id TEXT,
    target_name TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 17. 엔드포인트 구독 테이블 (Watch 기능)
CREATE TABLE IF NOT EXISTS endpoint_watchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_endpoint_watchers_endpoint_id ON endpoint_watchers(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_watchers_user_id ON endpoint_watchers(user_id);

-- 프로젝트 테이블에 git_token 및 git_url 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_token TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_url TEXT;

-- 참고: 기본 프로젝트는 필요 시 사용자가 직접 생성합니다.
-- INSERT INTO projects (name, description)
-- VALUES ('Default Project', '자동 생성된 기본 프로젝트입니다.')
-- ON CONFLICT DO NOTHING;
