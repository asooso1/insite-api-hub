const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
dotenv.config();

const QUERIES = [
    `CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        dooray_webhook_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS team_projects (
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        PRIMARY KEY (team_id, project_id)
    );`,
    `CREATE TABLE IF NOT EXISTS repositories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        git_url TEXT NOT NULL,
        description TEXT,
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
    `CREATE TABLE IF NOT EXISTS scenarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        steps JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS api_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        version_tag TEXT NOT NULL,
        description TEXT,
        endpoints_snapshot JSONB NOT NULL,
        models_snapshot JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'MEMBER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
    );`,
    `CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);`,
    `CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);`,
    `CREATE INDEX IF NOT EXISTS idx_endpoints_project_id ON endpoints(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_api_models_project_id ON api_models(project_id);`,
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

async function run() {
    console.log("🐘 [Migration] Connecting to database...");

    // Support either DATABASE_URL or individual params
    const connectionString = process.env.DATABASE_URL;
    const client = new Client({
        connectionString,
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log("✅ [Migration] Connected. Starting transaction...");

        await client.query("BEGIN");

        for (const query of QUERIES) {
            console.log(`🚀 [Migration] Executing query: ${query.split('\n')[0].trim()}...`);
            await client.query(query);
        }

        // Add missing project_id columns to existing tables if they don't exist
        const tablesWithProjectId = ['endpoints', 'api_models', 'test_cases', 'test_history', 'scenarios', 'api_versions'];
        for (const table of tablesWithProjectId) {
            const checkCol = await client.query(`
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = '${table}' AND column_name = 'project_id'
            `);
            if (checkCol.rows.length === 0) {
                console.log(`🛠️ [Migration] Adding project_id to ${table}...`);
                await client.query(`ALTER TABLE ${table} ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE`);
            }
        }

        // Add indices
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_cases_api_id ON test_cases(api_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_history_project_id ON test_history(project_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_history_api_id ON test_history(api_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_api_versions_project_id ON api_versions(project_id);`);

        // Move git_url data to repositories if it exists in projects
        const checkGitUrl = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'projects' AND column_name = 'git_url'
        `);
        if (checkGitUrl.rows.length > 0) {
            console.log(`🛠️ [Migration] Moving git_url from projects to repositories...`);
            await client.query(`
                INSERT INTO repositories (project_id, name, git_url)
                SELECT id, name || ' Repository', git_url FROM projects WHERE git_url IS NOT NULL
                ON CONFLICT DO NOTHING
            `);
            await client.query(`ALTER TABLE projects DROP COLUMN git_url`);
        }

        await client.query("COMMIT");
        console.log("🎉 [Migration] Database schema is fully up to date!");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("❌ [Migration] Failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
