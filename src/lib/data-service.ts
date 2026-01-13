import { db } from "./db";
import { MockDB, ApiEndpoint, ApiModel, EnvConfig, ApiTestCase, Project } from "./api-types";

export async function getAppData(projectId?: string): Promise<MockDB> {
    try {
        // 1. Fetch Projects
        const projectsRes = await db.query('SELECT id, name, description, git_url as "gitUrl", created_at as "createdAt" FROM projects ORDER BY created_at DESC');
        const projects = projectsRes.rows as unknown as Project[];

        // If no projectId specifically provided, use the first one available
        const targetProjectId = projectId || (projects.length > 0 ? projects[0].id : null);

        if (!targetProjectId) {
            return {
                projects: projects,
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

        // 2, 3, 4. Fetch data in parallel
        const [endpointsRes, modelsRes, envsRes] = await Promise.all([
            db.query(`
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
                WHERE project_id = $1
                ORDER BY path ASC, synced_at DESC
            `, [targetProjectId]),
            db.query(`
                SELECT id::text, name, jsonb_array_length(fields) as "fieldCount" FROM api_models WHERE project_id = $1 ORDER BY name ASC
            `, [targetProjectId]),
            db.query(`
                SELECT env_type, base_url, token, dooray_webhook_url FROM environments
            `)
        ]);

        // Transform environments
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

        return {
            projects: projects,
            endpoints: endpointsRes.rows as ApiEndpoint[],
            models: modelsRes.rows as ApiModel[],
            environments: environments,
            testCases: []
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
