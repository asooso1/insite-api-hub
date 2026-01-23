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
    }
): Promise<ActivityLog[]> {
    const { limit = 50, offset = 0, types, userId } = options || {};

    try {
        let query = `
            SELECT
                a.*,
                u.name as user_name,
                u.email as user_email
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.project_id = $1
        `;
        const params: (string | number | string[])[] = [projectId];
        let paramIndex = 2;

        if (types && types.length > 0) {
            query += ` AND a.activity_type = ANY($${paramIndex}::text[])`;
            params.push(types);
            paramIndex++;
        }

        if (userId) {
            query += ` AND a.user_id = $${paramIndex}`;
            params.push(userId);
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
        await db.query(
            `INSERT INTO activity_logs (project_id, user_id, activity_type, title, description, entity_type, entity_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                projectId,
                userId || null,
                activityType,
                title,
                description,
                entityType || null,
                entityId || null,
                metadata ? JSON.stringify(metadata) : null
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
        const res = await db.query(
            `SELECT
                activity_type,
                COUNT(*) as count
             FROM activity_logs
             WHERE project_id = $1
               AND created_at >= NOW() - INTERVAL '${days} days'
             GROUP BY activity_type`,
            [projectId]
        );

        return res.rows.reduce((acc, row) => {
            acc[row.activity_type] = parseInt(row.count, 10);
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
