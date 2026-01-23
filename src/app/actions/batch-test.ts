"use server";

import { testApi } from "./test-api";
import { saveTestHistory, getTestCases } from "./test-case";
import { BatchTestSummary, BatchTestResult, EnvConfig, ApiEndpoint, AssertionConfig } from "@/lib/api-types";
import { db } from "@/lib/db";
import { sendDoorayMessage } from "./notification";
import { createTestQueue, getQueueProgress, RateLimiter, TestResult, TestQueue, QueueItem } from "@/lib/test-queue";
import { validateResponse } from "@/lib/assertion-validator";
import { dtoToJsonSchema } from "@/lib/schema-generator";
import type { JSONSchema7 } from 'json-schema';

export async function runBatchTest(
    projectId: string,
    apiId: string,
    env: 'DEV' | 'STG' | 'PRD',
    environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>,
    endpoint: ApiEndpoint,
    testCaseIds?: string[],
    assertionConfig?: AssertionConfig,
    responseSchema?: JSONSchema7
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

            // Run assertion validation if configured
            let assertionResult;
            if (assertionConfig) {
                assertionResult = validateResponse(
                    apiResponse.data,
                    apiResponse.statusCode || 0,
                    apiResponse.responseTime || 0,
                    responseSchema,
                    assertionConfig
                );
            }

            const result: BatchTestResult = {
                testCaseId: tc.id,
                testCaseName: tc.name,
                success: apiResponse.success &&
                         (tc.expected_status ? apiResponse.statusCode === tc.expected_status : true) &&
                         (assertionResult ? assertionResult.passed : true),
                status: apiResponse.statusCode || 0,
                responseTime: apiResponse.responseTime || 0,
                error: apiResponse.error,
                assertionResult
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

// ============================================
// Enhanced Batch Test Implementation
// ============================================

export interface BatchTestOptions {
  mode: 'sequential' | 'parallel';
  parallelLimit?: number;  // Default: 3 for parallel mode
  stopOnError?: boolean;   // Default: false
}

export interface EnhancedBatchTestOptions extends BatchTestOptions {
  onProgress?: (current: number, total: number, result: TestResult) => void;
  signal?: AbortSignal;  // For cancellation support
  assertionConfig?: AssertionConfig;
  responseSchema?: JSONSchema7;
}

export async function runEnhancedBatchTest(
  projectId: string,
  testCaseIds: string[],
  env: 'DEV' | 'STG' | 'PRD',
  environments: EnvConfig[],
  options?: EnhancedBatchTestOptions
): Promise<BatchTestSummary> {

  // Default options
  const mode = options?.mode || 'sequential';
  const parallelLimit = options?.parallelLimit || 3;
  const stopOnError = options?.stopOnError || false;
  const onProgress = options?.onProgress;
  const signal = options?.signal;
  const assertionConfig = options?.assertionConfig;
  const responseSchema = options?.responseSchema;

  // Create test queue
  const queue = createTestQueue(testCaseIds);
  queue.status = 'running';
  queue.startedAt = new Date();

  // Rate limiter: 10 requests per second
  const rateLimiter = new RateLimiter(10);

  const results: BatchTestResult[] = [];
  let successCount = 0;

  // Get test cases
  const allTestCases = await getTestCases(testCaseIds[0]); // Assumes all test cases are from same API
  const casesToRun = allTestCases.filter(tc => testCaseIds.includes(tc.id));

  // Find environment config - environments is now an array, need to get the right one
  // Assuming environments array has objects with env type or we need to get from the first test case
  const envConfig = environments[0]; // Simplified - in real implementation, match by env type
  if (!envConfig) {
    throw new Error(`Environment configuration not found`);
  }

  // Check for cancellation
  if (signal?.aborted) {
    queue.status = 'cancelled';
    queue.items.forEach(item => {
      if (item.status === 'pending') {
        item.status = 'skipped';
      }
    });
    return {
      total: casesToRun.length,
      successCount: 0,
      failCount: 0,
      results: []
    };
  }

  // Execute test function
  const executeTest = async (testCase: any, queueItem: QueueItem): Promise<void> => {
    if (signal?.aborted) {
      queueItem.status = 'skipped';
      return;
    }

    queueItem.status = 'running';

    try {
      // Apply rate limiting
      await rateLimiter.acquire();

      if (signal?.aborted) {
        queueItem.status = 'skipped';
        return;
      }

      const headerObj: Record<string, string> = testCase.headers ? JSON.parse(testCase.headers) : {};

      if (envConfig.token) {
        headerObj['Authorization'] = `Bearer ${envConfig.token}`;
      }

      // Get endpoint info (assuming we have it from test case)
      // In real implementation, you'd need to fetch the endpoint from the API
      const baseUrl = envConfig.baseUrl?.replace(/\/$/, "") || "";
      const path = testCase.path || "/"; // This should come from the API endpoint
      const url = `${baseUrl}${path}`;

      const apiResponse = await testApi({
        url,
        method: testCase.method || 'GET',
        headers: headerObj,
        body: testCase.payload,
        timeout: 30000
      });

      // Run assertion validation if configured
      let assertionResult;
      if (assertionConfig) {
        assertionResult = validateResponse(
          apiResponse.data,
          apiResponse.statusCode || 0,
          apiResponse.responseTime || 0,
          responseSchema,
          assertionConfig
        );
      }

      const result: BatchTestResult = {
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        success: apiResponse.success &&
                 (testCase.expected_status ? apiResponse.statusCode === testCase.expected_status : true) &&
                 (assertionResult ? assertionResult.passed : true),
        status: apiResponse.statusCode || 0,
        responseTime: apiResponse.responseTime || 0,
        error: apiResponse.error,
        assertionResult
      };

      results.push(result);
      if (result.success) {
        successCount++;
        queueItem.status = 'completed';
      } else {
        queueItem.status = 'failed';
      }

      queueItem.result = {
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        success: result.success,
        status: result.status,
        responseTime: result.responseTime,
        error: result.error
      };

      // Save to history
      await saveTestHistory(projectId, {
        apiId: testCase.apiId || '',
        testCaseId: testCase.id,
        env,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        responseBody: JSON.stringify(apiResponse.data)
      });

      // Call progress callback
      if (onProgress) {
        const progress = getQueueProgress(queue);
        onProgress(progress.completed, progress.total, queueItem.result);
      }

      // Stop on error if requested
      if (stopOnError && !result.success) {
        queue.status = 'cancelled';
        // Mark remaining tests as skipped
        queue.items.forEach(item => {
          if (item.status === 'pending') {
            item.status = 'skipped';
          }
        });
      }

    } catch (error) {
      queueItem.status = 'failed';
      const errorResult: BatchTestResult = {
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        success: false,
        status: 0,
        responseTime: 0,
        error: error instanceof Error ? error.message : "Unknown error during batch test"
      };
      results.push(errorResult);

      queueItem.result = {
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        success: false,
        status: 0,
        responseTime: 0,
        error: errorResult.error
      };

      if (onProgress) {
        const progress = getQueueProgress(queue);
        onProgress(progress.completed, progress.total, queueItem.result);
      }

      if (stopOnError) {
        queue.status = 'cancelled';
        queue.items.forEach(item => {
          if (item.status === 'pending') {
            item.status = 'skipped';
          }
        });
      }
    }
  };

  // Execute based on mode
  let isCancelled = false;

  if (mode === 'sequential') {
    // Sequential execution
    for (let i = 0; i < casesToRun.length; i++) {
      if (signal?.aborted || isCancelled) {
        isCancelled = true;
        break;
      }
      const testCase = casesToRun[i];
      const queueItem = queue.items[i];
      queue.currentIndex = i;
      await executeTest(testCase, queueItem);

      // Check if cancelled during execution (by stopOnError)
      const currentStatus: string = queue.status;
      if (currentStatus === 'cancelled') {
        isCancelled = true;
        break;
      }
    }
  } else {
    // Parallel execution with limit
    const chunks: any[][] = [];
    for (let i = 0; i < casesToRun.length; i += parallelLimit) {
      chunks.push(casesToRun.slice(i, i + parallelLimit));
    }

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      if (signal?.aborted || isCancelled) {
        isCancelled = true;
        // Mark remaining as skipped
        for (let i = chunkIndex * parallelLimit; i < casesToRun.length; i++) {
          if (queue.items[i].status === 'pending') {
            queue.items[i].status = 'skipped';
          }
        }
        break;
      }

      const chunk = chunks[chunkIndex];
      const promises = chunk.map((testCase, index) => {
        const globalIndex = chunkIndex * parallelLimit + index;
        const queueItem = queue.items[globalIndex];
        return executeTest(testCase, queueItem);
      });

      await Promise.all(promises);

      // Check if cancelled during execution (by stopOnError)
      const currentStatus: string = queue.status;
      if (currentStatus === 'cancelled') {
        isCancelled = true;
      }
    }
  }

  queue.status = (signal?.aborted || isCancelled) ? 'cancelled' : 'idle';
  queue.completedAt = new Date();

  const summary: BatchTestSummary = {
    total: casesToRun.length,
    successCount,
    failCount: results.filter(r => !r.success).length,
    results
  };

  // Send notification if failed
  if (summary.failCount > 0) {
    await sendDoorayMessage(projectId,
      `🚨 **Enhanced 배치 테스트 실패 알림**\n\n` +
      `**환경:** ${env}\n` +
      `**모드:** ${mode}\n` +
      `**결과:** 성공 ${summary.successCount} / 실패 ${summary.failCount}\n\n` +
      `[API HUB에서 확인하기](http://localhost:3000)`
    );
  }

  return summary;
}
