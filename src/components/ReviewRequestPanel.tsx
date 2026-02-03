'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    Clock,
    User,
    MessageSquare,
    Send,
    X as XIcon,
    AlertCircle
} from 'lucide-react';
import {
    type ReviewRequest,
    type ReviewStatus,
    createReviewRequest,
    respondToReview,
    getReviewRequests,
    getMyPendingReviews,
    cancelReviewRequest
} from '@/app/actions/review-request';
import { getProjectMembers, type ProjectMember } from '@/app/actions/project-members';

interface ReviewRequestPanelProps {
    projectId?: string;
    endpointId?: string;
    currentUserId: string;
    currentUserName: string;
    mode?: 'create' | 'list' | 'pending';
    onClose?: () => void;
}

/**
 * 변경 사항 리뷰 요청 워크플로우 패널
 *
 * COLLAB-01-3 구현:
 * - 리뷰 요청 생성 폼
 * - 리뷰 요청 목록 표시
 * - 승인/거절 버튼
 * - 상태별 뱃지
 */
export function ReviewRequestPanel({
    projectId,
    endpointId,
    currentUserId,
    currentUserName,
    mode = 'list',
    onClose
}: ReviewRequestPanelProps) {
    const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(mode === 'create');

    // Create form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedReviewerId, setSelectedReviewerId] = useState('');
    const [availableReviewers, setAvailableReviewers] = useState<ProjectMember[]>([]);

    // Response form state
    const [respondingToId, setRespondingToId] = useState<string | null>(null);
    const [responseComment, setResponseComment] = useState('');

    useEffect(() => {
        loadReviewRequests();
        loadAvailableReviewers();
    }, [projectId, endpointId, currentUserId, mode]);

    const loadReviewRequests = async () => {
        setLoading(true);
        try {
            let requests: ReviewRequest[] = [];
            if (mode === 'pending') {
                requests = await getMyPendingReviews(currentUserId);
            } else {
                requests = await getReviewRequests({
                    projectId,
                    endpointId
                });
            }
            setReviewRequests(requests);
        } catch (error) {
            console.error('Failed to load review requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableReviewers = async () => {
        if (!projectId) return;

        try {
            const members = await getProjectMembers(projectId);
            // 본인을 제외한 멤버만 리뷰어로 선택 가능
            const filteredMembers = members.filter(member => member.user_id !== currentUserId);
            setAvailableReviewers(filteredMembers);
        } catch (error) {
            console.error('Failed to load project members:', error);
            setAvailableReviewers([]);
        }
    };

    const handleCreateReview = async () => {
        if (!endpointId || !title.trim()) return;

        setLoading(true);
        try {
            const result = await createReviewRequest({
                endpointId,
                requesterId: currentUserId,
                reviewerId: selectedReviewerId || undefined,
                title: title.trim(),
                description: description.trim() || undefined
            });

            if (result.success) {
                setTitle('');
                setDescription('');
                setSelectedReviewerId('');
                setShowCreateForm(false);
                loadReviewRequests();
            } else {
                alert(result.error || '리뷰 요청 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to create review:', error);
            alert('리뷰 요청 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRespondToReview = async (reviewId: string, status: 'approved' | 'rejected') => {
        setLoading(true);
        try {
            const result = await respondToReview(
                reviewId,
                currentUserId,
                status,
                responseComment.trim() || undefined
            );

            if (result.success) {
                setRespondingToId(null);
                setResponseComment('');
                loadReviewRequests();
            } else {
                alert(result.error || '리뷰 응답에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to respond to review:', error);
            alert('리뷰 응답 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReview = async (reviewId: string) => {
        if (!confirm('리뷰 요청을 취소하시겠습니까?')) return;

        setLoading(true);
        try {
            const result = await cancelReviewRequest(reviewId, currentUserId);
            if (result.success) {
                loadReviewRequests();
            } else {
                alert(result.error || '리뷰 요청 취소에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to cancel review:', error);
            alert('리뷰 요청 취소 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig: Record<ReviewStatus, { label: string; color: string; bg: string; icon: any }> = {
        pending: { label: '대기 중', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
        approved: { label: '승인됨', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
        rejected: { label: '거절됨', color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle },
        cancelled: { label: '취소됨', color: 'text-slate-500', bg: 'bg-slate-100', icon: XIcon }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800">
                            {mode === 'pending' ? '내가 받은 리뷰 요청' : '리뷰 요청'}
                        </h2>
                        <p className="text-[10px] text-slate-400">
                            변경 사항 검토 및 승인 워크플로우
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {mode !== 'create' && endpointId && (
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                        >
                            {showCreateForm ? '취소' : '+ 리뷰 요청'}
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <XIcon className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {/* 리뷰 요청 생성 폼 */}
                <AnimatePresence>
                    {showCreateForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-50 rounded-2xl p-4 space-y-3"
                        >
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">
                                    제목 *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="리뷰 요청 제목을 입력하세요"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">
                                    설명
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="변경 사항에 대한 설명을 입력하세요"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">
                                    리뷰어 선택 (선택사항)
                                </label>
                                <select
                                    value={selectedReviewerId}
                                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">리뷰어를 선택하세요</option>
                                    {availableReviewers.map((reviewer) => (
                                        <option key={reviewer.user_id} value={reviewer.user_id}>
                                            {reviewer.user_name || reviewer.user_email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleCreateReview}
                                disabled={!title.trim() || loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                            >
                                <Send className="w-4 h-4" />
                                리뷰 요청 보내기
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 리뷰 요청 목록 */}
                {loading && reviewRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                        로딩 중...
                    </div>
                ) : reviewRequests.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-slate-400 text-xs">리뷰 요청이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviewRequests.map((review) => {
                            const statusInfo = statusConfig[review.status];
                            const StatusIcon = statusInfo.icon;
                            const isPending = review.status === 'pending';
                            const isRequester = review.requester_id === currentUserId;
                            const isReviewer = review.reviewer_id === currentUserId || !review.reviewer_id;
                            const canRespond = isPending && !isRequester && isReviewer;

                            return (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-50 rounded-2xl p-4 space-y-3"
                                >
                                    {/* 헤더 */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-bold text-slate-800 truncate">
                                                {review.title}
                                            </h3>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {review.endpoint_method} {review.endpoint_path}
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${statusInfo.bg} flex-shrink-0 ml-2`}>
                                            <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                                            <span className={`text-[10px] font-bold ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 설명 */}
                                    {review.description && (
                                        <p className="text-[10px] text-slate-600 leading-relaxed">
                                            {review.description}
                                        </p>
                                    )}

                                    {/* 요청자/리뷰어 정보 */}
                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3 h-3" />
                                            <span>요청자: {review.requester_name || review.requester_email}</span>
                                        </div>
                                        {review.reviewer_name && (
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3 h-3" />
                                                <span>리뷰어: {review.reviewer_name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 리뷰 코멘트 */}
                                    {review.comment && (
                                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-700 mb-1">
                                                리뷰 코멘트
                                            </p>
                                            <p className="text-[10px] text-slate-600 leading-relaxed">
                                                {review.comment}
                                            </p>
                                        </div>
                                    )}

                                    {/* 액션 버튼 */}
                                    <AnimatePresence>
                                        {canRespond && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-2 pt-2 border-t border-slate-200"
                                            >
                                                {respondingToId === review.id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={responseComment}
                                                            onChange={(e) => setResponseComment(e.target.value)}
                                                            placeholder="리뷰 코멘트를 입력하세요 (선택사항)"
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleRespondToReview(review.id, 'approved')}
                                                                disabled={loading}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                승인
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespondToReview(review.id, 'rejected')}
                                                                disabled={loading}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                거절
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRespondingToId(null);
                                                                    setResponseComment('');
                                                                }}
                                                                className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-300 transition-colors"
                                                            >
                                                                취소
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRespondingToId(review.id)}
                                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                                    >
                                                        리뷰 응답하기
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}

                                        {isPending && isRequester && (
                                            <button
                                                onClick={() => handleCancelReview(review.id)}
                                                disabled={loading}
                                                className="w-full px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
                                            >
                                                요청 취소
                                            </button>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
