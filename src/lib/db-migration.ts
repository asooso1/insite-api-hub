import { db } from "./db";

export async function runMigrations() {
    const client = await db.getClient();
    try {
        console.log("Starting DB migrations...");
        await client.query('BEGIN');

        // 1. Create test_cases table
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_cases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                api_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                payload TEXT,
                headers TEXT,
                expected_status INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Create test_history table
        await client.query(`
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
        `);

        // 3. Create indexes for performance
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_cases_api_id ON test_cases(api_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_history_api_id ON test_history(api_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_history_executed_at ON test_history(executed_at DESC);`);

        await client.query('COMMIT');
        console.log("DB migrations completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("DB migrations failed:", e);
        throw e;
    } finally {
        client.release();
    }
}
