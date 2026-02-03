"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createNotification, parseMentions } from './notifications';
import { getWatchers } from './watch';
import { logActivity } from './activity';

export type CommentType = 'COMMENT' | 'QUESTION' | 'ANSWER';

export interface ApiComment {
    id: string;
    project_id: string;
    endpoint_id: string;
    user_id: string | null;
    parent_id: string | null;
    content: string;
    comment_type: CommentType;
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields
    user_name?: string;
    user_email?: string;
    replies?: ApiComment[];
}

export async function getCommentsByEndpoint(endpointId: string): Promise<ApiComment[]> {
    try {
        const res = await db.query(
            `SELECT
                c.id,
                c.project_id,
                c.endpoint_id,
                c.user_id,
                c.parent_id,
                c.content,
                c.comment_type,
                c.is_resolved,
                c.created_at,
                c.updated_at,
                u.name as user_name,
                u.email as user_email
             FROM api_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.endpoint_id = $1
             ORDER BY c.created_at ASC`,
            [endpointId]
        );

        // Build tree structure (parent-child relationships)
        const comments = res.rows as ApiComment[];
        const commentMap = new Map<string, ApiComment>();
        const rootComments: ApiComment[] = [];

        // First pass: map all comments
        comments.forEach(c => {
            c.replies = [];
            commentMap.set(c.id, c);
        });

        // Second pass: build tree
        comments.forEach(c => {
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id)!.replies!.push(c);
            } else if (!c.parent_id) {
                rootComments.push(c);
            }
        });

        return rootComments;
    } catch (error) {
        console.error("Failed to get comments:", error);
        return [];
    }
}

export async function getCommentsByProject(projectId: string): Promise<ApiComment[]> {
    try {
        const res = await db.query(
            `SELECT
                c.id,
                c.project_id,
                c.endpoint_id,
                c.user_id,
                c.parent_id,
                c.content,
                c.comment_type,
                c.is_resolved,
                c.created_at,
                c.updated_at,
                u.name as user_name,
                u.email as user_email,
                e.path as endpoint_path,
                e.method as endpoint_method
             FROM api_comments c
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN endpoints e ON c.endpoint_id = e.id
             WHERE c.project_id = $1
             ORDER BY c.created_at DESC`,
            [projectId]
        );
        return res.rows as ApiComment[];
    } catch (error) {
        console.error("Failed to get project comments:", error);
        return [];
    }
}

export async function createComment(
    projectId: string,
    endpointId: string,
    userId: string | null,
    content: string,
    commentType: CommentType = 'COMMENT',
    parentId?: string
) {
    try {
        const res = await db.query(
            `INSERT INTO api_comments (project_id, endpoint_id, user_id, content, comment_type, parent_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [projectId, endpointId, userId, content, commentType, parentId || null]
        );

        const commentId = res.rows[0].id;

        // 알림을 받을 사용자 추적 (중복 방지)
        const notifiedUsers = new Set<string>();
        if (userId) {
            notifiedUsers.add(userId); // 본인은 알림 받지 않음
        }

        // 1. 사용자 이름 가져오기
        let userName = '익명 사용자';
        if (userId) {
            const userRes = await db.query(`SELECT name FROM users WHERE id = $1`, [userId]);
            userName = userRes.rows[0]?.name || '익명 사용자';
        }

        // 2. 엔드포인트 정보 가져오기 (Owner, path 등)
        const endpointRes = await db.query(
            `SELECT e.path, e.owner_id FROM endpoints e WHERE e.id = $1`,
            [endpointId]
        );
        const endpointPath = endpointRes.rows[0]?.path || 'API';
        const ownerId = endpointRes.rows[0]?.owner_id;

        // 3. Owner에게 알림 (본인이 아닌 경우)
        if (ownerId && ownerId !== userId && !notifiedUsers.has(ownerId)) {
            await createNotification(
                ownerId,
                'COMMENT',
                '새 댓글',
                `${userName}님이 ${endpointPath}에 댓글을 남겼습니다: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
                {
                    link: `/project/${projectId}?endpoint=${endpointId}&comment=${commentId}`,
                    actorId: userId || undefined,
                    metadata: { endpointId, commentId }
                }
            );
            notifiedUsers.add(ownerId);
        }

        // 4. 대댓글인 경우 부모 댓글 작성자에게 알림
        if (parentId) {
            const parentRes = await db.query(
                `SELECT user_id FROM api_comments WHERE id = $1`,
                [parentId]
            );
            const parentUserId = parentRes.rows[0]?.user_id;

            if (parentUserId && parentUserId !== userId && !notifiedUsers.has(parentUserId)) {
                await createNotification(
                    parentUserId,
                    'REPLY',
                    '답글 알림',
                    `${userName}님이 회원님의 댓글에 답글을 남겼습니다: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
                    {
                        link: `/project/${projectId}?endpoint=${endpointId}&comment=${commentId}`,
                        actorId: userId || undefined,
                        metadata: { endpointId, commentId, parentId }
                    }
                );
                notifiedUsers.add(parentUserId);
            }
        }

        // 5. @멘션된 사용자에게 알림
        const mentions = await parseMentions(content);
        for (const mention of mentions) {
            if (mention.userId !== userId && !notifiedUsers.has(mention.userId)) {
                await createNotification(
                    mention.userId,
                    'MENTION',
                    `${userName}님이 회원님을 멘션했습니다`,
                    `댓글에서: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,
                    {
                        link: `/project/${projectId}?endpoint=${endpointId}&comment=${commentId}`,
                        actorId: userId || undefined,
                        metadata: { endpointId, commentId }
                    }
                );
                notifiedUsers.add(mention.userId);
            }
        }

        // 6. Watch 구독자에게 알림
        const watchers = await getWatchers(endpointId);
        for (const watcher of watchers) {
            if (!notifiedUsers.has(watcher.user_id)) {
                await createNotification(
                    watcher.user_id,
                    'COMMENT',
                    '구독 중인 API에 새 댓글',
                    `${userName}님이 ${endpointPath}에 댓글을 남겼습니다: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
                    {
                        link: `/project/${projectId}?endpoint=${endpointId}&comment=${commentId}`,
                        actorId: userId || undefined,
                        metadata: { endpointId, commentId }
                    }
                );
                notifiedUsers.add(watcher.user_id);
            }
        }

        // 7. Activity 로그 기록
        if (userId) {
            await logActivity({
                userId,
                projectId,
                actionType: 'comment',
                targetType: 'endpoint',
                targetId: endpointId,
                metadata: { commentId, content: content.slice(0, 100) }
            });
        }

        revalidatePath('/');
        return { success: true, comment: res.rows[0] };
    } catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, message: "코멘트 생성 실패" };
    }
}

export async function updateComment(commentId: string, content: string) {
    try {
        await db.query(
            `UPDATE api_comments
             SET content = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [content, commentId]
        );
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to update comment:", error);
        return { success: false, message: "코멘트 수정 실패" };
    }
}

export async function deleteComment(commentId: string) {
    try {
        await db.query(`DELETE FROM api_comments WHERE id = $1`, [commentId]);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return { success: false, message: "코멘트 삭제 실패" };
    }
}

export async function resolveQuestion(commentId: string, resolved: boolean = true) {
    try {
        // 질문 정보 가져오기
        const questionRes = await db.query(
            `SELECT c.project_id, c.endpoint_id, c.user_id, c.content, e.path
             FROM api_comments c
             LEFT JOIN endpoints e ON c.endpoint_id = e.id
             WHERE c.id = $1`,
            [commentId]
        );

        if (questionRes.rows.length === 0) {
            return { success: false, message: "질문을 찾을 수 없습니다" };
        }

        const question = questionRes.rows[0];

        // 질문 해결 상태 업데이트
        await db.query(
            `UPDATE api_comments
             SET is_resolved = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [resolved, commentId]
        );

        // 질문 작성자에게 알림 (resolved = true일 때만)
        if (resolved && question.user_id) {
            await createNotification(
                question.user_id,
                'QUESTION_RESOLVED',
                '질문이 해결되었습니다',
                `${question.path}에 남긴 질문이 해결되었습니다: "${question.content.slice(0, 50)}${question.content.length > 50 ? '...' : ''}"`,
                {
                    link: `/project/${question.project_id}?endpoint=${question.endpoint_id}&comment=${commentId}`,
                    metadata: { commentId, endpointId: question.endpoint_id }
                }
            );
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to resolve question:", error);
        return { success: false, message: "질문 해결 상태 변경 실패" };
    }
}

export async function getUnresolvedQuestions(projectId: string): Promise<ApiComment[]> {
    try {
        const res = await db.query(
            `SELECT
                c.id,
                c.project_id,
                c.endpoint_id,
                c.user_id,
                c.content,
                c.comment_type,
                c.is_resolved,
                c.created_at,
                u.name as user_name,
                u.email as user_email,
                e.path as endpoint_path,
                e.method as endpoint_method
             FROM api_comments c
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN endpoints e ON c.endpoint_id = e.id
             WHERE c.project_id = $1
               AND c.comment_type = 'QUESTION'
               AND c.is_resolved = FALSE
             ORDER BY c.created_at DESC`,
            [projectId]
        );
        return res.rows as ApiComment[];
    } catch (error) {
        console.error("Failed to get unresolved questions:", error);
        return [];
    }
}

export async function getCommentStats(projectId: string) {
    try {
        const res = await db.query(
            `SELECT
                COUNT(*) FILTER (WHERE comment_type = 'COMMENT') as total_comments,
                COUNT(*) FILTER (WHERE comment_type = 'QUESTION') as total_questions,
                COUNT(*) FILTER (WHERE comment_type = 'QUESTION' AND is_resolved = FALSE) as unresolved_questions,
                COUNT(*) FILTER (WHERE comment_type = 'ANSWER') as total_answers
             FROM api_comments
             WHERE project_id = $1`,
            [projectId]
        );
        return res.rows[0];
    } catch (error) {
        console.error("Failed to get comment stats:", error);
        return { total_comments: 0, total_questions: 0, unresolved_questions: 0, total_answers: 0 };
    }
}
