import 'server-only';
import { db } from './db';

const QUERIES = [
    `CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        git_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
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
        ('STG', 'https://stg-api.example.com'),
        ('PRD', 'https://api.example.com')
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
    `CREATE INDEX IF NOT EXISTS idx_test_history_executed_at ON test_history(executed_at DESC);`
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
        const tablesToUpdate = ['endpoints', 'api_models', 'test_cases', 'test_history'];
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
