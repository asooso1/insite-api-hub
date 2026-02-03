'use client';

import { useState, useEffect } from 'react';
import {
    Filter,
    AlertCircle,
    MessageSquare,
    TrendingUp,
    CheckCircle,
    Clock,
    FileEdit,
    Archive,
    Users,
    BarChart3,
    ArrowUpDown,
    LucideIcon
} from 'lucide-react';
import {
    getMyOwnedEndpoints,
    getMyStatusStats,
    getMemberEndpointStats,
    getFilteredMyEndpoints,
    Endpoint,
    MemberStats
} from '@/app/actions/team-dashboard';
import { EndpointStatus } from '@/app/actions/endpoint-status';

interface MyApiDashboardProps {
    userId: string;
    projectId?: string;
}

type SortOption = 'recent' | 'name';

const STATUS_CONFIG: Record<EndpointStatus, { label: string; icon: React.ReactElement; color: string }> = {
    draft: { label: '초안', icon: <FileEdit className="w-4 h-4" />, color: 'text-slate-500' },
    review: { label: '검토 중', icon: <Clock className="w-4 h-4" />, color: 'text-amber-500' },
    approved: { label: '승인됨', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' },
    deprecated: { label: '폐기됨', icon: <Archive className="w-4 h-4" />, color: 'text-rose-500' }
};

export function MyApiDashboard({ userId, projectId }: MyApiDashboardProps) {
    const [myEndpoints, setMyEndpoints] = useState<Endpoint[]>([]);
    const [statusStats, setStatusStats] = useState<Record<EndpointStatus, number>>({
        draft: 0,
        review: 0,
        approved: 0,
        deprecated: 0
    });
    const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
    const [loading, setLoading] = useState(true);

    // 필터 상태
    const [selectedStatus, setSelectedStatus] = useState<EndpointStatus | null>(null);
    const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');

    // 데이터 로드
    useEffect(() => {
        loadData();
    }, [userId, projectId, selectedStatus, showUnresolvedOnly, sortBy]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 필터링된 엔드포인트 목록 조회
            const endpoints = await getFilteredMyEndpoints(userId, {
                projectId,
                status: selectedStatus || undefined,
                hasUnresolvedQuestions: showUnresolvedOnly,
                sortBy
            });
            setMyEndpoints(endpoints);

            // 상태별 통계 조회
            const stats = await getMyStatusStats(userId, projectId);
            setStatusStats(stats);

            // 멤버별 통계 조회 (프로젝트가 선택된 경우에만)
            if (projectId) {
                const members = await getMemberEndpointStats(projectId);
                setMemberStats(members);
            }
        } catch (error) {
            console.error('❌ 대시보드 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalEndpoints = Object.values(statusStats).reduce((sum, count) => sum + count, 0);
    const unresolvedCount = myEndpoints.filter(e => (e.unresolved_question_count ?? 0) > 0).length;

    return (
        <div className="space-y-6">
            {/* 헤더 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 총 담당 API */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-2xl font-black text-blue-900 dark:text-blue-100">{totalEndpoints}</span>
                    </div>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">총 담당 API</p>
                </div>

                {/* 상태별 카드 */}
                {(['draft', 'review', 'approved', 'deprecated'] as EndpointStatus[]).map(status => (
                    <div
                        key={status}
                        className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:shadow-lg ${selectedStatus === status ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className={STATUS_CONFIG[status].color}>
                                {STATUS_CONFIG[status].icon}
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {statusStats[status]}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {STATUS_CONFIG[status].label}
                        </p>
                    </div>
                ))}
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">필터</span>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showUnresolvedOnly}
                            onChange={(e) => setShowUnresolvedOnly(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            미해결 질문만 보기
                        </span>
                        {unresolvedCount > 0 && (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black">
                                {unresolvedCount}
                            </span>
                        )}
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="recent">최근 수정순</option>
                        <option value="name">이름순</option>
                    </select>
                </div>
            </div>

            {/* 내 담당 API 목록 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-tight">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping" />
                        내 담당 API 목록
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {myEndpoints.length}개의 엔드포인트
                    </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                            로딩 중...
                        </div>
                    ) : myEndpoints.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                            담당 중인 API가 없습니다.
                        </div>
                    ) : (
                        myEndpoints.map((endpoint) => (
                            <div
                                key={endpoint.id}
                                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                endpoint.method === 'GET'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : endpoint.method === 'POST'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                    : endpoint.method === 'PUT'
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                            }`}>
                                                {endpoint.method}
                                            </span>
                                            <code className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {endpoint.path}
                                            </code>
                                        </div>

                                        {endpoint.summary && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                {endpoint.summary}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <div className={STATUS_CONFIG[endpoint.status].color}>
                                                    {STATUS_CONFIG[endpoint.status].icon}
                                                </div>
                                                {STATUS_CONFIG[endpoint.status].label}
                                            </span>

                                            {endpoint.class_name && (
                                                <span className="font-mono">
                                                    {endpoint.class_name}.{endpoint.method_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {/* 미해결 질문 배지 */}
                                        {(endpoint.unresolved_question_count ?? 0) > 0 && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                                <MessageSquare className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                                                    질문 {endpoint.unresolved_question_count}
                                                </span>
                                            </div>
                                        )}

                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                            {new Date(endpoint.synced_at).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 팀 통계 섹션 (프로젝트 선택 시에만 표시) */}
            {projectId && memberStats.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-tight">
                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            팀 통계
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            프로젝트 멤버별 담당 API 현황
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {memberStats.map((member) => (
                                <div
                                    key={member.user_id}
                                    className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                            {member.user_name}
                                        </span>
                                        <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                                            {member.total_endpoints}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {(['draft', 'review', 'approved', 'deprecated'] as EndpointStatus[]).map(status => (
                                            <div key={status} className="text-center">
                                                <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                                                    {member[`${status}_count`]}
                                                </div>
                                                <div className={`text-[9px] font-medium ${STATUS_CONFIG[status].color}`}>
                                                    {STATUS_CONFIG[status].label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
