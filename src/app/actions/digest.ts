'use server';

import 'server-only';
import { db } from '@/lib/db';

/**
 * 다이제스트 데이터 타입
 */
export interface DigestComment {
    id: string;
    endpoint_id: string;
    endpoint_path: string;
    endpoint_method: string;
    user_name: string;
    content: string;
    created_at: string;
}

export interface DigestApiChange {
    id: string;
    endpoint_id: string;
    path: string;
    method: string;
    action: string; // 'modified', 'added', 'deleted'
    old_status?: string;
    new_status?: string;
    changed_at: string;
}

export interface DigestTestFailure {
    id: string;
    endpoint_id: string;
    path: string;
    method: string;
    test_case_name: string;
    error_message?: string;
    failed_at: string;
}

export interface DigestReviewRequest {
    id: string;
    endpoint_id: string;
    path: string;
    method: string;
    requester_name: string;
    title: string;
    status: string;
    created_at: string;
}

export interface DigestStatusChange {
    id: string;
    endpoint_id: string;
    path: string;
    method: string;
    old_status: string;
    new_status: string;
    changed_at: string;
}

export interface DigestData {
    userId: string;
    period: 'daily' | 'weekly';
    newComments: DigestComment[];
    apiChanges: DigestApiChange[];
    testFailures: DigestTestFailure[];
    reviewRequests: DigestReviewRequest[];
    statusChanges: DigestStatusChange[];
}

export interface DigestSettings {
    id?: string;
    user_id: string;
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'none';
    send_time: string; // HH:MM 형식
    include_comments: boolean;
    include_api_changes: boolean;
    include_test_results: boolean;
    include_review_requests: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * 사용자별 일일 다이제스트 데이터 수집
 */
export async function generateDailyDigest(userId: string): Promise<DigestData> {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 사용자 다이제스트 설정 조회
        const settingsRes = await db.query(
            `SELECT * FROM digest_settings WHERE user_id = $1`,
            [userId]
        );
        const settings: DigestSettings = settingsRes.rows[0] || {
            user_id: userId,
            enabled: true,
            frequency: 'daily',
            send_time: '09:00',
            include_comments: true,
            include_api_changes: true,
            include_test_results: true,
            include_review_requests: true,
        };

        // 사용자가 구독 중인 엔드포인트 조회
        const watchedEndpointsRes = await db.query(
            `SELECT endpoint_id FROM endpoint_watchers WHERE user_id = $1`,
            [userId]
        );
        const watchedEndpointIds = watchedEndpointsRes.rows.map(r => r.endpoint_id);

        // 사용자가 소유한 엔드포인트 조회
        const ownedEndpointsRes = await db.query(
            `SELECT id FROM endpoints WHERE owner_id = $1`,
            [userId]
        );
        const ownedEndpointIds = ownedEndpointsRes.rows.map(r => r.id);

        // 모든 관심 엔드포인트 (구독 + 소유)
        const allEndpointIds = [...new Set([...watchedEndpointIds, ...ownedEndpointIds])];

        const digestData: DigestData = {
            userId,
            period: 'daily',
            newComments: [],
            apiChanges: [],
            testFailures: [],
            reviewRequests: [],
            statusChanges: [],
        };

        if (allEndpointIds.length === 0) {
            return digestData;
        }

        // 1. 새 댓글 수집 (설정에서 포함하도록 설정된 경우)
        if (settings.include_comments) {
            const commentsRes = await db.query(
                `SELECT
                    c.id, c.endpoint_id, c.content, c.created_at,
                    e.path as endpoint_path, e.method as endpoint_method,
                    u.name as user_name
                FROM api_comments c
                JOIN endpoints e ON c.endpoint_id = e.id
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.endpoint_id = ANY($1)
                  AND c.created_at >= $2
                ORDER BY c.created_at DESC
                LIMIT 50`,
                [allEndpointIds, yesterday.toISOString()]
            );

            digestData.newComments = commentsRes.rows.map(row => ({
                id: row.id,
                endpoint_id: row.endpoint_id,
                endpoint_path: row.endpoint_path,
                endpoint_method: row.endpoint_method,
                user_name: row.user_name || 'Unknown',
                content: row.content,
                created_at: row.created_at,
            }));
        }

        // 2. API 변경 수집 (활동 로그 기반)
        if (settings.include_api_changes) {
            const changesRes = await db.query(
                `SELECT
                    a.id, a.target_id as endpoint_id, a.action, a.details, a.created_at,
                    e.path, e.method
                FROM activity_logs a
                JOIN endpoints e ON a.target_id = e.id::text
                WHERE a.target_type = 'ENDPOINT'
                  AND a.target_id = ANY($1)
                  AND a.action IN ('API_MODIFIED', 'API_ADDED', 'API_DELETED')
                  AND a.created_at >= $2
                ORDER BY a.created_at DESC
                LIMIT 50`,
                [allEndpointIds.map(id => id.toString()), yesterday.toISOString()]
            );

            digestData.apiChanges = changesRes.rows.map(row => {
                const details = row.details || {};
                return {
                    id: row.id,
                    endpoint_id: row.endpoint_id,
                    path: row.path,
                    method: row.method,
                    action: row.action === 'API_MODIFIED' ? 'modified' :
                            row.action === 'API_ADDED' ? 'added' : 'deleted',
                    old_status: details.old_status,
                    new_status: details.new_status,
                    changed_at: row.created_at,
                };
            });
        }

        // 3. 테스트 실패 수집
        if (settings.include_test_results) {
            const failuresRes = await db.query(
                `SELECT
                    th.id, th.api_id as endpoint_id, th.response_body, th.executed_at,
                    tc.name as test_case_name,
                    e.path, e.method
                FROM test_history th
                LEFT JOIN test_cases tc ON th.test_case_id = tc.id
                LEFT JOIN endpoints e ON th.api_id = e.id::text
                WHERE th.success = false
                  AND th.api_id = ANY($1)
                  AND th.executed_at >= $2
                ORDER BY th.executed_at DESC
                LIMIT 50`,
                [allEndpointIds.map(id => id.toString()), yesterday.toISOString()]
            );

            digestData.testFailures = failuresRes.rows.map(row => ({
                id: row.id,
                endpoint_id: row.endpoint_id,
                path: row.path,
                method: row.method,
                test_case_name: row.test_case_name || 'Unnamed Test',
                error_message: row.response_body,
                failed_at: row.executed_at,
            }));
        }

        // 4. 리뷰 요청 수집
        if (settings.include_review_requests) {
            const reviewsRes = await db.query(
                `SELECT
                    rr.id, rr.endpoint_id, rr.title, rr.status, rr.created_at,
                    e.path, e.method,
                    u.name as requester_name
                FROM review_requests rr
                JOIN endpoints e ON rr.endpoint_id = e.id
                LEFT JOIN users u ON rr.requester_id = u.id
                WHERE (rr.reviewer_id = $1 OR rr.requester_id = $1)
                  AND rr.created_at >= $2
                ORDER BY rr.created_at DESC
                LIMIT 50`,
                [userId, yesterday.toISOString()]
            );

            digestData.reviewRequests = reviewsRes.rows.map(row => ({
                id: row.id,
                endpoint_id: row.endpoint_id,
                path: row.path,
                method: row.method,
                requester_name: row.requester_name || 'Unknown',
                title: row.title,
                status: row.status,
                created_at: row.created_at,
            }));
        }

        // 5. 내 담당 API 상태 변경 (소유한 엔드포인트만)
        if (ownedEndpointIds.length > 0) {
            const statusChangesRes = await db.query(
                `SELECT
                    a.id, a.target_id as endpoint_id, a.details, a.created_at,
                    e.path, e.method
                FROM activity_logs a
                JOIN endpoints e ON a.target_id = e.id::text
                WHERE a.target_type = 'ENDPOINT'
                  AND a.target_id = ANY($1)
                  AND a.action = 'STATUS_CHANGED'
                  AND a.created_at >= $2
                ORDER BY a.created_at DESC
                LIMIT 50`,
                [ownedEndpointIds.map(id => id.toString()), yesterday.toISOString()]
            );

            digestData.statusChanges = statusChangesRes.rows.map(row => {
                const details = row.details || {};
                return {
                    id: row.id,
                    endpoint_id: row.endpoint_id,
                    path: row.path,
                    method: row.method,
                    old_status: details.old_status || 'unknown',
                    new_status: details.new_status || 'unknown',
                    changed_at: row.created_at,
                };
            });
        }

        return digestData;
    } catch (error) {
        console.error('[Digest] Failed to generate daily digest:', error);
        throw error;
    }
}

/**
 * 모든 사용자에게 다이제스트 발송 (스케줄러에서 호출)
 */
export async function sendDailyDigests(): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
        // 다이제스트를 받도록 설정한 사용자 조회
        const usersRes = await db.query(
            `SELECT user_id, send_time
             FROM digest_settings
             WHERE enabled = true
               AND frequency = 'daily'`
        );

        console.log(`[Digest] Found ${usersRes.rows.length} users with daily digest enabled`);

        for (const row of usersRes.rows) {
            const userId = row.user_id;

            try {
                // 다이제스트 데이터 생성
                const digestData = await generateDailyDigest(userId);

                // 데이터가 있는 경우에만 알림 생성
                const totalItems =
                    digestData.newComments.length +
                    digestData.apiChanges.length +
                    digestData.testFailures.length +
                    digestData.reviewRequests.length +
                    digestData.statusChanges.length;

                if (totalItems > 0) {
                    // 알림 생성
                    await db.query(
                        `INSERT INTO notifications (
                            user_id, type, title, message, metadata, created_at
                        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
                        [
                            userId,
                            'DIGEST',
                            '일일 다이제스트',
                            `지난 24시간 동안 ${totalItems}개의 업데이트가 있습니다.`,
                            JSON.stringify(digestData),
                        ]
                    );

                    sent++;
                    console.log(`[Digest] Sent digest to user ${userId} (${totalItems} items)`);
                } else {
                    console.log(`[Digest] No updates for user ${userId}, skipping`);
                }
            } catch (error) {
                console.error(`[Digest] Failed to send digest to user ${userId}:`, error);
                failed++;
            }
        }

        console.log(`[Digest] Digest sending complete. Sent: ${sent}, Failed: ${failed}`);
        return { sent, failed };
    } catch (error) {
        console.error('[Digest] Failed to send daily digests:', error);
        throw error;
    }
}

/**
 * 다이제스트 설정 조회
 */
export async function getDigestSettings(userId: string): Promise<DigestSettings> {
    try {
        const res = await db.query(
            `SELECT * FROM digest_settings WHERE user_id = $1`,
            [userId]
        );

        if (res.rows.length === 0) {
            // 기본 설정 반환
            return {
                user_id: userId,
                enabled: true,
                frequency: 'daily',
                send_time: '09:00',
                include_comments: true,
                include_api_changes: true,
                include_test_results: true,
                include_review_requests: true,
            };
        }

        return res.rows[0];
    } catch (error) {
        console.error('[Digest] Failed to get digest settings:', error);
        throw error;
    }
}

/**
 * 다이제스트 설정 업데이트
 */
export async function updateDigestSettings(
    userId: string,
    settings: Partial<DigestSettings>
): Promise<{ success: boolean }> {
    try {
        // 기존 설정 확인
        const existingRes = await db.query(
            `SELECT id FROM digest_settings WHERE user_id = $1`,
            [userId]
        );

        if (existingRes.rows.length === 0) {
            // 새로운 설정 생성
            await db.query(
                `INSERT INTO digest_settings (
                    user_id, enabled, frequency, send_time,
                    include_comments, include_api_changes,
                    include_test_results, include_review_requests
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    userId,
                    settings.enabled ?? true,
                    settings.frequency ?? 'daily',
                    settings.send_time ?? '09:00',
                    settings.include_comments ?? true,
                    settings.include_api_changes ?? true,
                    settings.include_test_results ?? true,
                    settings.include_review_requests ?? true,
                ]
            );
        } else {
            // 기존 설정 업데이트
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (settings.enabled !== undefined) {
                updates.push(`enabled = $${paramIndex++}`);
                values.push(settings.enabled);
            }
            if (settings.frequency !== undefined) {
                updates.push(`frequency = $${paramIndex++}`);
                values.push(settings.frequency);
            }
            if (settings.send_time !== undefined) {
                updates.push(`send_time = $${paramIndex++}`);
                values.push(settings.send_time);
            }
            if (settings.include_comments !== undefined) {
                updates.push(`include_comments = $${paramIndex++}`);
                values.push(settings.include_comments);
            }
            if (settings.include_api_changes !== undefined) {
                updates.push(`include_api_changes = $${paramIndex++}`);
                values.push(settings.include_api_changes);
            }
            if (settings.include_test_results !== undefined) {
                updates.push(`include_test_results = $${paramIndex++}`);
                values.push(settings.include_test_results);
            }
            if (settings.include_review_requests !== undefined) {
                updates.push(`include_review_requests = $${paramIndex++}`);
                values.push(settings.include_review_requests);
            }

            if (updates.length > 0) {
                updates.push(`updated_at = NOW()`);
                values.push(userId);

                await db.query(
                    `UPDATE digest_settings
                     SET ${updates.join(', ')}
                     WHERE user_id = $${paramIndex}`,
                    values
                );
            }
        }

        console.log(`[Digest] Updated settings for user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error('[Digest] Failed to update digest settings:', error);
        return { success: false };
    }
}
