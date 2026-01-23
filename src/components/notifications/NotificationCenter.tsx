'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    MessageCircle,
    AtSign,
    CheckCircle2,
    AlertTriangle,
    GitBranch,
    TestTube2,
    X,
    Check,
    Trash2,
    ExternalLink
} from 'lucide-react';
import {
    Notification,
    NotificationType,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface NotificationCenterProps {
    userId: string;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
    MENTION: <AtSign className="w-4 h-4 text-blue-500" />,
    COMMENT: <MessageCircle className="w-4 h-4 text-slate-500" />,
    REPLY: <MessageCircle className="w-4 h-4 text-green-500" />,
    QUESTION_RESOLVED: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    API_CHANGE: <GitBranch className="w-4 h-4 text-purple-500" />,
    TEST_FAILED: <AlertTriangle className="w-4 h-4 text-red-500" />,
    WEBHOOK_EVENT: <TestTube2 className="w-4 h-4 text-orange-500" />
};

const notificationColors: Record<NotificationType, string> = {
    MENTION: 'bg-blue-50 border-blue-200',
    COMMENT: 'bg-slate-50 border-slate-200',
    REPLY: 'bg-green-50 border-green-200',
    QUESTION_RESOLVED: 'bg-emerald-50 border-emerald-200',
    API_CHANGE: 'bg-purple-50 border-purple-200',
    TEST_FAILED: 'bg-red-50 border-red-200',
    WEBHOOK_EVENT: 'bg-orange-50 border-orange-200'
};

export function NotificationCenter({ userId }: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        const [notifs, count] = await Promise.all([
            getNotifications(userId, { unreadOnly: filter === 'unread' }),
            getUnreadCount(userId)
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
        setLoading(false);
    }, [userId, filter]);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead(userId);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        const notification = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600" />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-[380px] max-h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-black text-slate-900">알림</h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="text-[10px] font-bold text-blue-600 hover:underline"
                                            >
                                                모두 읽음
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-1 hover:bg-slate-100 rounded-lg"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            filter === 'all'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        전체
                                    </button>
                                    <button
                                        onClick={() => setFilter('unread')}
                                        className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                                            filter === 'unread'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        안읽음
                                        {unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[350px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center text-sm text-slate-400">
                                        로딩 중...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">
                                            {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map(notification => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={handleMarkAsRead}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete
}: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const [isHovered, setIsHovered] = useState(false);

    const content = (
        <div
            className={`
                p-3 transition-all cursor-pointer group
                ${notification.is_read ? 'bg-white' : 'bg-blue-50/50'}
                hover:bg-slate-50
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${notificationColors[notification.type]}
                `}>
                    {notificationIcons[notification.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${notification.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                            {notification.title}
                        </p>
                        {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ko })}
                    </p>
                </div>

                {/* Actions */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                            className="flex items-center gap-1"
                        >
                            {!notification.is_read && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAsRead(notification.id);
                                    }}
                                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
                                    title="읽음으로 표시"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(notification.id);
                                }}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500"
                                title="삭제"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    if (notification.link) {
        return (
            <Link href={notification.link}>
                {content}
            </Link>
        );
    }

    return content;
}

// Mini version for header
export function NotificationBell({ userId }: { userId: string }) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            const count = await getUnreadCount(userId);
            setUnreadCount(count);
        };
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    return (
        <div className="relative">
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </div>
            )}
        </div>
    );
}
