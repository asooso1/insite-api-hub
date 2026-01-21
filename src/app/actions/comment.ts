"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
        await db.query(
            `UPDATE api_comments
             SET is_resolved = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [resolved, commentId]
        );
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
