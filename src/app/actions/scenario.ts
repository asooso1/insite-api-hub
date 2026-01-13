'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { TestScenario, ScenarioStep, BatchTestResult, BatchTestSummary } from '@/lib/api-types';
import { testApi } from './test-api';
import { saveTestHistory } from './test-case';

export async function saveScenario(projectId: string, scenario: Partial<TestScenario>) {
    const client = await db.getClient();
    try {
        if (scenario.id) {
            // Update
            await client.query(
                `UPDATE scenarios SET name = $1, description = $2, steps = $3, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $4 AND project_id = $5`,
                [scenario.name, scenario.description, JSON.stringify(scenario.steps), scenario.id, projectId]
            );
        } else {
            // Insert
            await client.query(
                `INSERT INTO scenarios (project_id, name, description, steps) 
                 VALUES ($1, $2, $3, $4)`,
                [projectId, scenario.name, scenario.description, JSON.stringify(scenario.steps)]
            );
        }
        revalidatePath('/');
    } finally {
        client.release();
    }
}

export async function getScenarios(projectId: string): Promise<TestScenario[]> {
    const res = await db.query(
        "SELECT * FROM scenarios WHERE project_id = $1 ORDER BY updated_at DESC",
        [projectId]
    );
    return res.rows.map(row => ({
        ...row,
        steps: typeof row.steps === 'string' ? JSON.parse(row.steps) : row.steps
    }));
}

export async function deleteScenario(id: string) {
    await db.query("DELETE FROM scenarios WHERE id = $1", [id]);
    revalidatePath('/');
}

export async function runScenario(
    projectId: string,
    scenarioId: string,
    env: string,
    environments: any
): Promise<BatchTestSummary> {
    const scenarioRes = await db.query("SELECT * FROM scenarios WHERE id = $1", [scenarioId]);
    if (scenarioRes.rows.length === 0) throw new Error("Scenario not found");

    const scenario: TestScenario = {
        ...scenarioRes.rows[0],
        steps: typeof scenarioRes.rows[0].steps === 'string' ? JSON.parse(scenarioRes.rows[0].steps) : scenarioRes.rows[0].steps
    };

    const results: BatchTestResult[] = [];
    const variables: Record<string, any> = {};

    for (const step of scenario.steps) {
        // Fetch test case details
        const tcRes = await db.query("SELECT * FROM test_cases WHERE id = $1", [step.testCaseId]);
        if (tcRes.rows.length === 0) continue;
        const tc = tcRes.rows[0];

        // Fetch API details
        const apiRes = await db.query("SELECT * FROM endpoints WHERE id = $1", [tc.api_id]);
        if (apiRes.rows.length === 0) continue;
        const api = apiRes.rows[0];

        // Replace variables in payload and headers
        let processedPayload = tc.payload || "";
        Object.entries(variables).forEach(([key, val]) => {
            processedPayload = processedPayload.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
        });

        const headers: Record<string, string> = tc.headers ? JSON.parse(tc.headers) : {};
        if (environments[env]?.token) {
            headers['Authorization'] = `Bearer ${environments[env].token}`;
        }

        const baseUrl = environments[env]?.baseUrl?.replace(/\/$/, "") || "";
        const path = api.path.startsWith("/") ? api.path : `/${api.path}`;

        // Run test
        const responseData = await testApi({
            url: `${baseUrl}${path}`,
            method: api.method as any,
            headers,
            body: processedPayload
        });

        // Extract variables from responseBody if defined
        if (responseData.success && responseData.data && step.variableMappings) {
            Object.entries(step.variableMappings).forEach(([jsonPath, varName]) => {
                if (!jsonPath || !varName) return;
                try {
                    const keys = jsonPath.split('.');
                    let val = responseData.data;
                    for (const key of keys) {
                        if (val && typeof val === 'object') {
                            val = val[key];
                        } else {
                            val = undefined;
                            break;
                        }
                    }
                    if (val !== undefined) {
                        variables[varName] = val;
                    }
                } catch (e) {
                    console.error("Variable extraction failed", e);
                }
            });
        }

        const success = responseData.success && (!tc.expected_status || responseData.statusCode === tc.expected_status);

        results.push({
            testCaseId: step.testCaseId,
            testCaseName: tc.name,
            success: !!success,
            status: responseData.statusCode || 0,
            responseTime: responseData.responseTime || 0,
            error: responseData.error
        });

        // Save history
        await saveTestHistory(projectId, {
            apiId: tc.api_id,
            testCaseId: tc.id,
            env,
            status: responseData.statusCode || 0,
            responseTime: responseData.responseTime || 0,
            success: !!success,
            responseBody: JSON.stringify(responseData.data)
        });
    }

    return {
        total: results.length,
        successCount: results.filter(r => r.success).length,
        failCount: results.filter(r => !r.success).length,
        results
    };
}
