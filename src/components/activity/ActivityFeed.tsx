'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    MessageCircle,
    HelpCircle,
    CheckCircle2,
    Plus,
    Pencil,
    Trash2,
    GitBranch,
    TestTube2,
    Webhook,
    UserPlus,
    UserMinus,
    Filter,
    RefreshCw
} from 'lucide-react';
import {
    ActivityLog,
    ActivityType,
    getActivityFeed,
    getActivityStats,
    getRecentContributors
} from '@/app/actions/activity';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ActivityFeedProps {
    projectId: string;
    limit?: number;
    showStats?: boolean;
    showContributors?: boolean;
}

const activityIcons: Record<ActivityType, React.ReactNode> = {
    COMMENT_CREATED: <MessageCircle className="w-4 h-4" />,
    COMMENT_DELETED: <Trash2 className="w-4 h-4" />,
    QUESTION_ASKED: <HelpCircle className="w-4 h-4" />,
    QUESTION_RESOLVED: <CheckCircle2 className="w-4 h-4" />,
    ENDPOINT_ADDED: <Plus className="w-4 h-4" />,
    ENDPOINT_MODIFIED: <Pencil className="w-4 h-4" />,
    ENDPOINT_DELETED: <Trash2 className="w-4 h-4" />,
    MODEL_ADDED: <Plus className="w-4 h-4" />,
    MODEL_MODIFIED: <Pencil className="w-4 h-4" />,
    MODEL_DELETED: <Trash2 className="w-4 h-4" />,
    VERSION_CREATED: <GitBranch className="w-4 h-4" />,
    TEST_EXECUTED: <TestTube2 className="w-4 h-4" />,
    TEST_FAILED: <TestTube2 className="w-4 h-4" />,
    WEBHOOK_RECEIVED: <Webhook className="w-4 h-4" />,
    USER_JOINED: <UserPlus className="w-4 h-4" />,
    USER_LEFT: <UserMinus className="w-4 h-4" />
};

const activityColors: Record<ActivityType, { bg: string; icon: string; border: string }> = {
    COMMENT_CREATED: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
    COMMENT_DELETED: { bg: 'bg-slate-50', icon: 'text-slate-500', border: 'border-slate-200' },
    QUESTION_ASKED: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' },
    QUESTION_RESOLVED: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-200' },
    ENDPOINT_ADDED: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
    ENDPOINT_MODIFIED: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' },
    ENDPOINT_DELETED: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
    MODEL_ADDED: { bg: 'bg-cyan-50', icon: 'text-cyan-500', border: 'border-cyan-200' },
    MODEL_MODIFIED: { bg: 'bg-indigo-50', icon: 'text-indigo-500', border: 'border-indigo-200' },
    MODEL_DELETED: { bg: 'bg-rose-50', icon: 'text-rose-500', border: 'border-rose-200' },
    VERSION_CREATED: { bg: 'bg-violet-50', icon: 'text-violet-500', border: 'border-violet-200' },
    TEST_EXECUTED: { bg: 'bg-teal-50', icon: 'text-teal-500', border: 'border-teal-200' },
    TEST_FAILED: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
    WEBHOOK_RECEIVED: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-200' },
    USER_JOINED: { bg: 'bg-lime-50', icon: 'text-lime-500', border: 'border-lime-200' },
    USER_LEFT: { bg: 'bg-stone-50', icon: 'text-stone-500', border: 'border-stone-200' }
};

type FilterType = 'all' | 'comments' | 'changes' | 'tests';

export function ActivityFeed({
    projectId,
    limit = 20,
    showStats = false,
    showContributors = false
}: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [contributors, setContributors] = useState<{ id: string; name: string; email: string; activity_count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const filterTypeMap: Record<FilterType, ActivityType[] | undefined> = {
        all: undefined,
        comments: ['COMMENT_CREATED', 'COMMENT_DELETED', 'QUESTION_ASKED', 'QUESTION_RESOLVED'],
        changes: ['ENDPOINT_ADDED', 'ENDPOINT_MODIFIED', 'ENDPOINT_DELETED', 'MODEL_ADDED', 'MODEL_MODIFIED', 'MODEL_DELETED', 'VERSION_CREATED'],
        tests: ['TEST_EXECUTED', 'TEST_FAILED']
    };

    useEffect(() => {
        loadActivities();
    }, [projectId, filter]);

    useEffect(() => {
        if (showStats) loadStats();
        if (showContributors) loadContributors();
    }, [projectId, showStats, showContributors]);

    async function loadActivities(append = false) {
        setLoading(true);
        const newOffset = append ? offset : 0;
        const data = await getActivityFeed(projectId, {
            limit,
            offset: newOffset,
            types: filterTypeMap[filter]
        });

        if (append) {
            setActivities(prev => [...prev, ...data]);
        } else {
            setActivities(data);
        }

        setHasMore(data.length === limit);
        setOffset(newOffset + data.length);
        setLoading(false);
    }

    async function loadStats() {
        const data = await getActivityStats(projectId);
        setStats(data);
    }

    async function loadContributors() {
        const data = await getRecentContributors(projectId);
        setContributors(data);
    }

    function loadMore() {
        loadActivities(true);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-black text-slate-900">활동 피드</h3>
                </div>
                <button
                    onClick={() => loadActivities()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Cards */}
            {showStats && Object.keys(stats).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="댓글"
                        value={(stats.COMMENT_CREATED || 0) + (stats.QUESTION_ASKED || 0)}
                        icon={<MessageCircle className="w-4 h-4" />}
                        color="blue"
                    />
                    <StatCard
                        label="API 변경"
                        value={(stats.ENDPOINT_ADDED || 0) + (stats.ENDPOINT_MODIFIED || 0)}
                        icon={<Pencil className="w-4 h-4" />}
                        color="purple"
                    />
                    <StatCard
                        label="테스트"
                        value={(stats.TEST_EXECUTED || 0)}
                        icon={<TestTube2 className="w-4 h-4" />}
                        color="teal"
                    />
                    <StatCard
                        label="버전"
                        value={stats.VERSION_CREATED || 0}
                        icon={<GitBranch className="w-4 h-4" />}
                        color="violet"
                    />
                </div>
            )}

            {/* Contributors */}
            {showContributors && contributors.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        최근 기여자
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {contributors.map(c => (
                            <div
                                key={c.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                    {c.name?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs font-medium text-slate-700">{c.name}</span>
                                <span className="text-[10px] text-slate-400">
                                    {c.activity_count}회
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(['all', 'comments', 'changes', 'tests'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                            filter === f
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {f === 'all' && '전체'}
                        {f === 'comments' && '댓글'}
                        {f === 'changes' && '변경'}
                        {f === 'tests' && '테스트'}
                    </button>
                ))}
            </div>

            {/* Activity List */}
            <div className="space-y-3">
                {loading && activities.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">로딩 중...</div>
                ) : activities.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">활동 내역이 없습니다</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {activities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <ActivityItem activity={activity} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Load More */}
                {hasMore && !loading && activities.length > 0 && (
                    <button
                        onClick={loadMore}
                        className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        더 보기
                    </button>
                )}
            </div>
        </div>
    );
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
    const colors = activityColors[activity.activity_type];

    return (
        <div className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.icon} border ${colors.border}`}>
                {activityIcons[activity.activity_type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{activity.title}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    {activity.user_name && (
                        <span className="font-medium">{activity.user_name}</span>
                    )}
                    <span>•</span>
                    <span>
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ko })}
                    </span>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    color
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'purple' | 'teal' | 'violet';
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        teal: 'bg-teal-50 text-teal-600 border-teal-200',
        violet: 'bg-violet-50 text-violet-600 border-violet-200'
    };

    return (
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
            </div>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}

// Compact version for sidebar
export function ActivityFeedCompact({ projectId }: { projectId: string }) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getActivityFeed(projectId, { limit: 5 });
            setActivities(data);
            setLoading(false);
        }
        load();
    }, [projectId]);

    if (loading) {
        return <div className="text-xs text-slate-400 p-4">로딩 중...</div>;
    }

    return (
        <div className="space-y-2">
            {activities.map(activity => {
                const colors = activityColors[activity.activity_type];
                return (
                    <div key={activity.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colors.bg} ${colors.icon}`}>
                            {activityIcons[activity.activity_type]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-slate-700 truncate">{activity.title}</p>
                            <p className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ko })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
