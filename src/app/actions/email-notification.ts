'use server';

import 'server-only';
import { db } from '@/lib/db';
import { getEmailService } from '@/lib/email/email-service';
import { getNotificationEmailTemplate } from '@/lib/email/templates';
import { Notification } from '@/types/notifications';

/**
 * 이메일 알림 활성화 여부 체크
 *
 * notification_settings 테이블에 email_enabled 컬럼이 TRUE인지 확인합니다.
 */
export async function isEmailNotificationEnabled(userId: string): Promise<boolean> {
    try {
        const res = await db.query(
            `SELECT email_enabled
             FROM notification_settings
             WHERE user_id = $1
             LIMIT 1`,
            [userId]
        );

        // 설정이 없으면 기본값 false (이메일 알림 비활성화)
        if (res.rows.length === 0) {
            return false;
        }

        return res.rows[0].email_enabled === true;
    } catch (error) {
        console.error('[Email] Failed to check email notification status:', error);
        // 에러 발생 시 보수적으로 false 반환 (이메일 발송하지 않음)
        return false;
    }
}

/**
 * 사용자 정보 조회 (이메일 주소 포함)
 */
async function getUserInfo(userId: string): Promise<{
    name: string;
    email: string;
} | null> {
    try {
        const res = await db.query(
            `SELECT name, email FROM users WHERE id = $1`,
            [userId]
        );

        if (res.rows.length === 0) {
            return null;
        }

        return {
            name: res.rows[0].name || '사용자',
            email: res.rows[0].email,
        };
    } catch (error) {
        console.error('[Email] Failed to get user info:', error);
        return null;
    }
}

/**
 * 단일 알림에 대해 이메일 발송
 *
 * @param notification - 발송할 알림 객체
 * @returns { success: boolean, reason?: string }
 */
export async function sendNotificationEmail(
    notification: Notification
): Promise<{ success: boolean; reason?: string }> {
    try {
        // 1. 사용자가 이메일 알림을 활성화했는지 확인
        const emailEnabled = await isEmailNotificationEnabled(notification.user_id);
        if (!emailEnabled) {
            console.log('[Email] Email notification disabled for user:', notification.user_id);
            return { success: false, reason: 'Email notification disabled by user' };
        }

        // 2. 사용자 정보 조회 (이름, 이메일 주소)
        const userInfo = await getUserInfo(notification.user_id);
        if (!userInfo || !userInfo.email) {
            console.log('[Email] User email not found:', notification.user_id);
            return { success: false, reason: 'User email not found' };
        }

        // 3. 이메일 템플릿 생성
        const { subject, html, text } = getNotificationEmailTemplate({
            userName: userInfo.name,
            title: notification.title,
            message: notification.message,
            link: notification.link || process.env.APP_BASE_URL || 'http://localhost:3005',
            projectName: notification.metadata?.projectName as string | undefined,
        });

        // 4. 이메일 발송
        const emailService = getEmailService();
        const result = await emailService.send({
            to: userInfo.email,
            subject,
            html,
            text,
        });

        if (result.success) {
            console.log('[Email] Notification email sent successfully to:', userInfo.email);
            return { success: true };
        } else {
            console.error('[Email] Failed to send notification email:', result.error);
            return { success: false, reason: result.error || 'Unknown error' };
        }
    } catch (error) {
        console.error('[Email] Exception while sending notification email:', error);
        return {
            success: false,
            reason: error instanceof Error ? error.message : 'Unknown exception',
        };
    }
}

/**
 * 여러 알림을 한 번에 이메일로 발송 (벌크 전송)
 *
 * @param notifications - 발송할 알림 배열
 * @returns { successCount: number, failCount: number }
 */
export async function sendBulkNotificationEmails(
    notifications: Notification[]
): Promise<{ successCount: number; failCount: number }> {
    let successCount = 0;
    let failCount = 0;

    for (const notification of notifications) {
        const result = await sendNotificationEmail(notification);
        if (result.success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log(`[Email] Bulk email sent: ${successCount} success, ${failCount} failed`);

    return { successCount, failCount };
}

/**
 * 이메일 알림 설정 업데이트 (email_enabled 컬럼)
 *
 * @param userId - 사용자 ID
 * @param enabled - 이메일 알림 활성화 여부
 */
export async function updateEmailNotificationSetting(
    userId: string,
    enabled: boolean
): Promise<{ success: boolean }> {
    try {
        // notification_settings 테이블의 email_enabled 컬럼 업데이트
        await db.query(
            `UPDATE notification_settings
             SET email_enabled = $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId, enabled]
        );

        console.log(`[Email] Email notification ${enabled ? 'enabled' : 'disabled'} for user:`, userId);
        return { success: true };
    } catch (error) {
        console.error('[Email] Failed to update email notification setting:', error);
        return { success: false };
    }
}
