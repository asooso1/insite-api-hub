import { LucideIcon, Plus, Edit, Trash, MessageCircle, Play, Settings, Activity } from 'lucide-react';
import { ActivityType } from '@/app/actions/activity';

/**
 * 활동 유형별 아이콘 반환
 */
export function getActivityIcon(type: ActivityType): LucideIcon {
    const iconMap: Record<ActivityType, LucideIcon> = {
        ENDPOINT_ADDED: Plus,
        ENDPOINT_MODIFIED: Edit,
        ENDPOINT_DELETED: Trash,
        COMMENT_CREATED: MessageCircle,
        COMMENT_DELETED: Trash,
        QUESTION_ASKED: MessageCircle,
        QUESTION_RESOLVED: MessageCircle,
        TEST_EXECUTED: Play,
        TEST_FAILED: Play,
        MODEL_ADDED: Plus,
        MODEL_MODIFIED: Edit,
        MODEL_DELETED: Trash,
        VERSION_CREATED: Settings,
        WEBHOOK_RECEIVED: Settings,
        USER_JOINED: Plus,
        USER_LEFT: Trash,
    };
    return iconMap[type] || Activity;
}

/**
 * 활동 유형별 색상 클래스 반환 (Tailwind)
 */
export function getActivityColor(type: ActivityType): {
    bg: string;
    text: string;
    border: string;
} {
    const colorMap: Record<ActivityType, { bg: string; text: string; border: string }> = {
        ENDPOINT_ADDED: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
        ENDPOINT_MODIFIED: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
        ENDPOINT_DELETED: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
        COMMENT_CREATED: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
        COMMENT_DELETED: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
        QUESTION_ASKED: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        QUESTION_RESOLVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        TEST_EXECUTED: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
        TEST_FAILED: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
        MODEL_ADDED: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
        MODEL_MODIFIED: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
        MODEL_DELETED: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
        VERSION_CREATED: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
        WEBHOOK_RECEIVED: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
        USER_JOINED: { bg: 'bg-lime-500/10', text: 'text-lime-500', border: 'border-lime-500/20' },
        USER_LEFT: { bg: 'bg-stone-500/10', text: 'text-stone-500', border: 'border-stone-500/20' },
    };
    return colorMap[type] || { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' };
}

/**
 * 활동 유형 한글 표시명 반환
 */
export function getActivityTypeLabel(type: ActivityType): string {
    const labelMap: Record<ActivityType, string> = {
        ENDPOINT_ADDED: '엔드포인트 추가',
        ENDPOINT_MODIFIED: '엔드포인트 수정',
        ENDPOINT_DELETED: '엔드포인트 삭제',
        COMMENT_CREATED: '댓글 작성',
        COMMENT_DELETED: '댓글 삭제',
        QUESTION_ASKED: '질문 등록',
        QUESTION_RESOLVED: '질문 해결',
        TEST_EXECUTED: '테스트 실행',
        TEST_FAILED: '테스트 실패',
        MODEL_ADDED: '모델 추가',
        MODEL_MODIFIED: '모델 수정',
        MODEL_DELETED: '모델 삭제',
        VERSION_CREATED: '버전 생성',
        WEBHOOK_RECEIVED: '웹훅 수신',
        USER_JOINED: '사용자 참여',
        USER_LEFT: '사용자 이탈',
    };
    return labelMap[type] || '알 수 없음';
}
