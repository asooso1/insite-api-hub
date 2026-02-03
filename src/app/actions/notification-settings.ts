'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { NotificationType } from './notifications';

export interface NotificationSetting {
    id: string;
    user_id: string;
    notification_type: NotificationType;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

const DEFAULT_NOTIFICATION_TYPES: NotificationType[] = [
    'MENTION',
    'COMMENT',
    'REPLY',
    'QUESTION_RESOLVED',
    'API_CHANGE',
    'TEST_FAILED',
    'WEBHOOK_EVENT',
];

/**
 * 사용자의 알림 설정 조회
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSetting[]> {
    try {
        const res = await db.query(
            `SELECT * FROM notification_settings
             WHERE user_id = $1
             ORDER BY notification_type ASC`,
            [userId]
        );
        return res.rows as NotificationSetting[];
    } catch (error) {
        console.error('Failed to get notification settings:', error);
        return [];
    }
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSetting(
    userId: string,
    notificationType: NotificationType,
    enabled: boolean
): Promise<{ success: boolean }> {
    try {
        await db.query(
            `INSERT INTO notification_settings (user_id, notification_type, enabled)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, notification_type)
             DO UPDATE SET enabled = $3, updated_at = CURRENT_TIMESTAMP`,
            [userId, notificationType, enabled]
        );

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to update notification setting:', error);
        return { success: false };
    }
}

/**
 * 알림 전송 전 체크: 사용자가 해당 알림 유형을 활성화했는지 확인
 */
export async function shouldNotify(
    userId: string,
    notificationType: NotificationType
): Promise<boolean> {
    try {
        const res = await db.query(
            `SELECT enabled FROM notification_settings
             WHERE user_id = $1 AND notification_type = $2`,
            [userId, notificationType]
        );

        // 설정이 없으면 기본값 true (활성화)
        if (res.rows.length === 0) {
            return true;
        }

        return res.rows[0].enabled;
    } catch (error) {
        console.error('Failed to check shouldNotify:', error);
        // 에러 시 기본적으로 알림 허용
        return true;
    }
}

/**
 * 기본 설정 초기화 (첫 로그인 시)
 */
export async function initializeNotificationSettings(userId: string): Promise<void> {
    try {
        // 이미 설정이 있는지 확인
        const existing = await db.query(
            `SELECT COUNT(*) as count FROM notification_settings WHERE user_id = $1`,
            [userId]
        );

        if (parseInt(existing.rows[0]?.count || '0', 10) > 0) {
            // 이미 설정 존재
            return;
        }

        // 모든 기본 알림 유형 활성화 상태로 초기화
        const values = DEFAULT_NOTIFICATION_TYPES.map(
            (type) => `('${userId}', '${type}', TRUE)`
        ).join(', ');

        await db.query(
            `INSERT INTO notification_settings (user_id, notification_type, enabled)
             VALUES ${values}
             ON CONFLICT (user_id, notification_type) DO NOTHING`
        );

        console.log(`Initialized notification settings for user ${userId}`);
    } catch (error) {
        console.error('Failed to initialize notification settings:', error);
    }
}

/**
 * 모든 알림 켜기/끄기
 */
export async function toggleAllNotifications(
    userId: string,
    enabled: boolean
): Promise<{ success: boolean }> {
    try {
        await db.query(
            `UPDATE notification_settings
             SET enabled = $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId, enabled]
        );

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to toggle all notifications:', error);
        return { success: false };
    }
}
