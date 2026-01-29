'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    Activity,
    Database,
    CheckCircle2,
    TrendingUp,
    Server,
    Layers,
    Zap,
    Clock,
    Plus,
    FileEdit,
    AlertCircle
} from 'lucide-react';
import { ApiEndpoint, ApiModel, EnvConfig } from '@/lib/api-types';
import { getActivityFeed, ActivityLog } from '@/app/actions/activity';
import { Tilt3DCard } from '@/components/ui/Tilt3DCard';

interface DashboardOverviewProps {
    endpoints: ApiEndpoint[];
    models: ApiModel[];
    environments: Record<string, EnvConfig>;
    testHistory?: any[];
    projectId?: string;
}

export function DashboardOverview({ endpoints, models, environments, testHistory = [], projectId }: DashboardOverviewProps) {
    // 최근 활동 상태 관리
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

    // Calculate metrics
    const totalEndpoints = endpoints.length;
    const totalModels = models.length;
    const activeEnvs = Object.keys(environments).filter(env => environments[env]?.baseUrl);

    // Method distribution
    const methodCounts = endpoints.reduce((acc, ep) => {
        acc[ep.method] = (acc[ep.method] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const methods = [
        { name: 'GET', count: methodCounts['GET'] || 0, color: 'bg-blue-500' },
        { name: 'POST', count: methodCounts['POST'] || 0, color: 'bg-emerald-500' },
        { name: 'PUT', count: methodCounts['PUT'] || 0, color: 'bg-amber-500' },
        { name: 'DELETE', count: methodCounts['DELETE'] || 0, color: 'bg-rose-500' },
    ];

    const totalMethods = methods.reduce((sum, m) => sum + m.count, 0);

    // 테스트 성공률 (실제 데이터 기반 계산)
    const testSuccessRate = testHistory.length > 0
        ? Math.round((testHistory.filter(t => t.success).length / testHistory.length) * 100)
        : 0;

    // 실제 활동 데이터 조회
    useEffect(() => {
        async function loadActivities() {
            if (!projectId) {
                setIsLoadingActivities(false);
                return;
            }

            try {
                const activities = await getActivityFeed(projectId, { limit: 4 });
                setRecentActivities(activities);
            } catch (error) {
                console.error('활동 데이터 로드 실패:', error);
            } finally {
                setIsLoadingActivities(false);
            }
        }

        loadActivities();
    }, [projectId]);

    // ActivityLog를 UI 형식으로 변환하는 헬퍼 함수
    const getActivityIcon = (activityType: string) => {
        if (activityType.includes('ADDED') || activityType === 'ENDPOINT_ADDED' || activityType === 'MODEL_ADDED') {
            return Plus;
        }
        if (activityType.includes('MODIFIED') || activityType.includes('UPDATE')) {
            return FileEdit;
        }
        if (activityType.includes('SUCCESS') || activityType.includes('RESOLVED')) {
            return CheckCircle2;
        }
        if (activityType.includes('FAILED') || activityType.includes('ERROR')) {
            return AlertCircle;
        }
        return Activity;
    };

    const getActivityColor = (activityType: string) => {
        if (activityType.includes('ADDED')) {
            return 'add';
        }
        if (activityType.includes('MODIFIED') || activityType.includes('UPDATE')) {
            return 'update';
        }
        if (activityType.includes('SUCCESS') || activityType.includes('RESOLVED')) {
            return 'test';
        }
        if (activityType.includes('FAILED') || activityType.includes('ERROR')) {
            return 'error';
        }
        return 'update';
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return `${diffDays}일 전`;
    };

    // 실제 활동 데이터를 UI 포맷으로 변환
    const recentActivity = recentActivities.map(activity => ({
        type: getActivityColor(activity.activity_type),
        text: activity.title,
        detail: activity.description,
        time: formatTimeAgo(activity.created_at),
        icon: getActivityIcon(activity.activity_type)
    }));

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 100,
                damping: 15
            }
        }
    };

    // Metric cards data (트렌드 데이터는 실제 엔드포인트/모델 수로 교체)
    const metricCards = [
        {
            title: '전체 엔드포인트',
            value: totalEndpoints,
            icon: Zap,
            color: 'blue',
            bgGradient: 'from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30',
            iconBg: 'bg-blue-100 dark:bg-blue-900/50',
            iconColor: 'text-blue-600 dark:text-blue-400',
            trend: `${totalEndpoints}개`,
            trendUp: null
        },
        {
            title: '데이터 모델',
            value: totalModels,
            icon: Database,
            color: 'purple',
            bgGradient: 'from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30',
            iconBg: 'bg-purple-100 dark:bg-purple-900/50',
            iconColor: 'text-purple-600 dark:text-purple-400',
            trend: `${totalModels}개`,
            trendUp: null
        },
        {
            title: '활성 환경',
            value: activeEnvs.length,
            icon: Server,
            color: 'emerald',
            bgGradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            trend: activeEnvs.length > 0 ? activeEnvs.join('/').toUpperCase() : '없음',
            trendUp: null
        },
        {
            title: '테스트 성공률',
            value: testHistory.length > 0 ? `${testSuccessRate}%` : '-',
            icon: CheckCircle2,
            color: 'amber',
            bgGradient: 'from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30',
            iconBg: 'bg-amber-100 dark:bg-amber-900/50',
            iconColor: 'text-amber-600 dark:text-amber-400',
            trend: testHistory.length > 0 ? `${testHistory.length}건 테스트` : '데이터 없음',
            trendUp: null
        }
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 mb-8"
        >
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {metricCards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        variants={cardVariants}
                        className="group relative hover:z-10"
                        whileHover={{ zIndex: 10 }}
                    >
                        <Tilt3DCard
                            variant="glass"
                            intensity="low"
                            glare
                            className="rounded-3xl"
                        >
                            {/* Background gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                                    </div>
                                    {card.trendUp !== null && (
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
                                            card.trendUp ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {card.trendUp && <TrendingUp className="w-3 h-3" />}
                                            {card.trend}
                                        </div>
                                    )}
                                    {card.trendUp === null && (
                                        <div className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            {card.trend}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                        {card.value}
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        {card.title}
                                    </div>
                                </div>
                            </div>
                        </Tilt3DCard>
                    </motion.div>
                ))}
            </div>

            {/* Method Distribution Bar */}
            <motion.div
                variants={cardVariants}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-slate-950/30"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            HTTP 메서드 분포
                        </h3>
                    </div>
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        총 {totalMethods}개
                    </div>
                </div>

                {/* Distribution Bar */}
                <div className="flex gap-1 h-12 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                    {methods.map((method, idx) => {
                        const percentage = totalMethods > 0 ? (method.count / totalMethods) * 100 : 0;
                        return percentage > 0 ? (
                            <motion.div
                                key={method.name}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                                className={`${method.color} flex items-center justify-center relative group/bar`}
                            >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover/bar:opacity-20 transition-opacity" />
                                <span className="text-xs font-black text-white drop-shadow-sm">
                                    {method.name} {method.count}
                                </span>
                            </motion.div>
                        ) : null;
                    })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 flex-wrap">
                    {methods.map(method => (
                        <div key={method.name} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${method.color}`} />
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                {method.name}: {method.count}개
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Recent Activity Timeline */}
            <motion.div
                variants={cardVariants}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-slate-950/30"
            >
                <div className="flex items-center gap-2 mb-5">
                    <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        최근 활동
                    </h3>
                </div>

                <div className="space-y-3">
                    {isLoadingActivities ? (
                        // 로딩 상태
                        <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                            <div className="animate-spin w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400 rounded-full"></div>
                        </div>
                    ) : recentActivity.length > 0 ? (
                        // 실제 활동 데이터 표시
                        recentActivity.map((activity, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/activity cursor-pointer"
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                    activity.type === 'add' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' :
                                    activity.type === 'update' ? 'bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' :
                                    activity.type === 'test' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' :
                                    'bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                                }`}>
                                    <activity.icon className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                            {activity.text}
                                        </p>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {activity.time}
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                        {activity.detail}
                                    </p>
                                </div>

                                {/* Status dot */}
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                    activity.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'
                                } opacity-0 group-hover/activity:opacity-100 transition-opacity`} />
                            </motion.div>
                        ))
                    ) : (
                        // 데이터가 없을 때
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                            <Activity className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-bold">최근 활동이 없습니다</p>
                            <p className="text-xs mt-1">엔드포인트 추가나 테스트를 시작하면 활동 내역이 표시됩니다</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Test Success Ring (Optional - can be added later) */}
            <motion.div
                variants={cardVariants}
                className="hidden xl:block"
            >
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 blur-[120px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 blur-[120px] opacity-10" />

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                    시스템 상태
                                </span>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight">
                                모든 시스템 정상 가동 중
                            </h4>
                            <p className="text-sm font-bold text-slate-400">
                                {totalEndpoints}개의 엔드포인트가 모니터링되고 있습니다
                            </p>
                        </div>

                        {/* Success rate ring */}
                        <div className="relative w-32 h-32">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-slate-700"
                                />
                                <motion.circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    className="text-emerald-400"
                                    initial={{ strokeDasharray: '0 352' }}
                                    animate={{ strokeDasharray: `${(testSuccessRate / 100) * 352} 352` }}
                                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-white">
                                        {testSuccessRate}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                                        %
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
