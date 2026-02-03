'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
    Panel,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch, AlertTriangle, Info, Maximize2, Minimize2,
    Search, RefreshCw
} from 'lucide-react';
import { nodeTypes } from './CustomNodes';
import { ImpactAnalysis } from '@/lib/dependency-graph';

// 노드 데이터 타입
interface NodeData {
    label?: string;
    name?: string;
    fieldCount?: number;
    method?: string;
    path?: string;
    isAffected?: boolean;
    affectedBy?: string[];
}

interface DependencyGraphViewProps {
    projectId: string;
    initialNodes: Node[];
    initialEdges: Edge[];
    stats: {
        totalModels: number;
        totalEndpoints: number;
        totalEdges: number;
        isolatedNodes: number;
    };
    circularDeps: string[][];
    onAnalyzeImpact?: (modelName: string) => Promise<ImpactAnalysis>;
}

export function DependencyGraphView({
    projectId,
    initialNodes,
    initialEdges,
    stats,
    circularDeps,
    onAnalyzeImpact
}: DependencyGraphViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'models' | 'endpoints'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // 노드 데이터 접근 헬퍼
    const getNodeData = (node: Node): NodeData => node.data as NodeData;

    // 필터링된 노드
    const filteredNodes = useMemo(() => {
        let result = nodes;

        // 타입 필터
        if (filterType === 'models') {
            result = result.filter(n => n.type === 'modelNode');
        } else if (filterType === 'endpoints') {
            result = result.filter(n => n.type === 'endpointNode');
        }

        // 검색 필터
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(n => {
                const data = getNodeData(n);
                return (
                    data.name?.toLowerCase().includes(query) ||
                    data.label?.toLowerCase().includes(query) ||
                    data.path?.toLowerCase().includes(query)
                );
            });
        }

        return result;
    }, [nodes, filterType, searchQuery]);

    // 필터링된 엣지 (보이는 노드와 연결된 것만)
    const filteredEdges = useMemo(() => {
        const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
        return edges.filter(e =>
            visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
        );
    }, [edges, filteredNodes]);

    // 노드 선택 핸들러
    const onNodeClick = useCallback(async (_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        const nodeData = getNodeData(node);

        // 모델 노드 선택 시 영향 분석
        if (node.type === 'modelNode' && onAnalyzeImpact && nodeData.name) {
            setIsAnalyzing(true);
            try {
                const analysis = await onAnalyzeImpact(nodeData.name);
                setImpactAnalysis(analysis);

                // 영향받는 노드 하이라이트
                setNodes(nds =>
                    nds.map(n => {
                        const nData = getNodeData(n);
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                isAffected:
                                    (nData.name && analysis.affectedModels.includes(nData.name)) ||
                                    (nData.label && analysis.affectedEndpoints.some(ep => nData.label?.includes(ep)))
                            }
                        };
                    })
                );
            } catch (error) {
                console.error('Impact analysis failed:', error);
            } finally {
                setIsAnalyzing(false);
            }
        }
    }, [onAnalyzeImpact, setNodes]);

    // 영향 분석 초기화
    const clearImpactAnalysis = useCallback(() => {
        setSelectedNode(null);
        setImpactAnalysis(null);
        setNodes(nds =>
            nds.map(n => ({
                ...n,
                data: { ...n.data, isAffected: false }
            }))
        );
    }, [setNodes]);

    // 연결 핸들러 (드래그로 새 연결 생성 - 읽기 전용이므로 비활성화)
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // 영향 수준에 따른 색상
    const getImpactColor = (level: string) => {
        switch (level) {
            case 'critical': return 'text-red-500 bg-red-500/10';
            case 'high': return 'text-orange-500 bg-orange-500/10';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10';
            case 'low': return 'text-green-500 bg-green-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    // 선택된 노드의 데이터
    const selectedNodeData = selectedNode ? getNodeData(selectedNode) : null;

    return (
        <div className={`
            relative
            ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'h-[600px] rounded-xl overflow-hidden'}
        `}>
            <ReactFlow
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={clearImpactAnalysis}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="#9ca3af"
                    className="opacity-30"
                />
                <Controls
                    showZoom={true}
                    showFitView={true}
                    showInteractive={false}
                    className="!bg-white/80 dark:!bg-gray-800/80 !border-gray-200 dark:!border-gray-700 !rounded-lg !shadow-lg"
                />
                <MiniMap
                    nodeColor={(node) => {
                        const data = getNodeData(node);
                        if (data.isAffected) return '#ef4444';
                        return node.type === 'modelNode' ? '#8b5cf6' : '#10b981';
                    }}
                    className="!bg-white/80 dark:!bg-gray-800/80 !border-gray-200 dark:!border-gray-700 !rounded-lg"
                />

                {/* 상단 통계 패널 */}
                <Panel position="top-left" className="!m-3">
                    <div className="flex gap-2 p-3 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10">
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                모델 {stats.totalModels}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                엔드포인트 {stats.totalEndpoints}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10">
                            <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                관계 {stats.totalEdges}
                            </span>
                        </div>
                        {circularDeps.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    순환참조 {circularDeps.length}
                                </span>
                            </div>
                        )}
                    </div>
                </Panel>

                {/* 검색/필터 패널 */}
                <Panel position="top-right" className="!m-3">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 w-48 text-sm rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                            className="px-3 py-2 text-sm rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="all">전체</option>
                            <option value="models">모델만</option>
                            <option value="endpoints">엔드포인트만</option>
                        </select>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </Panel>

                {/* 범례 */}
                <Panel position="bottom-left" className="!m-3 !ml-14">
                    <div className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">범례</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-emerald-500" />
                                <span className="text-gray-600 dark:text-gray-300">Request</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-blue-500" />
                                <span className="text-gray-600 dark:text-gray-300">Response</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-0.5 bg-violet-500" />
                                <span className="text-gray-600 dark:text-gray-300">Reference</span>
                            </div>
                        </div>
                    </div>
                </Panel>
            </ReactFlow>

            {/* 영향 분석 패널 */}
            <AnimatePresence>
                {(selectedNode || impactAnalysis) && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="absolute top-3 right-3 bottom-3 w-80 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {selectedNodeData?.name || '선택된 항목'}
                                </h3>
                                <button
                                    onClick={clearImpactAnalysis}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <span className="sr-only">닫기</span>
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {selectedNode?.type === 'modelNode' && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedNodeData?.fieldCount || 0}개 필드
                                </p>
                            )}
                            {selectedNode?.type === 'endpointNode' && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedNodeData?.method} {selectedNodeData?.path}
                                </p>
                            )}
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[calc(100%-80px)]">
                            {isAnalyzing ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="w-6 h-6 text-violet-500 animate-spin" />
                                    <span className="ml-2 text-gray-500">분석 중...</span>
                                </div>
                            ) : impactAnalysis ? (
                                <div className="space-y-4">
                                    {/* 영향 수준 */}
                                    <div className={`p-3 rounded-lg ${getImpactColor(impactAnalysis.impactLevel)}`}>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="font-medium capitalize">
                                                {impactAnalysis.impactLevel} Impact
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1 opacity-80">
                                            이 모델 변경 시 {impactAnalysis.affectedModels.length}개 모델,{' '}
                                            {impactAnalysis.affectedEndpoints.length}개 엔드포인트에 영향
                                        </p>
                                    </div>

                                    {/* 직접 의존 */}
                                    {impactAnalysis.details.directDependents.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                직접 의존 모델 ({impactAnalysis.details.directDependents.length})
                                            </h4>
                                            <div className="space-y-1">
                                                {impactAnalysis.details.directDependents.map(model => (
                                                    <div
                                                        key={model}
                                                        className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
                                                    >
                                                        {model}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 간접 의존 */}
                                    {impactAnalysis.details.indirectDependents.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                간접 의존 모델 ({impactAnalysis.details.indirectDependents.length})
                                            </h4>
                                            <div className="space-y-1">
                                                {impactAnalysis.details.indirectDependents.map(model => (
                                                    <div
                                                        key={model}
                                                        className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm text-orange-700 dark:text-orange-300"
                                                    >
                                                        {model}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 영향받는 엔드포인트 */}
                                    {impactAnalysis.affectedEndpoints.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                영향받는 엔드포인트 ({impactAnalysis.affectedEndpoints.length})
                                            </h4>
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {impactAnalysis.affectedEndpoints.map((ep, i) => (
                                                    <div
                                                        key={i}
                                                        className="px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-xs text-yellow-700 dark:text-yellow-300 font-mono"
                                                    >
                                                        {ep}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">
                                        모델 노드를 클릭하면<br />
                                        영향 분석 결과를 볼 수 있습니다
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 순환 참조 경고 */}
            {circularDeps.length > 0 && (
                <div className="absolute bottom-3 right-3 max-w-xs">
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                    순환 참조 감지됨
                                </p>
                                <ul className="text-xs text-red-600 dark:text-red-400 mt-1 space-y-0.5">
                                    {circularDeps.slice(0, 3).map((cycle, i) => (
                                        <li key={i}>{cycle.join(' → ')}</li>
                                    ))}
                                    {circularDeps.length > 3 && (
                                        <li>...외 {circularDeps.length - 3}개</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DependencyGraphView;
