'use client';

import { motion } from 'framer-motion';
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

interface DashboardOverviewProps {
    endpoints: ApiEndpoint[];
    models: ApiModel[];
    environments: Record<string, EnvConfig>;
    testHistory?: any[];
}

export function DashboardOverview({ endpoints, models, environments, testHistory = [] }: DashboardOverviewProps) {
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

    // Test success rate (mock data for now)
    const testSuccessRate = testHistory.length > 0
        ? Math.round((testHistory.filter(t => t.success).length / testHistory.length) * 100)
        : 94;

    // Recent activity (mock data)
    const recentActivity = [
        { type: 'add', text: '새 엔드포인트 추가', detail: '/api/users/profile', time: '2분 전', icon: Plus },
        { type: 'update', text: '모델 업데이트', detail: 'UserDTO', time: '15분 전', icon: FileEdit },
        { type: 'test', text: '테스트 성공', detail: '/api/orders', time: '1시간 전', icon: CheckCircle2 },
        { type: 'error', text: '테스트 실패', detail: '/api/payments', time: '2시간 전', icon: AlertCircle },
    ].slice(0, 4);

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

    // Metric cards data
    const metricCards = [
        {
            title: '전체 엔드포인트',
            value: totalEndpoints,
            icon: Zap,
            color: 'blue',
            bgGradient: 'from-blue-50 to-blue-100/50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            trend: '+12%',
            trendUp: true
        },
        {
            title: '데이터 모델',
            value: totalModels,
            icon: Database,
            color: 'purple',
            bgGradient: 'from-purple-50 to-purple-100/50',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            trend: '+8%',
            trendUp: true
        },
        {
            title: '활성 환경',
            value: activeEnvs.length,
            icon: Server,
            color: 'emerald',
            bgGradient: 'from-emerald-50 to-emerald-100/50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            trend: 'DEV/STG/PRD',
            trendUp: null
        },
        {
            title: '테스트 성공률',
            value: `${testSuccessRate}%`,
            icon: CheckCircle2,
            color: 'amber',
            bgGradient: 'from-amber-50 to-amber-100/50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            trend: '안정적',
            trendUp: true
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
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="group"
                    >
                        <div className={`relative bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-xl ${
                            card.color === 'blue' ? 'hover:shadow-blue-100/20 hover:border-blue-200' :
                            card.color === 'purple' ? 'hover:shadow-purple-100/20 hover:border-purple-200' :
                            card.color === 'emerald' ? 'hover:shadow-emerald-100/20 hover:border-emerald-200' :
                            'hover:shadow-amber-100/20 hover:border-amber-200'
                        }`}>
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
                                            card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                        }`}>
                                            {card.trendUp && <TrendingUp className="w-3 h-3" />}
                                            {card.trend}
                                        </div>
                                    )}
                                    {card.trendUp === null && (
                                        <div className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-50 text-slate-500">
                                            {card.trend}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="text-4xl font-black text-slate-900 tracking-tight">
                                        {card.value}
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        {card.title}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Method Distribution Bar */}
            <motion.div
                variants={cardVariants}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-slate-600" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                            HTTP 메서드 분포
                        </h3>
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                        총 {totalMethods}개
                    </div>
                </div>

                {/* Distribution Bar */}
                <div className="flex gap-1 h-12 rounded-2xl overflow-hidden bg-slate-50">
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
                            <span className="text-[11px] font-bold text-slate-600">
                                {method.name}: {method.count}개
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Recent Activity Timeline */}
            <motion.div
                variants={cardVariants}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-5">
                    <Activity className="w-5 h-5 text-slate-600" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                        최근 활동
                    </h3>
                </div>

                <div className="space-y-3">
                    {recentActivity.map((activity, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group/activity cursor-pointer"
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                activity.type === 'add' ? 'bg-blue-50 text-blue-600' :
                                activity.type === 'update' ? 'bg-purple-50 text-purple-600' :
                                activity.type === 'test' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-rose-50 text-rose-600'
                            }`}>
                                <activity.icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-black text-slate-800">
                                        {activity.text}
                                    </p>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        {activity.time}
                                    </div>
                                </div>
                                <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                                    {activity.detail}
                                </p>
                            </div>

                            {/* Status dot */}
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                                activity.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'
                            } opacity-0 group-hover/activity:opacity-100 transition-opacity`} />
                        </motion.div>
                    ))}
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
