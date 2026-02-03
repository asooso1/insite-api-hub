'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Database, Server, AlertTriangle, Layers } from 'lucide-react';

interface ModelNodeData {
    label: string;
    name: string;
    fieldCount?: number;
    isAffected?: boolean;
    affectedBy?: string[];
}

interface EndpointNodeData {
    label: string;
    name: string;
    method?: string;
    path?: string;
    isAffected?: boolean;
    affectedBy?: string[];
}

interface CustomNodeProps<T> {
    data: T;
    selected?: boolean;
}

/**
 * 모델 노드 컴포넌트
 */
export const ModelNode = memo(({ data, selected }: CustomNodeProps<ModelNodeData>) => {
    const isAffected = data.isAffected;

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
                relative px-4 py-3 rounded-xl min-w-[180px]
                bg-gradient-to-br from-violet-500/20 to-purple-600/20
                dark:from-violet-500/30 dark:to-purple-600/30
                border-2 transition-all duration-200
                ${selected
                    ? 'border-violet-500 shadow-lg shadow-violet-500/30'
                    : isAffected
                        ? 'border-red-500 shadow-lg shadow-red-500/30'
                        : 'border-violet-400/50 dark:border-violet-500/50'
                }
                backdrop-blur-sm
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-violet-500 border-2 border-white dark:border-gray-900"
            />

            <div className="flex items-center gap-2">
                <div className={`
                    p-1.5 rounded-lg
                    ${isAffected ? 'bg-red-500/30' : 'bg-violet-500/30'}
                `}>
                    <Database className={`w-4 h-4 ${isAffected ? 'text-red-400' : 'text-violet-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {data.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {data.fieldCount || 0} 필드
                    </p>
                </div>
                {isAffected && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-violet-500 border-2 border-white dark:border-gray-900"
            />
        </motion.div>
    );
});

ModelNode.displayName = 'ModelNode';

/**
 * 엔드포인트 노드 컴포넌트
 */
export const EndpointNode = memo(({ data, selected }: CustomNodeProps<EndpointNodeData>) => {
    const isAffected = data.isAffected;

    const getMethodColor = (method?: string) => {
        switch (method?.toUpperCase()) {
            case 'GET': return 'bg-emerald-500/30 text-emerald-400';
            case 'POST': return 'bg-blue-500/30 text-blue-400';
            case 'PUT': return 'bg-amber-500/30 text-amber-400';
            case 'PATCH': return 'bg-orange-500/30 text-orange-400';
            case 'DELETE': return 'bg-red-500/30 text-red-400';
            default: return 'bg-gray-500/30 text-gray-400';
        }
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
                relative px-4 py-3 rounded-xl min-w-[220px]
                bg-gradient-to-br from-emerald-500/20 to-teal-600/20
                dark:from-emerald-500/30 dark:to-teal-600/30
                border-2 transition-all duration-200
                ${selected
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/30'
                    : isAffected
                        ? 'border-red-500 shadow-lg shadow-red-500/30'
                        : 'border-emerald-400/50 dark:border-emerald-500/50'
                }
                backdrop-blur-sm
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-emerald-500 border-2 border-white dark:border-gray-900"
            />

            <div className="flex items-center gap-2">
                <div className={`
                    p-1.5 rounded-lg
                    ${isAffected ? 'bg-red-500/30' : 'bg-emerald-500/30'}
                `}>
                    <Server className={`w-4 h-4 ${isAffected ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {data.method && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getMethodColor(data.method)}`}>
                                {data.method}
                            </span>
                        )}
                        {isAffected && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1" title={data.path}>
                        {data.path}
                    </p>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-emerald-500 border-2 border-white dark:border-gray-900"
            />
        </motion.div>
    );
});

EndpointNode.displayName = 'EndpointNode';

/**
 * 그룹 노드 (확장용)
 */
export const GroupNode = memo(({ data }: CustomNodeProps<{ label: string; count: number }>) => {
    return (
        <div className="px-4 py-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 min-w-[150px]">
            <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    {data.label}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400">
                    {data.count}
                </span>
            </div>
        </div>
    );
});

GroupNode.displayName = 'GroupNode';

// 노드 타입 맵핑 (React Flow에서 사용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeTypes: Record<string, any> = {
    modelNode: ModelNode,
    endpointNode: EndpointNode,
    groupNode: GroupNode,
};
