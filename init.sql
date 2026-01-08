-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    git_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API 엔드포인트 테이블
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
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 데이터 모델(DTO/VO) 테이블
CREATE TABLE IF NOT EXISTS api_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fields JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 서버 환경 설정 테이블
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
('STG', 'https://stg-api.example.com'),
('PRD', 'https://api.example.com')
ON CONFLICT (env_type) DO NOTHING;

-- 테스트 케이스 테이블
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    payload TEXT,
    headers TEXT,
    expected_status INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_test_cases_api_id ON test_cases(api_id);

-- 테스트 히스토리 테이블
CREATE TABLE IF NOT EXISTS test_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_id VARCHAR(255) NOT NULL,
    test_case_id UUID,
    env VARCHAR(50) NOT NULL,
    status INTEGER,
    response_time INTEGER,
    success BOOLEAN,
    response_body TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_test_history_api_id ON test_history(api_id);
CREATE INDEX IF NOT EXISTS idx_test_history_executed_at ON test_history(executed_at DESC);
