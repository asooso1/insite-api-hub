'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
    GitBranch, AlertTriangle, Loader2, RefreshCw,
    Database, Server, TrendingUp, AlertCircle
} from 'lucide-react';
import { getDependencyGraph, getModelImpact, getDependencyStats } from '@/app/actions/dependency-graph';
import { ImpactAnalysis } from '@/lib/dependency-graph';

// React Flow는 클라이언트 전용이므로 dynamic import
const DependencyGraphView = dynamic(
    () => import('./DependencyGraphView').then(mod => mod.DependencyGraphView),
    {
        ssr: false,
        loading: () => (
            <div className="h-[600px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }
);

interface DependencyGraphPanelProps {
    projectId: string;
}

export function DependencyGraphPanel({ projectId }: DependencyGraphPanelProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<{
        nodes: any[];
        edges: any[];
        stats: any;
        circularDeps: string[][];
    } | null>(null);
    const [quickStats, setQuickStats] = useState<{
        totalModels: number;
        totalEndpoints: number;
        totalRelations: number;
        circularDeps: number;
        isolatedModels: number;
        mostReferencedModels: { name: string; referenceCount: number }[];
    } | null>(null);

    // 그래프 데이터 로드
    const loadGraphData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [graphResult, statsResult] = await Promise.all([
                getDependencyGraph(projectId),
                getDependencyStats(projectId)
            ]);

            setGraphData({
                nodes: graphResult.reactFlow.nodes,
                edges: graphResult.reactFlow.edges,
                stats: graphResult.graph.stats,
                circularDeps: graphResult.circularDeps
            });
            setQuickStats(statsResult);
        } catch (err) {
            console.error('Failed to load dependency graph:', err);
            setError('의존성 그래프를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadGraphData();
    }, [loadGraphData]);

    // 영향 분석 핸들러
    const handleAnalyzeImpact = useCallback(async (modelName: string): Promise<ImpactAnalysis> => {
        return await getModelImpact(projectId, modelName);
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* 통계 카드 스켈레톤 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 animate-pulse"
                        >
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
                {/* 그래프 스켈레톤 */}
                <div className="h-[600px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                        <h3 className="font-medium text-red-700 dark:text-red-300">{error}</h3>
                        <button
                            onClick={loadGraphData}
                            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            다시 시도
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!graphData || graphData.nodes.length === 0) {
        return (
            <div className="p-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    의존성 데이터 없음
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    프로젝트에 API 모델이나 엔드포인트가 없습니다.<br />
                    Git 저장소를 동기화하여 API를 가져오세요.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800"
                >
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
                        <Database className="w-4 h-4" />
                        <span className="text-sm font-medium">모델</span>
                    </div>
                    <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                        {quickStats?.totalModels || 0}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800"
                >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                        <Server className="w-4 h-4" />
                        <span className="text-sm font-medium">엔드포인트</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {quickStats?.totalEndpoints || 0}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <GitBranch className="w-4 h-4" />
                        <span className="text-sm font-medium">관계</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {quickStats?.totalRelations || 0}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`p-4 rounded-xl border ${
                        (quickStats?.circularDeps || 0) > 0
                            ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-200 dark:border-red-800'
                            : 'bg-gradient-to-br from-green-500/10 to-lime-500/10 border-green-200 dark:border-green-800'
                    }`}
                >
                    <div className={`flex items-center gap-2 mb-1 ${
                        (quickStats?.circularDeps || 0) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}>
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">순환 참조</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                        (quickStats?.circularDeps || 0) > 0
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-green-700 dark:text-green-300'
                    }`}>
                        {quickStats?.circularDeps || 0}
                    </p>
                </motion.div>
            </div>

            {/* 가장 많이 참조되는 모델 */}
            {quickStats?.mostReferencedModels && quickStats.mostReferencedModels.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <h3 className="font-medium text-gray-700 dark:text-gray-300">
                            핵심 모델 (가장 많이 참조됨)
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickStats.mostReferencedModels.map((model, i) => (
                            <div
                                key={model.name}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                    i === 0
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {model.name}
                                <span className="ml-1.5 text-xs opacity-70">
                                    ({model.referenceCount})
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 그래프 뷰 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-violet-500" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            의존성 그래프
                        </h2>
                    </div>
                    <button
                        onClick={loadGraphData}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="새로고침"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <DependencyGraphView
                    projectId={projectId}
                    initialNodes={graphData.nodes}
                    initialEdges={graphData.edges}
                    stats={graphData.stats}
                    circularDeps={graphData.circularDeps}
                    onAnalyzeImpact={handleAnalyzeImpact}
                />
            </motion.div>

            {/* 사용 가이드 */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    사용 가이드
                </h4>
                <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• 모델 노드를 클릭하면 해당 모델 변경 시 영향받는 범위를 분석합니다</li>
                    <li>• 마우스 휠로 확대/축소, 드래그로 이동할 수 있습니다</li>
                    <li>• 검색창에서 특정 모델이나 엔드포인트를 찾을 수 있습니다</li>
                    <li>• 빨간색으로 표시된 노드는 영향을 받는 항목입니다</li>
                </ul>
            </div>
        </div>
    );
}

export default DependencyGraphPanel;
