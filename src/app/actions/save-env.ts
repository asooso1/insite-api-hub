"use server";

import { db } from "@/lib/db";
import { EnvConfig } from "@/lib/api-types";
import { revalidatePath } from "next/cache";

export async function saveEnvironments(environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>) {
    try {
        for (const [type, config] of Object.entries(environments)) {
            await db.query(`
                INSERT INTO environments (env_type, base_url, token, dooray_webhook_url)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (env_type) DO UPDATE SET
                    base_url = EXCLUDED.base_url,
                    token = EXCLUDED.token,
                    dooray_webhook_url = EXCLUDED.dooray_webhook_url,
                    updated_at = CURRENT_TIMESTAMP
            `, [type, config.baseUrl, config.token, config.doorayWebhookUrl]);
        }

        revalidatePath("/");
        return { success: true, message: "환경 설정이 데이터베이스에 저장되었습니다." };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        return { success: false, message: `저장 실패: ${message}` };
    }
}
