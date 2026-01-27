import 'server-only';
import { db } from './db';

const QUERIES = [
    `CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        dooray_webhook_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='dooray_webhook_url') THEN
            ALTER TABLE projects ADD COLUMN dooray_webhook_url TEXT;
        END IF;
    END
    $$;`,
    `CREATE TABLE IF NOT EXISTS endpoints (
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
    );`,
    `CREATE TABLE IF NOT EXISTS api_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        fields JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS environments (
        id SERIAL PRIMARY KEY,
        env_type TEXT NOT NULL UNIQUE,
        base_url TEXT,
        token TEXT,
        dooray_webhook_url TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `INSERT INTO environments (env_type, base_url) VALUES 
        ('DEV', 'http://localhost:8080'),
        ('STG', ''),
        ('PRD', '')
        ON CONFLICT (env_type) DO NOTHING;`,
    `CREATE TABLE IF NOT EXISTS test_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        api_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        payload TEXT,
        headers TEXT,
        expected_status INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_test_cases_api_id ON test_cases(api_id);`,
    `CREATE TABLE IF NOT EXISTS test_history (
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
    );`,
    `CREATE INDEX IF NOT EXISTS idx_test_history_project_id ON test_history(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_test_history_api_id ON test_history(api_id);`,
    `CREATE INDEX IF NOT EXISTS idx_test_history_executed_at ON test_history(executed_at DESC);`,
    `CREATE TABLE IF NOT EXISTS scenarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        steps JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);`,
    `CREATE TABLE IF NOT EXISTS api_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        version_tag TEXT NOT NULL,
        description TEXT,
        endpoints_snapshot JSONB NOT NULL,
        models_snapshot JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_api_versions_project_id ON api_versions(project_id);`,
    `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'USER', -- ADMIN, USER
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'MEMBER', -- OWNER, MEMBER
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
    );`,
    `CREATE INDEX IF NOT EXISTS idx_endpoints_project_id ON endpoints(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_api_models_project_id ON api_models(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_api_models_fields_gin ON api_models USING gin (fields);`,
    // Owner/Contact information for endpoints
    `DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='endpoints' AND column_name='owner_id') THEN
            ALTER TABLE endpoints ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='endpoints' AND column_name='owner_name') THEN
            ALTER TABLE endpoints ADD COLUMN owner_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='endpoints' AND column_name='owner_contact') THEN
            ALTER TABLE endpoints ADD COLUMN owner_contact TEXT;
        END IF;
    END
    $$;`,
    `CREATE INDEX IF NOT EXISTS idx_endpoints_owner_id ON endpoints(owner_id);`,
    // API Comments/Questions table
    `CREATE TABLE IF NOT EXISTS api_comments (
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
    );`,
    `CREATE INDEX IF NOT EXISTS idx_api_comments_project_id ON api_comments(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_api_comments_endpoint_id ON api_comments(endpoint_id);`,
    `CREATE INDEX IF NOT EXISTS idx_api_comments_user_id ON api_comments(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_api_comments_parent_id ON api_comments(parent_id);`
];

async function ensureDefaultProject(client: any) {
    const res = await client.query("SELECT id FROM projects LIMIT 1");
    if (res.rows.length === 0) {
        console.log("🐘 [Migration] Creating Default Project...");
        const insertRes = await client.query(
            "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING id",
            ["Default Project", "자동 생성된 기본 프로젝트입니다."]
        );
        return insertRes.rows[0].id;
    }
    return res.rows[0].id;
}

export async function runMigrations() {
    console.log("🐘 [Migration] Starting database check...", new Date().toISOString());
    const client = await db.getClient();
    try {
        await client.query("BEGIN");

        // Ensure tables exist first
        for (const query of QUERIES) {
            await client.query(query);
        }

        const defaultProjectId = await ensureDefaultProject(client);

        // Update existing rows that don't have project_id (Migration for forward compatibility)
        const tablesToUpdate = ['endpoints', 'api_models', 'test_cases', 'test_history', 'scenarios', 'api_versions'];
        for (const table of tablesToUpdate) {
            await client.query(
                `UPDATE ${table} SET project_id = $1 WHERE project_id IS NULL`,
                [defaultProjectId]
            );
        }

        await client.query("COMMIT");
        console.log("✅ [Migration] Database schema is up to date.");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("❌ [Migration] Failed:", e);
    } finally {
        client.release();
    }
}
