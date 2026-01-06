-- organizations: 팀별/조직별 그룹
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- projects: 개발 중인 각 서비스 프로젝트
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- repositories: Git 연동 정보
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    git_url TEXT NOT NULL,
    branch TEXT DEFAULT 'main',
    webhook_secret TEXT,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- api_models: VO/DTO 정보 (재귀 구조 지원)
CREATE TABLE api_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Class Name
    full_name TEXT, -- Full Package Name
    description TEXT,
    fields JSONB, -- [ { name, type, description, is_required, ref_model_id } ]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- apis: 상세 엔드포인트 정보
CREATE TABLE apis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    method TEXT NOT NULL, -- GET, POST, etc
    operation_id TEXT, -- Method Name
    summary TEXT,
    description TEXT,
    request_body_model_id UUID REFERENCES api_models(id),
    response_model_id UUID REFERENCES api_models(id),
    version TEXT DEFAULT '1.0.0',
    owner_info TEXT, -- 담당자 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- environments: 서버 환경별 설정
CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    env_type TEXT NOT NULL, -- 'DEV', 'STG', 'PRD'
    base_url TEXT NOT NULL,
    default_headers JSONB DEFAULT '{}',
    variables JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- api_test_cases: 테스트 케이스 자동 생성 및 관리
CREATE TABLE api_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID REFERENCES apis(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    request_params JSONB,
    request_headers JSONB,
    expected_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- comments: 질문 및 답변 히스토리
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID REFERENCES apis(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id), -- 대댓글 지원
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
