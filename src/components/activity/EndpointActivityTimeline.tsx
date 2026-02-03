'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { ActivityLog, getEndpointActivity } from '@/app/actions/activity';
import { getActivityIcon, getActivityColor, getActivityTypeLabel } from '@/lib/activity-utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EndpointActivityTimelineProps {
    projectId: string;
    endpointId: string;
    limit?: number;
}

export function EndpointActivityTimeline({
    projectId,
    endpointId,
    limit = 10
}: EndpointActivityTimelineProps) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, [projectId, endpointId]);

    async function loadActivities() {
        setLoading(true);
        try {
            const data = await getEndpointActivity(projectId, endpointId, limit);
            setActivities(data);
        } catch (error) {
            console.error('Failed to load endpoint activities:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-xs">활동 로그를 불러오는 중...</span>
                </div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <Activity className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">아직 활동 내역이 없습니다.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    이 엔드포인트에서 발생한 활동이 여기에 표시됩니다.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    최근 활동 ({activities.length}건)
                </h4>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

                {/* Activity items */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {activities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ActivityTimelineItem activity={activity} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function ActivityTimelineItem({ activity }: { activity: ActivityLog }) {
    const Icon = getActivityIcon(activity.activity_type);
    const colors = getActivityColor(activity.activity_type);

    return (
        <div className="flex gap-3 relative">
            {/* Icon badge */}
            <div
                className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10
                    ${colors.bg} ${colors.text} border ${colors.border}
                    shadow-sm
                `}
            >
                <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-6">
                <div className="bg-card/50 border border-border/50 rounded-xl p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-foreground truncate">
                                {activity.title}
                            </h5>
                            {activity.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {activity.description}
                                </p>
                            )}
                        </div>
                        <span
                            className={`
                                text-[10px] font-bold uppercase tracking-wider shrink-0
                                px-2 py-0.5 rounded ${colors.bg} ${colors.text}
                            `}
                        >
                            {getActivityTypeLabel(activity.activity_type)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        {activity.user_name && (
                            <>
                                <span className="font-medium">{activity.user_name}</span>
                                <span>•</span>
                            </>
                        )}
                        <span suppressHydrationWarning>
                            {formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: ko
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
