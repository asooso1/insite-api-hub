/**
 * 알림 관련 타입 정의
 */

export type NotificationType =
    | 'MENTION'           // @멘션
    | 'COMMENT'           // 댓글 알림
    | 'REPLY'             // 답글 알림
    | 'QUESTION_RESOLVED' // 질문 해결됨
    | 'API_CHANGE'        // API 변경 알림
    | 'TEST_FAILED'       // 테스트 실패
    | 'WEBHOOK_EVENT'     // 웹훅 이벤트
    | 'DIGEST';           // 일일 다이제스트

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

export interface NotificationSetting {
    id: string;
    user_id: string;
    notification_type: NotificationType;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    MENTION: '멘션',
    COMMENT: '댓글',
    REPLY: '답글',
    QUESTION_RESOLVED: '질문 해결',
    API_CHANGE: 'API 변경',
    TEST_FAILED: '테스트 실패',
    WEBHOOK_EVENT: '웹훅 이벤트',
    DIGEST: '다이제스트',
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
    MENTION: '누군가 나를 @멘션했을 때',
    COMMENT: '내가 구독한 API에 댓글이 달렸을 때',
    REPLY: '내 댓글에 답글이 달렸을 때',
    QUESTION_RESOLVED: '내가 작성한 질문이 해결되었을 때',
    API_CHANGE: '구독한 API의 스펙이 변경되었을 때',
    TEST_FAILED: 'API 테스트가 실패했을 때',
    WEBHOOK_EVENT: 'GitHub 푸시, PR, 이슈 등 이벤트 발생 시',
    DIGEST: '일일/주간 업데이트 요약',
};
