import { db } from "./db";
import { MockDB, ApiEndpoint, ApiModel, EnvConfig, ApiTestCase } from "./mock-db";

export async function getAppData(): Promise<MockDB> {
    try {
        // 1. Fetch Projects (currently empty in mock)
        const projectsRes = await db.query('SELECT * FROM projects ORDER BY created_at DESC');

        // 2. Fetch Endpoints
        const endpointsRes = await db.query(`
            SELECT 
                id::text, 
                path, 
                method, 
                class_name as "className", 
                method_name as "methodName", 
                summary, 
                request_body_model as "requestBody", 
                response_type as "responseType", 
                synced_at as "syncedAt", 
                version 
            FROM endpoints 
            ORDER BY synced_at DESC
        `);

        // 3. Fetch Models
        const modelsRes = await db.query(`
            SELECT name, fields FROM api_models
        `);

        // 4. Fetch Environments
        const envsRes = await db.query(`
            SELECT env_type, base_url, token, dooray_webhook_url FROM environments
        `);

        // Transform environments to Record<'DEV' | 'STG' | 'PRD', EnvConfig>
        const environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig> = {
            DEV: { baseUrl: "", token: "" },
            STG: { baseUrl: "", token: "" },
            PRD: { baseUrl: "", token: "" }
        };

        envsRes.rows.forEach(row => {
            const type = row.env_type as 'DEV' | 'STG' | 'PRD';
            environments[type] = {
                baseUrl: row.base_url || "",
                token: row.token || "",
                doorayWebhookUrl: row.dooray_webhook_url || ""
            };
        });

        // 5. Fetch Test Cases
        const testCasesRes = await db.query('SELECT * FROM environments'); // Placeholder or actual table

        return {
            projects: projectsRes.rows,
            endpoints: endpointsRes.rows as ApiEndpoint[],
            models: modelsRes.rows as ApiModel[],
            environments: environments,
            testCases: [] // testCases table is optional for now
        };
    } catch (err) {
        console.error("DB Fetch Error:", err);
        // Fallback to empty structure to prevent crash
        return {
            projects: [],
            endpoints: [],
            models: [],
            environments: {
                DEV: { baseUrl: "", token: "" },
                STG: { baseUrl: "", token: "" },
                PRD: { baseUrl: "", token: "" }
            },
            testCases: []
        };
    }
}
