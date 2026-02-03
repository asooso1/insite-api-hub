"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface EndpointWatcher {
    id: string;
    endpoint_id: string;
    user_id: string;
    created_at: string;
    // Joined fields
    user_name?: string;
    user_email?: string;
}

/**
 * 엔드포인트 구독 (Watch 추가)
 */
export async function watchEndpoint(endpointId: string, userId: string) {
    try {
        await db.query(
            `INSERT INTO endpoint_watchers (endpoint_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (endpoint_id, user_id) DO NOTHING`,
            [endpointId, userId]
        );
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to watch endpoint:", error);
        return { success: false, message: "엔드포인트 구독 실패" };
    }
}

/**
 * 엔드포인트 구독 취소 (Watch 제거)
 */
export async function unwatchEndpoint(endpointId: string, userId: string) {
    try {
        await db.query(
            `DELETE FROM endpoint_watchers
             WHERE endpoint_id = $1 AND user_id = $2`,
            [endpointId, userId]
        );
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to unwatch endpoint:", error);
        return { success: false, message: "엔드포인트 구독 취소 실패" };
    }
}

/**
 * 현재 사용자가 특정 엔드포인트를 구독 중인지 확인
 */
export async function isWatching(endpointId: string, userId: string): Promise<boolean> {
    try {
        const res = await db.query(
            `SELECT id FROM endpoint_watchers
             WHERE endpoint_id = $1 AND user_id = $2
             LIMIT 1`,
            [endpointId, userId]
        );
        return res.rows.length > 0;
    } catch (error) {
        console.error("Failed to check watching status:", error);
        return false;
    }
}

/**
 * 특정 엔드포인트를 구독 중인 사용자 목록 가져오기
 */
export async function getWatchers(endpointId: string): Promise<EndpointWatcher[]> {
    try {
        const res = await db.query(
            `SELECT
                w.id,
                w.endpoint_id,
                w.user_id,
                w.created_at,
                u.name as user_name,
                u.email as user_email
             FROM endpoint_watchers w
             LEFT JOIN users u ON w.user_id = u.id
             WHERE w.endpoint_id = $1
             ORDER BY w.created_at ASC`,
            [endpointId]
        );
        return res.rows as EndpointWatcher[];
    } catch (error) {
        console.error("Failed to get watchers:", error);
        return [];
    }
}

/**
 * 특정 사용자가 구독 중인 엔드포인트 목록 가져오기
 */
export async function getWatchedEndpoints(userId: string): Promise<any[]> {
    try {
        const res = await db.query(
            `SELECT
                e.id,
                e.project_id,
                e.path,
                e.method,
                e.summary,
                e.class_name,
                e.method_name,
                e.owner_name,
                w.created_at as watched_at
             FROM endpoint_watchers w
             LEFT JOIN endpoints e ON w.endpoint_id = e.id
             WHERE w.user_id = $1
             ORDER BY w.created_at DESC`,
            [userId]
        );
        return res.rows;
    } catch (error) {
        console.error("Failed to get watched endpoints:", error);
        return [];
    }
}

/**
 * 엔드포인트의 구독자 수 가져오기
 */
export async function getWatcherCount(endpointId: string): Promise<number> {
    try {
        const res = await db.query(
            `SELECT COUNT(*) as count
             FROM endpoint_watchers
             WHERE endpoint_id = $1`,
            [endpointId]
        );
        return parseInt(res.rows[0]?.count || '0', 10);
    } catch (error) {
        console.error("Failed to get watcher count:", error);
        return 0;
    }
}

/**
 * 엔드포인트 구독 토글 (구독 중이면 해제, 아니면 구독)
 */
export async function toggleWatch(endpointId: string, userId: string) {
    try {
        const watching = await isWatching(endpointId, userId);
        if (watching) {
            return await unwatchEndpoint(endpointId, userId);
        } else {
            return await watchEndpoint(endpointId, userId);
        }
    } catch (error) {
        console.error("Failed to toggle watch:", error);
        return { success: false, message: "구독 상태 변경 실패" };
    }
}
