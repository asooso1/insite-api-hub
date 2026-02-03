'use server';

import 'server-only';
import { db } from '@/lib/db';
import { logActivity } from '@/app/actions/activity';

export type EndpointStatus = 'draft' | 'review' | 'approved' | 'deprecated';

interface Endpoint {
    id: string;
    project_id: string;
    path: string;
    method: string;
    class_name: string | null;
    method_name: string | null;
    summary: string | null;
    request_body_model: string | null;
    response_type: string | null;
    version: string | null;
    owner_id: string | null;
    owner_name: string | null;
    owner_contact: string | null;
    status: EndpointStatus;
    synced_at: string;
}

/**
 * 엔드포인트 상태 변경
 */
export async function updateEndpointStatus(
    endpointId: string,
    status: EndpointStatus,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. 상태 업데이트
        const result = await db.query(
            `UPDATE endpoints SET status = $1 WHERE id = $2 RETURNING id, path, method, project_id`,
            [status, endpointId]
        );

        if (result.rowCount === 0) {
            return { success: false, error: '엔드포인트를 찾을 수 없습니다.' };
        }

        const endpoint = result.rows[0];

        // 2. 활동 로그 생성
        await logActivity(
            endpoint.project_id,
            'ENDPOINT_MODIFIED',
            `엔드포인트 상태 변경: ${endpoint.method} ${endpoint.path}`,
            `상태가 '${status}'로 변경되었습니다.`,
            {
                userId,
                entityType: 'ENDPOINT',
                entityId: endpointId,
                metadata: {
                    status,
                    path: endpoint.path,
                    method: endpoint.method
                }
            }
        );

        return { success: true };
    } catch (error: any) {
        console.error('❌ [endpoint-status] updateEndpointStatus 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 상태별 엔드포인트 목록 조회
 */
export async function getEndpointsByStatus(
    projectId: string,
    status: EndpointStatus
): Promise<Endpoint[]> {
    try {
        const result = await db.query<Endpoint>(
            `
            SELECT
                e.id,
                e.project_id,
                e.path,
                e.method,
                e.class_name,
                e.method_name,
                e.summary,
                e.request_body_model,
                e.response_type,
                e.version,
                e.owner_id,
                e.owner_name,
                e.owner_contact,
                e.status,
                e.synced_at
            FROM endpoints e
            WHERE e.project_id = $1 AND e.status = $2
            ORDER BY e.synced_at DESC
            `,
            [projectId, status]
        );

        return result.rows;
    } catch (error: any) {
        console.error('❌ [endpoint-status] getEndpointsByStatus 실패:', error);
        return [];
    }
}

/**
 * 상태 통계 조회
 */
export async function getStatusStats(
    projectId: string
): Promise<Record<EndpointStatus, number>> {
    try {
        const result = await db.query<{ status: EndpointStatus; count: string }>(
            `
            SELECT
                status,
                COUNT(*) as count
            FROM endpoints
            WHERE project_id = $1
            GROUP BY status
            `,
            [projectId]
        );

        const stats: Record<EndpointStatus, number> = {
            draft: 0,
            review: 0,
            approved: 0,
            deprecated: 0
        };

        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count, 10);
        });

        return stats;
    } catch (error: any) {
        console.error('❌ [endpoint-status] getStatusStats 실패:', error);
        return {
            draft: 0,
            review: 0,
            approved: 0,
            deprecated: 0
        };
    }
}

/**
 * 단일 엔드포인트 상태 조회
 */
export async function getEndpointStatus(
    endpointId: string
): Promise<{ status: EndpointStatus } | null> {
    try {
        const result = await db.query<{ status: EndpointStatus }>(
            `SELECT status FROM endpoints WHERE id = $1`,
            [endpointId]
        );

        if (result.rowCount === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error: any) {
        console.error('❌ [endpoint-status] getEndpointStatus 실패:', error);
        return null;
    }
}
