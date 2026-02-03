'use server';

import 'server-only';
import { db } from '@/lib/db';
import { EndpointStatus } from './endpoint-status';

/**
 * Endpoint 타입 정의
 */
export interface Endpoint {
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
    unresolved_question_count?: number;
    pending_review_count?: number;
}

/**
 * 멤버별 엔드포인트 통계
 */
export interface MemberStats {
    user_id: string;
    user_name: string;
    total_endpoints: number;
    draft_count: number;
    review_count: number;
    approved_count: number;
    deprecated_count: number;
}

/**
 * 내가 Owner인 엔드포인트 목록 조회 (프로젝트별 필터링 가능)
 */
export async function getMyOwnedEndpoints(
    userId: string,
    projectId?: string
): Promise<Endpoint[]> {
    try {
        const params = [userId];
        let query = `
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
                e.synced_at,
                (
                    SELECT COUNT(*)
                    FROM api_comments c
                    WHERE c.endpoint_id = e.id
                      AND c.comment_type = 'QUESTION'
                      AND c.is_resolved = false
                ) as unresolved_question_count
            FROM endpoints e
            WHERE e.owner_id = $1
        `;

        if (projectId) {
            params.push(projectId);
            query += ` AND e.project_id = $2`;
        }

        query += ` ORDER BY e.synced_at DESC`;

        const result = await db.query<Endpoint>(query, params);
        return result.rows;
    } catch (error: any) {
        console.error('❌ [team-dashboard] getMyOwnedEndpoints 실패:', error);
        return [];
    }
}

/**
 * 프로젝트 멤버별 엔드포인트 통계 조회
 */
export async function getMemberEndpointStats(
    projectId: string
): Promise<MemberStats[]> {
    try {
        const result = await db.query<MemberStats>(
            `
            SELECT
                e.owner_id as user_id,
                e.owner_name as user_name,
                COUNT(*) as total_endpoints,
                COUNT(*) FILTER (WHERE e.status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE e.status = 'review') as review_count,
                COUNT(*) FILTER (WHERE e.status = 'approved') as approved_count,
                COUNT(*) FILTER (WHERE e.status = 'deprecated') as deprecated_count
            FROM endpoints e
            WHERE e.project_id = $1 AND e.owner_id IS NOT NULL
            GROUP BY e.owner_id, e.owner_name
            ORDER BY total_endpoints DESC
            `,
            [projectId]
        );

        return result.rows.map(row => ({
            ...row,
            total_endpoints: parseInt(String(row.total_endpoints), 10),
            draft_count: parseInt(String(row.draft_count), 10),
            review_count: parseInt(String(row.review_count), 10),
            approved_count: parseInt(String(row.approved_count), 10),
            deprecated_count: parseInt(String(row.deprecated_count), 10)
        }));
    } catch (error: any) {
        console.error('❌ [team-dashboard] getMemberEndpointStats 실패:', error);
        return [];
    }
}

/**
 * 내 담당 API의 상태별 통계 조회
 */
export async function getMyStatusStats(
    userId: string,
    projectId?: string
): Promise<Record<EndpointStatus, number>> {
    try {
        const params = [userId];
        let query = `
            SELECT
                status,
                COUNT(*) as count
            FROM endpoints
            WHERE owner_id = $1
        `;

        if (projectId) {
            params.push(projectId);
            query += ` AND project_id = $2`;
        }

        query += ` GROUP BY status`;

        const result = await db.query<{ status: EndpointStatus; count: string }>(
            query,
            params
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
        console.error('❌ [team-dashboard] getMyStatusStats 실패:', error);
        return {
            draft: 0,
            review: 0,
            approved: 0,
            deprecated: 0
        };
    }
}

/**
 * 필터링된 내 담당 API 목록 조회
 */
export async function getFilteredMyEndpoints(
    userId: string,
    filters: {
        projectId?: string;
        status?: EndpointStatus;
        hasUnresolvedQuestions?: boolean;
        sortBy?: 'recent' | 'name';
    }
): Promise<Endpoint[]> {
    try {
        const params: any[] = [userId];
        let paramIndex = 2;

        let query = `
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
                e.synced_at,
                (
                    SELECT COUNT(*)
                    FROM api_comments c
                    WHERE c.endpoint_id = e.id
                      AND c.comment_type = 'QUESTION'
                      AND c.is_resolved = false
                ) as unresolved_question_count
            FROM endpoints e
            WHERE e.owner_id = $1
        `;

        // 프로젝트 필터
        if (filters.projectId) {
            params.push(filters.projectId);
            query += ` AND e.project_id = $${paramIndex++}`;
        }

        // 상태 필터
        if (filters.status) {
            params.push(filters.status);
            query += ` AND e.status = $${paramIndex++}`;
        }

        // 미해결 질문 필터
        if (filters.hasUnresolvedQuestions) {
            query += `
                AND EXISTS (
                    SELECT 1
                    FROM api_comments c
                    WHERE c.endpoint_id = e.id
                      AND c.comment_type = 'QUESTION'
                      AND c.is_resolved = false
                )
            `;
        }

        // 정렬
        if (filters.sortBy === 'name') {
            query += ` ORDER BY e.path ASC, e.method ASC`;
        } else {
            query += ` ORDER BY e.synced_at DESC`;
        }

        const result = await db.query<Endpoint>(query, params);
        return result.rows;
    } catch (error: any) {
        console.error('❌ [team-dashboard] getFilteredMyEndpoints 실패:', error);
        return [];
    }
}
