'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type NotificationType =
    | 'MENTION'           // @멘션
    | 'COMMENT'           // 댓글 알림
    | 'REPLY'             // 답글 알림
    | 'QUESTION_RESOLVED' // 질문 해결됨
    | 'API_CHANGE'        // API 변경 알림
    | 'TEST_FAILED'       // 테스트 실패
    | 'WEBHOOK_EVENT';    // 웹훅 이벤트

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
    metadata?: Record<string, unknown>;
    // Joined fields
    actor_name?: string;
    actor_email?: string;
}

export async function getNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
    const { unreadOnly = false, limit = 50 } = options || {};

    try {
        let query = `
            SELECT
                n.*,
                u.name as actor_name,
                u.email as actor_email
            FROM notifications n
            LEFT JOIN users u ON n.actor_id = u.id
            WHERE n.user_id = $1
        `;

        if (unreadOnly) {
            query += ` AND n.is_read = FALSE`;
        }

        query += ` ORDER BY n.created_at DESC LIMIT $2`;

        const res = await db.query(query, [userId, limit]);
        return res.rows as Notification[];
    } catch (error) {
        console.error("Failed to get notifications:", error);
        return [];
    }
}

export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const res = await db.query(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );
        return parseInt(res.rows[0]?.count || '0', 10);
    } catch (error) {
        console.error("Failed to get unread count:", error);
        return 0;
    }
}

export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
        link?: string;
        actorId?: string;
        metadata?: Record<string, unknown>;
    }
) {
    try {
        const { link, actorId, metadata } = options || {};

        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link, actor_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, type, title, message, link || null, actorId || null, metadata ? JSON.stringify(metadata) : null]
        );

        return { success: true };
    } catch (error) {
        console.error("Failed to create notification:", error);
        return { success: false };
    }
}

export async function markAsRead(notificationId: string) {
    try {
        await db.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
            [notificationId]
        );
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark as read:", error);
        return { success: false };
    }
}

export async function markAllAsRead(userId: string) {
    try {
        await db.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark all as read:", error);
        return { success: false };
    }
}

export async function deleteNotification(notificationId: string) {
    try {
        await db.query(`DELETE FROM notifications WHERE id = $1`, [notificationId]);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete notification:", error);
        return { success: false };
    }
}

// Parse @mentions from text and return user IDs
export async function parseMentions(text: string): Promise<{ userId: string; userName: string }[]> {
    const mentionPattern = /@(\w+)/g;
    const matches = text.match(mentionPattern);

    if (!matches) return [];

    const usernames = matches.map(m => m.slice(1)); // Remove @

    try {
        const res = await db.query(
            `SELECT id, name FROM users WHERE name = ANY($1::text[])`,
            [usernames]
        );
        return res.rows.map(r => ({ userId: r.id, userName: r.name }));
    } catch (error) {
        console.error("Failed to parse mentions:", error);
        return [];
    }
}

// Create mention notifications
export async function notifyMentions(
    text: string,
    actorId: string,
    actorName: string,
    link: string,
    context: string // e.g., "코멘트에서", "질문에서"
) {
    const mentions = await parseMentions(text);

    for (const { userId, userName } of mentions) {
        if (userId === actorId) continue; // Don't notify self

        await createNotification(
            userId,
            'MENTION',
            `${actorName}님이 회원님을 멘션했습니다`,
            `${context}: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`,
            { link, actorId }
        );
    }
}

// Get users for mention autocomplete
export async function getMentionSuggestions(query: string, limit: number = 5): Promise<{ id: string; name: string; email: string }[]> {
    try {
        const res = await db.query(
            `SELECT id, name, email FROM users
             WHERE name ILIKE $1 OR email ILIKE $1
             LIMIT $2`,
            [`%${query}%`, limit]
        );
        return res.rows as { id: string; name: string; email: string }[];
    } catch (error) {
        console.error("Failed to get mention suggestions:", error);
        return [];
    }
}
