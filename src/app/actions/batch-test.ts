"use server";

import { testApi } from "./test-api";
import { saveTestHistory, getTestCases } from "./test-case";
import { BatchTestSummary, BatchTestResult, EnvConfig, ApiEndpoint } from "@/lib/api-types";
import { db } from "@/lib/db";
import { sendDoorayMessage } from "./notification";

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
    const baseUrl = envConfig.baseUrl?.replace(/\/$/, "") || "";
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
            await saveTestHistory(projectId, {
                apiId,
                testCaseId: tc.id,
                env,
                status: result.status,
                responseTime: result.responseTime,
                success: result.success,
                responseBody: JSON.stringify(apiResponse.data)
            });

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

    const summary = {
        total: casesToRun.length,
        successCount,
        failCount: casesToRun.length - successCount,
        results
    };

    // Send notification if failed
    if (summary.failCount > 0) {
        await sendDoorayMessage(projectId,
            `🚨 **배치 테스트 실패 알림**\n\n` +
            `**API:** ${endpoint.summary || endpoint.path}\n` +
            `**환경:** ${env}\n` +
            `**결과:** 성공 ${summary.successCount} / 실패 ${summary.failCount}\n\n` +
            `[API HUB에서 확인하기](http://localhost:3000)`
        );
    }

    return summary;
}
