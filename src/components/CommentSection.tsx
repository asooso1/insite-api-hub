"use client";

import { useState, useEffect } from "react";
import { MessageCircle, HelpCircle, CheckCircle, Send, Reply, Trash2, MoreVertical, Check, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ApiComment,
    CommentType,
    getCommentsByEndpoint,
    createComment,
    deleteComment,
    resolveQuestion,
    updateComment
} from "@/app/actions/comment";
import { MentionInput, renderMentions } from "@/components/comments/MentionInput";

interface CommentSectionProps {
    projectId: string;
    endpointId: string;
    userId?: string | null;
    userName?: string | null;
}

function CommentTypeIcon({ type, resolved }: { type: CommentType; resolved?: boolean }) {
    if (type === 'QUESTION') {
        return resolved ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
            <HelpCircle className="w-4 h-4 text-amber-500" />
        );
    }
    return <MessageCircle className="w-4 h-4 text-blue-500" />;
}

// 상대 시간 표시 함수
function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
    });
}

function SingleComment({
    comment,
    onReply,
    onDelete,
    onResolve,
    onEdit,
    currentUserId,
    depth = 0
}: {
    comment: ApiComment;
    onReply: (parentId: string, type: CommentType) => void;
    onDelete: (id: string) => void;
    onResolve: (id: string, resolved: boolean) => void;
    onEdit: (id: string, content: string) => void;
    currentUserId?: string | null;
    depth?: number;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isOwner = currentUserId && comment.user_id === currentUserId;
    const canResolve = comment.comment_type === 'QUESTION' && !comment.is_resolved;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isResolved = comment.is_resolved;
    const isEdited = comment.updated_at !== comment.created_at;

    const handleEditSubmit = async () => {
        if (!editContent.trim()) return;
        await onEdit(comment.id, editContent);
        setIsEditing(false);
    };

    return (
        <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border/50' : ''}`}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    p-3 rounded-xl mb-2 group relative
                    ${isResolved ? 'opacity-60' : ''}
                    ${comment.comment_type === 'QUESTION' && !comment.is_resolved
                        ? 'bg-amber-500/5 border border-amber-500/20'
                        : comment.comment_type === 'QUESTION' && comment.is_resolved
                            ? 'bg-green-500/5 border border-green-500/20'
                            : 'bg-muted/30 border border-border/50'
                    }
                `}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {hasReplies && (
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-0.5 hover:bg-muted rounded transition-colors"
                            >
                                {isCollapsed ? (
                                    <ChevronRight className="w-3 h-3" />
                                ) : (
                                    <ChevronDown className="w-3 h-3" />
                                )}
                            </button>
                        )}
                        <CommentTypeIcon type={comment.comment_type} resolved={comment.is_resolved} />
                        <span className="text-xs font-semibold">{comment.user_name || '익명'}</span>
                        <span className="text-[10px] text-muted-foreground">
                            {getRelativeTime(comment.created_at)}
                        </span>
                        {isEdited && (
                            <span className="text-[10px] text-muted-foreground">(수정됨)</span>
                        )}
                        {comment.comment_type === 'QUESTION' && (
                            <span className={`
                                text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                ${comment.is_resolved ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}
                            `}>
                                {comment.is_resolved ? '해결됨' : '미해결'}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all rounded"
                        >
                            <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-10 py-1 min-w-[120px]"
                                >
                                    <button
                                        onClick={() => {
                                            onReply(comment.id, comment.comment_type === 'QUESTION' ? 'ANSWER' : 'COMMENT');
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2"
                                    >
                                        <Reply className="w-3 h-3" /> 답글
                                    </button>
                                    {isOwner && (
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3 h-3" /> 편집
                                        </button>
                                    )}
                                    {canResolve && (
                                        <button
                                            onClick={() => {
                                                onResolve(comment.id, true);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-green-600"
                                        >
                                            <Check className="w-3 h-3" /> 해결됨으로 표시
                                        </button>
                                    )}
                                    {comment.is_resolved && canResolve && (
                                        <button
                                            onClick={() => {
                                                onResolve(comment.id, false);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-amber-600"
                                        >
                                            <HelpCircle className="w-3 h-3" /> 미해결로 표시
                                        </button>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => {
                                                onDelete(comment.id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-destructive"
                                        >
                                            <Trash2 className="w-3 h-3" /> 삭제
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:border-primary"
                            rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(comment.content);
                                }}
                                className="px-3 py-1 text-xs bg-muted rounded-lg hover:bg-muted/80"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={!editContent.trim()}
                                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className={`text-sm text-foreground whitespace-pre-wrap ${isResolved ? 'line-through' : ''}`}>
                        {renderMentions(comment.content)}
                    </p>
                )}
            </motion.div>

            {!isCollapsed && hasReplies && (
                <div className="mt-2">
                    {comment.replies!.map(reply => (
                        <SingleComment
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            onResolve={onResolve}
                            onEdit={onEdit}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            {isCollapsed && hasReplies && (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="ml-6 text-xs text-muted-foreground hover:text-foreground"
                >
                    {comment.replies!.length}개의 답글 보기
                </button>
            )}
        </div>
    );
}

export function CommentSection({ projectId, endpointId, userId, userName }: CommentSectionProps) {
    const [comments, setComments] = useState<ApiComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [commentType, setCommentType] = useState<CommentType>('COMMENT');
    const [replyTo, setReplyTo] = useState<{ id: string; type: CommentType } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [endpointId]);

    async function loadComments() {
        setLoading(true);
        const data = await getCommentsByEndpoint(endpointId);
        setComments(data);
        setLoading(false);
    }

    async function handleSubmit() {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await createComment(
                projectId,
                endpointId,
                userId || null,
                newComment,
                replyTo ? replyTo.type : commentType,
                replyTo?.id
            );
            setNewComment("");
            setReplyTo(null);
            await loadComments();
        } catch (error) {
            console.error("Failed to create comment:", error);
        }
        setSubmitting(false);
    }

    async function handleDelete(commentId: string) {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        await deleteComment(commentId);
        await loadComments();
    }

    async function handleResolve(commentId: string, resolved: boolean) {
        await resolveQuestion(commentId, resolved);
        await loadComments();
    }

    async function handleEdit(commentId: string, content: string) {
        await updateComment(commentId, content);
        await loadComments();
    }

    const unresolvedQuestions = comments.filter(c => c.comment_type === 'QUESTION' && !c.is_resolved);

    return (
        <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {comments.length}개의 코멘트
                </span>
                {unresolvedQuestions.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                        <HelpCircle className="w-3 h-3" />
                        {unresolvedQuestions.length}개 미해결 질문
                    </span>
                )}
            </div>

            {/* Comment List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">로딩 중...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                        아직 코멘트가 없습니다.
                    </div>
                ) : (
                    comments.map(comment => (
                        <SingleComment
                            key={comment.id}
                            comment={comment}
                            onReply={(id, type) => setReplyTo({ id, type })}
                            onDelete={handleDelete}
                            onResolve={handleResolve}
                            onEdit={handleEdit}
                            currentUserId={userId}
                        />
                    ))
                )}
            </div>

            {/* Reply indicator */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-2 rounded-lg"
                    >
                        <Reply className="w-3 h-3" />
                        <span>{replyTo.type === 'ANSWER' ? '질문에 답변 작성 중...' : '답글 작성 중...'}</span>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                            취소
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Comment Form */}
            <div className="space-y-2">
                {!replyTo && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCommentType('COMMENT')}
                            className={`
                                px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all
                                ${commentType === 'COMMENT'
                                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <MessageCircle className="w-3 h-3" /> 코멘트
                        </button>
                        <button
                            onClick={() => setCommentType('QUESTION')}
                            className={`
                                px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all
                                ${commentType === 'QUESTION'
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <HelpCircle className="w-3 h-3" /> 질문
                        </button>
                    </div>
                )}
                <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    onSubmit={handleSubmit}
                    placeholder={
                        replyTo
                            ? replyTo.type === 'ANSWER' ? '답변을 작성하세요... @로 멘션' : '답글을 작성하세요... @로 멘션'
                            : commentType === 'QUESTION' ? '질문을 작성하세요... @로 멘션' : '코멘트를 작성하세요... @로 멘션'
                    }
                    rows={3}
                />
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                        {userName ? `${userName}(으)로 작성` : '익명으로 작성'}
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || submitting}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send className="w-3 h-3" />
                        {submitting ? '전송 중...' : '전송'}
                    </button>
                </div>
            </div>
        </div>
    );
}
