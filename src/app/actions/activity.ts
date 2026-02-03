'use server';

import 'server-only';
import { db } from '@/lib/db';

export type ActivityType =
    | 'COMMENT_CREATED'
    | 'COMMENT_DELETED'
    | 'QUESTION_ASKED'
    | 'QUESTION_RESOLVED'
    | 'ENDPOINT_ADDED'
    | 'ENDPOINT_MODIFIED'
    | 'ENDPOINT_DELETED'
    | 'MODEL_ADDED'
    | 'MODEL_MODIFIED'
    | 'MODEL_DELETED'
    | 'VERSION_CREATED'
    | 'TEST_EXECUTED'
    | 'TEST_FAILED'
    | 'WEBHOOK_RECEIVED'
    | 'USER_JOINED'
    | 'USER_LEFT';

export interface ActivityLog {
    id: string;
    project_id: string;
    user_id: string | null;
    activity_type: ActivityType;
    title: string;
    description: string;
    entity_type?: string;  // 'endpoint' | 'model' | 'comment' | 'version' | 'test'
    entity_id?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    // Joined fields
    user_name?: string;
    user_email?: string;
}

export async function getActivityFeed(
    projectId: string,
    options?: {
        limit?: number;
        offset?: number;
        types?: ActivityType[];
        userId?: string;
        endpointId?: string; // 엔드포인트별 활동 필터링 옵션 추가
    }
): Promise<ActivityLog[]> {
    const { limit = 50, offset = 0, types, userId, endpointId } = options || {};

    try {
        let query = `
            SELECT
                a.id,
                a.project_id,
                a.user_id,
                a.action as activity_type,
                a.target_name as title,
                COALESCE(a.details->>'description', '') as description,
                a.target_type as entity_type,
                a.target_id as entity_id,
                a.details as metadata,
                a.created_at,
                u.name as user_name,
                u.email as user_email
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.project_id = $1
        `;
        const params: (string | number | string[])[] = [projectId];
        let paramIndex = 2;

        if (types && types.length > 0) {
            query += ` AND a.action = ANY($${paramIndex}::text[])`;
            params.push(types);
            paramIndex++;
        }

        if (userId) {
            query += ` AND a.user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        // 엔드포인트 ID로 필터링 (target_id 컬럼 사용)
        if (endpointId) {
            query += ` AND a.target_id = $${paramIndex}`;
            params.push(endpointId);
            paramIndex++;
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const res = await db.query(query, params);
        return res.rows as ActivityLog[];
    } catch (error) {
        console.error("Failed to get activity feed:", error);
        return [];
    }
}

export async function logActivity(
    projectId: string,
    activityType: ActivityType,
    title: string,
    description: string,
    options?: {
        userId?: string;
        entityType?: string;
        entityId?: string;
        metadata?: Record<string, unknown>;
    }
) {
    const { userId, entityType, entityId, metadata } = options || {};

    try {
        // details JSONB에 description과 metadata 병합
        const details = {
            description,
            ...(metadata || {})
        };

        await db.query(
            `INSERT INTO activity_logs (project_id, user_id, action, target_name, target_type, target_id, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                projectId,
                userId || null,
                activityType,
                title,
                entityType || null,
                entityId || null,
                JSON.stringify(details)
            ]
        );
        return { success: true };
    } catch (error) {
        console.error("Failed to log activity:", error);
        return { success: false };
    }
}

export async function getActivityStats(projectId: string, days: number = 7) {
    try {
        // SQL Injection 방지: days 파라미터 검증 및 날짜 계산
        const safeDays = Math.min(Math.max(Math.floor(Number(days) || 7), 1), 365);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - safeDays);

        const res = await db.query(
            `SELECT
                action,
                COUNT(*) as count
             FROM activity_logs
             WHERE project_id = $1
               AND created_at >= $2
             GROUP BY action`,
            [projectId, cutoffDate.toISOString()]
        );

        return res.rows.reduce((acc, row) => {
            acc[row.action] = parseInt(row.count, 10);
            return acc;
        }, {} as Record<ActivityType, number>);
    } catch (error) {
        console.error("Failed to get activity stats:", error);
        return {};
    }
}

export async function getRecentContributors(projectId: string, limit: number = 5): Promise<{ id: string; name: string; email: string; activity_count: number }[]> {
    try {
        const res = await db.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                COUNT(*) as activity_count,
                MAX(a.created_at) as last_activity
             FROM activity_logs a
             JOIN users u ON a.user_id = u.id
             WHERE a.project_id = $1
               AND a.created_at >= NOW() - INTERVAL '7 days'
             GROUP BY u.id, u.name, u.email
             ORDER BY activity_count DESC
             LIMIT $2`,
            [projectId, limit]
        );
        return res.rows.map(r => ({
            id: r.id as string,
            name: r.name as string,
            email: r.email as string,
            activity_count: parseInt(r.activity_count as string, 10)
        }));
    } catch (error) {
        console.error("Failed to get recent contributors:", error);
        return [];
    }
}

/**
 * 특정 엔드포인트의 최근 활동 조회
 */
export async function getEndpointActivity(
    projectId: string,
    endpointId: string,
    limit: number = 20
): Promise<ActivityLog[]> {
    try {
        const query = `
            SELECT
                a.id,
                a.project_id,
                a.user_id,
                a.action as activity_type,
                a.target_name as title,
                COALESCE(a.details->>'description', '') as description,
                a.target_type as entity_type,
                a.target_id as entity_id,
                a.details as metadata,
                a.created_at,
                u.name as user_name,
                u.email as user_email
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.project_id = $1
              AND a.target_id = $2
              AND a.target_type = 'ENDPOINT'
            ORDER BY a.created_at DESC
            LIMIT $3
        `;
        const res = await db.query(query, [projectId, endpointId, limit]);
        return res.rows as ActivityLog[];
    } catch (error) {
        console.error("Failed to get endpoint activity:", error);
        return [];
    }
}

/**
 * 최근 변경된 엔드포인트 목록 조회 (뱃지용)
 * 반환: { endpoint_id, last_modified, change_count }[]
 */
export async function getRecentlyChangedEndpoints(
    projectId: string,
    limit: number = 10
): Promise<{ endpoint_id: string; last_modified: string; change_count: number }[]> {
    try {
        const query = `
            SELECT
                a.target_id as endpoint_id,
                MAX(a.created_at) as last_modified,
                COUNT(*) as change_count
            FROM activity_logs a
            WHERE a.project_id = $1
              AND a.target_type = 'ENDPOINT'
              AND a.target_id IS NOT NULL
            GROUP BY a.target_id
            ORDER BY last_modified DESC
            LIMIT $2
        `;
        const res = await db.query(query, [projectId, limit]);
        return res.rows.map(r => ({
            endpoint_id: r.endpoint_id as string,
            last_modified: r.last_modified as string,
            change_count: parseInt(r.change_count as string, 10)
        }));
    } catch (error) {
        console.error("Failed to get recently changed endpoints:", error);
        return [];
    }
}
