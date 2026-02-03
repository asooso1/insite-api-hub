'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ReviewRequest {
    id: string;
    endpoint_id: string;
    requester_id: string;
    reviewer_id?: string;
    status: ReviewStatus;
    title: string;
    description?: string;
    comment?: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    // Joined fields
    requester_name?: string;
    requester_email?: string;
    reviewer_name?: string;
    reviewer_email?: string;
    endpoint_path?: string;
    endpoint_method?: string;
}

/**
 * 리뷰 요청 생성
 */
export async function createReviewRequest(params: {
    endpointId: string;
    requesterId: string;
    reviewerId?: string;
    title: string;
    description?: string;
}): Promise<{ success: boolean; reviewId?: string; error?: string }> {
    const { endpointId, requesterId, reviewerId, title, description } = params;

    try {
        // 1. 리뷰 요청 생성
        const res = await db.query<ReviewRequest>(
            `INSERT INTO review_requests (endpoint_id, requester_id, reviewer_id, title, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [endpointId, requesterId, reviewerId || null, title, description || null]
        );

        const reviewRequest = res.rows[0];

        // 2. 리뷰어에게 알림 전송
        if (reviewerId) {
            // 엔드포인트 정보 조회
            const epRes = await db.query(
                `SELECT path, method FROM endpoints WHERE id = $1`,
                [endpointId]
            );
            const endpoint = epRes.rows[0];

            // 요청자 정보 조회
            const requesterRes = await db.query(
                `SELECT name FROM users WHERE id = $1`,
                [requesterId]
            );
            const requesterName = requesterRes.rows[0]?.name || '사용자';

            await createNotification(
                reviewerId,
                'REVIEW_REQUEST',
                `${requesterName}님이 리뷰를 요청했습니다`,
                `${title} - ${endpoint?.method || ''} ${endpoint?.path || ''}`,
                {
                    link: `/endpoints/${endpointId}?reviewId=${reviewRequest.id}`,
                    actorId: requesterId,
                    metadata: { reviewRequestId: reviewRequest.id }
                }
            );
        }

        revalidatePath('/');
        return { success: true, reviewId: reviewRequest.id };
    } catch (error) {
        console.error('Failed to create review request:', error);
        return { success: false, error: '리뷰 요청 생성에 실패했습니다.' };
    }
}

/**
 * 리뷰 응답 (승인/거절)
 */
export async function respondToReview(
    reviewId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    comment?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. 리뷰 요청 업데이트
        const updateRes = await db.query<ReviewRequest>(
            `UPDATE review_requests
             SET status = $1, reviewer_id = $2, comment = $3, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [status, reviewerId, comment || null, reviewId]
        );

        const reviewRequest = updateRes.rows[0];

        if (!reviewRequest) {
            return { success: false, error: '리뷰 요청을 찾을 수 없습니다.' };
        }

        // 2. 엔드포인트 정보 조회
        const epRes = await db.query(
            `SELECT path, method FROM endpoints WHERE id = $1`,
            [reviewRequest.endpoint_id]
        );
        const endpoint = epRes.rows[0];

        // 3. 리뷰어 정보 조회
        const reviewerRes = await db.query(
            `SELECT name FROM users WHERE id = $1`,
            [reviewerId]
        );
        const reviewerName = reviewerRes.rows[0]?.name || '리뷰어';

        // 4. 요청자에게 알림 전송
        const notificationType = status === 'approved' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED';
        const notificationTitle = status === 'approved'
            ? `${reviewerName}님이 리뷰를 승인했습니다`
            : `${reviewerName}님이 리뷰를 거절했습니다`;

        await createNotification(
            reviewRequest.requester_id,
            notificationType,
            notificationTitle,
            `${reviewRequest.title} - ${endpoint?.method || ''} ${endpoint?.path || ''}`,
            {
                link: `/endpoints/${reviewRequest.endpoint_id}?reviewId=${reviewId}`,
                actorId: reviewerId,
                metadata: { reviewRequestId: reviewId, comment }
            }
        );

        // 5. 엔드포인트 상태도 업데이트 (승인 시 'approved'로)
        if (status === 'approved') {
            await db.query(
                `UPDATE endpoints SET status = 'approved' WHERE id = $1`,
                [reviewRequest.endpoint_id]
            );
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to respond to review:', error);
        return { success: false, error: '리뷰 응답에 실패했습니다.' };
    }
}

/**
 * 리뷰 요청 목록 조회
 */
export async function getReviewRequests(params: {
    projectId?: string;
    endpointId?: string;
    requesterId?: string;
    reviewerId?: string;
    status?: ReviewStatus;
}): Promise<ReviewRequest[]> {
    try {
        let query = `
            SELECT
                rr.*,
                requester.name as requester_name,
                requester.email as requester_email,
                reviewer.name as reviewer_name,
                reviewer.email as reviewer_email,
                ep.path as endpoint_path,
                ep.method as endpoint_method
            FROM review_requests rr
            LEFT JOIN users requester ON rr.requester_id = requester.id
            LEFT JOIN users reviewer ON rr.reviewer_id = reviewer.id
            LEFT JOIN endpoints ep ON rr.endpoint_id = ep.id
            WHERE 1=1
        `;

        const queryParams: (string | undefined)[] = [];
        let paramIndex = 1;

        if (params.projectId) {
            query += ` AND ep.project_id = $${paramIndex}`;
            queryParams.push(params.projectId);
            paramIndex++;
        }

        if (params.endpointId) {
            query += ` AND rr.endpoint_id = $${paramIndex}`;
            queryParams.push(params.endpointId);
            paramIndex++;
        }

        if (params.requesterId) {
            query += ` AND rr.requester_id = $${paramIndex}`;
            queryParams.push(params.requesterId);
            paramIndex++;
        }

        if (params.reviewerId) {
            query += ` AND rr.reviewer_id = $${paramIndex}`;
            queryParams.push(params.reviewerId);
            paramIndex++;
        }

        if (params.status) {
            query += ` AND rr.status = $${paramIndex}`;
            queryParams.push(params.status);
            paramIndex++;
        }

        query += ` ORDER BY rr.created_at DESC`;

        const res = await db.query<ReviewRequest>(query, queryParams);
        return res.rows;
    } catch (error) {
        console.error('Failed to get review requests:', error);
        return [];
    }
}

/**
 * 내가 받은 대기 중인 리뷰 요청 조회
 */
export async function getMyPendingReviews(userId: string): Promise<ReviewRequest[]> {
    return getReviewRequests({ reviewerId: userId, status: 'pending' });
}

/**
 * 리뷰 요청 취소
 */
export async function cancelReviewRequest(
    reviewId: string,
    requesterId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await db.query(
            `UPDATE review_requests
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND requester_id = $2 AND status = 'pending'
             RETURNING *`,
            [reviewId, requesterId]
        );

        if (res.rowCount === 0) {
            return { success: false, error: '리뷰 요청을 취소할 수 없습니다.' };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to cancel review request:', error);
        return { success: false, error: '리뷰 요청 취소에 실패했습니다.' };
    }
}

/**
 * 특정 리뷰 요청 상세 조회
 */
export async function getReviewRequestById(reviewId: string): Promise<ReviewRequest | null> {
    try {
        const res = await db.query<ReviewRequest>(
            `SELECT
                rr.*,
                requester.name as requester_name,
                requester.email as requester_email,
                reviewer.name as reviewer_name,
                reviewer.email as reviewer_email,
                ep.path as endpoint_path,
                ep.method as endpoint_method
            FROM review_requests rr
            LEFT JOIN users requester ON rr.requester_id = requester.id
            LEFT JOIN users reviewer ON rr.reviewer_id = reviewer.id
            LEFT JOIN endpoints ep ON rr.endpoint_id = ep.id
            WHERE rr.id = $1`,
            [reviewId]
        );

        return res.rows[0] || null;
    } catch (error) {
        console.error('Failed to get review request:', error);
        return null;
    }
}
