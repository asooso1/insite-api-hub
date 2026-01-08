"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TestCase, TestHistory } from "@/lib/api-types";

// Lazy migration to ensure tables exist
async function ensureTablesExist() {
    const client = await db.getClient();
    try {
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
        // Indexes (Succinct checks to avoid errors if they exist)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_cases_api_id ON test_cases(api_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_history_api_id ON test_history(api_id);`);
    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        client.release();
    }
}


export async function saveTestCase(
    apiId: string,
    name: string,
    payload: string,
    headers: Record<string, string>,
    expectedStatus?: number
) {
    await ensureTablesExist();
    const client = await db.getClient();
    try {
        await client.query(
            `INSERT INTO test_cases (api_id, name, payload, headers, expected_status)
             VALUES ($1, $2, $3, $4, $5)`,
            [apiId, name, payload, JSON.stringify(headers), expectedStatus]
        );
        revalidatePath('/');
        return { success: true, message: "테스트 케이스가 저장되었습니다." };
    } catch (error) {
        console.error("Failed to save test case:", error);
        return { success: false, message: "테스트 케이스 저장 실패" };
    } finally {
        client.release();
    }
}

export async function getTestCases(apiId: string): Promise<TestCase[]> {
    await ensureTablesExist();
    const client = await db.getClient();
    try {
        const result = await client.query(
            `SELECT * FROM test_cases WHERE api_id = $1 ORDER BY created_at DESC`,
            [apiId]
        );
        return result.rows;
    } finally {
        client.release();
    }
}

export async function deleteTestCase(id: string) {
    const client = await db.getClient();
    try {
        await client.query(`DELETE FROM test_cases WHERE id = $1`, [id]);
        revalidatePath('/');
        return { success: true, message: "테스트 케이스가 삭제되었습니다." };
    } catch (error) {
        return { success: false, message: "삭제 실패" };
    } finally {
        client.release();
    }
}

export async function saveTestHistory(
    apiId: string,
    env: string,
    status: number,
    responseTime: number,
    success: boolean,
    testCaseId?: string
) {
    await ensureTablesExist();
    const client = await db.getClient();
    try {
        await client.query(
            `INSERT INTO test_history (api_id, env, status, response_time, success, test_case_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [apiId, env, status, responseTime, success, testCaseId]
        );
        // 히스토리는 revalidatePath 필요 없음 (클라이언트에서 즉시 갱신 가능 or 별도 탭에서 로드)
        return { success: true };
    } catch (error) {
        console.error("Failed to save history:", error);
        return { success: false };
    } finally {
        client.release();
    }
}

export async function getTestHistory(apiId: string, limit: number = 20): Promise<TestHistory[]> {
    await ensureTablesExist();
    const client = await db.getClient();
    try {
        const result = await client.query(
            `SELECT * FROM test_history WHERE api_id = $1 ORDER BY executed_at DESC LIMIT $2`,
            [apiId, limit]
        );
        return result.rows;
    } finally {
        client.release();
    }
}
