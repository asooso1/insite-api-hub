"use server";

import { testApi } from "./test-api";
import { saveTestHistory, getTestCases } from "./test-case";
import { BatchTestSummary, BatchTestResult, EnvConfig, ApiEndpoint } from "@/lib/api-types";
import { db } from "@/lib/db";

export async function runBatchTest(
    projectId: string,
    apiId: string,
    env: 'DEV' | 'STG' | 'PRD',
    environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>,
    endpoint: ApiEndpoint,
    testCaseIds?: string[]
): Promise<BatchTestSummary> {

    // 1. Get Test Cases
    let casesToRun = await getTestCases(apiId);

    if (testCaseIds && testCaseIds.length > 0) {
        casesToRun = casesToRun.filter(tc => testCaseIds.includes(tc.id));
    }

    const results: BatchTestResult[] = [];
    let successCount = 0;

    const envConfig = environments[env];
    const baseUrl = envConfig.baseUrl.replace(/\/$/, "");
    const path = endpoint.path.startsWith("/") ? endpoint.path : `/${endpoint.path}`;
    const url = `${baseUrl}${path}`;

    // 2. Run Tests Sequentially
    for (const tc of casesToRun) {
        try {
            const headerObj: Record<string, string> = tc.headers ? JSON.parse(tc.headers) : {};

            if (envConfig.token) {
                headerObj['Authorization'] = `Bearer ${envConfig.token}`;
            }

            const apiResponse = await testApi({
                url,
                method: endpoint.method as any,
                headers: headerObj,
                body: tc.payload,
                timeout: 30000
            });

            const result: BatchTestResult = {
                testCaseId: tc.id,
                testCaseName: tc.name,
                success: apiResponse.success && (tc.expected_status ? apiResponse.statusCode === tc.expected_status : true),
                status: apiResponse.statusCode || 0,
                responseTime: apiResponse.responseTime || 0,
                error: apiResponse.error
            };

            results.push(result);
            if (result.success) successCount++;

            // 3. Save to History
            await saveTestHistory(
                projectId,
                apiId,
                env,
                result.status,
                result.responseTime,
                result.success,
                tc.id
            );

        } catch (error) {
            results.push({
                testCaseId: tc.id,
                testCaseName: tc.name,
                success: false,
                status: 0,
                responseTime: 0,
                error: error instanceof Error ? error.message : "Unknown error during batch test"
            });
        }
    }

    return {
        total: casesToRun.length,
        successCount,
        failCount: casesToRun.length - successCount,
        results
    };
}
