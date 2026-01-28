"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Code, Clock, Database, ArrowRightLeft, User, MessageCircle } from "lucide-react";
import { ApiEndpoint, ApiModel } from "@/lib/api-types";
import { ApiModelTree } from "./ApiModelTree";
import { OwnerBadge } from "./OwnerBadge";
import { CommentSection } from "./CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "./ui/EmptyState";
import { useTilt3D } from "@/hooks/useTilt3D";

interface ExtendedApiEndpoint extends ApiEndpoint {
    ownerName?: string | null;
    ownerContact?: string | null;
}

interface ApiListProps {
    endpoints: ExtendedApiEndpoint[];
    allModels: ApiModel[];
    projectId?: string;
    userId?: string | null;
    userName?: string | null;
}

type TabType = 'data' | 'owner' | 'comments';

interface EndpointCardItemProps {
    api: ExtendedApiEndpoint;
    idx: number;
    isExpanded: boolean;
    allModels: ApiModel[];
    projectId?: string;
    userId?: string | null;
    userName?: string | null;
    toggleExpand: (id: string) => void;
    getActiveTab: (apiId: string) => TabType;
    setTabForApi: (apiId: string, tab: TabType) => void;
}

function EndpointCardItem({
    api,
    idx,
    isExpanded,
    allModels,
    projectId,
    userId,
    userName,
    toggleExpand,
    getActiveTab,
    setTabForApi
}: EndpointCardItemProps) {
    const apiId = api.id || `api-${idx}`;
    const requestModel = allModels.find(m => m.name === api.requestBody);
    const responseModel = allModels.find(m => m.name === api.responseType);
    const currentTab = getActiveTab(apiId);

    const tilt = useTilt3D({
        maxTilt: 4,
        scale: 1.01,
        speed: 400,
        glare: !isExpanded,
        glareOpacity: 0.08,
        disabled: isExpanded,
    });

    return (
        <div
            ref={tilt.ref as any}
            style={tilt.style}
            onMouseEnter={tilt.onMouseEnter}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            className={`
                group glass-panel transition-all p-0 rounded-2xl overflow-hidden relative
                ${isExpanded ? 'border-primary shadow-lg shadow-primary/5' : 'hover:border-primary/50 hover:shadow-md'}
            `}
        >
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleExpand(apiId)}
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <span className={`
                                    px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 w-16 text-center
                                    ${api.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        api.method === 'POST' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            api.method === 'PUT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                'bg-red-500/20 text-red-400 border border-red-500/30'}
                                `}>
                                    {api.method}
                                </span>
                                <div className="overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono text-foreground font-semibold truncate">
                                            {api.path}
                                        </code>
                                        {api.version && (
                                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                                                v{api.version}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {api.summary || `${api.className}.${api.methodName}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                                {/* Owner Badge (Compact) */}
                                {api.ownerName && (
                                    <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <User className="w-3 h-3" />
                                        <span>{api.ownerName}</span>
                                    </div>
                                )}
                                <div className="hidden md:flex flex-col items-end opacity-60 group-hover:opacity-100 transition-all">
                                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                        <Code className="w-3 h-3" />
                                        {api.className}
                                    </span>
                                    <span
                                        className="text-[10px] font-mono text-muted-foreground flex items-center gap-1"
                                        suppressHydrationWarning
                                    >
                                        <Clock className="w-3 h-3" />
                                        {api.syncedAt ? new Date(api.syncedAt).toLocaleDateString() : '방금 전'}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-primary" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-border/50 bg-muted/20"
                                >
                                    {/* Tab Navigation */}
                                    <div className="px-6 pt-4 flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTabForApi(apiId, 'data'); }}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                                currentTab === 'data'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Database className="w-3.5 h-3.5" />
                                            데이터 구조
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTabForApi(apiId, 'owner'); }}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                                currentTab === 'owner'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <User className="w-3.5 h-3.5" />
                                            담당자
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTabForApi(apiId, 'comments'); }}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                                currentTab === 'comments'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            코멘트
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-6">
                                        {currentTab === 'data' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Request Info */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                                        <ArrowRightLeft className="w-4 h-4 text-primary" />
                                                        <h4 className="text-sm font-bold">요청 데이터 (Request)</h4>
                                                    </div>
                                                    {requestModel ? (
                                                        <div className="bg-card/30 rounded-xl p-4 border border-border/50">
                                                            <p className="text-xs font-bold text-muted-foreground mb-3 px-1 uppercase tracking-tight">
                                                                Model: {requestModel.name}
                                                            </p>
                                                            <ApiModelTree name={requestModel.name} fields={requestModel.fields ?? []} />
                                                        </div>
                                                    ) : api.requestBody ? (
                                                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                                                            <p className="text-xs text-muted-foreground">정의된 모델 정보를 찾을 수 없습니다: {api.requestBody}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                                                            <p className="text-xs text-muted-foreground">요청 본문이 없는 엔드포인트입니다.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Response Info */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                                        <Database className="w-4 h-4 text-chart-2" />
                                                        <h4 className="text-sm font-bold">응답 데이터 (Response)</h4>
                                                    </div>
                                                    {responseModel ? (
                                                        <div className="bg-card/30 rounded-xl p-4 border border-border/50">
                                                            <p className="text-xs font-bold text-muted-foreground mb-3 px-1 uppercase tracking-tight">
                                                                Type: {responseModel.name}
                                                            </p>
                                                            <ApiModelTree name={responseModel.name} fields={responseModel.fields ?? []} />
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border text-center">
                                                            <p className="text-xs text-muted-foreground">
                                                                {api.responseType ? `응답 타입: ${api.responseType}` : '응답 타입 정보가 없습니다.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {currentTab === 'owner' && (
                                            <div className="max-w-md">
                                                <div className="flex items-center gap-2 pb-2 border-b border-border/50 mb-4">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                    <h4 className="text-sm font-bold">담당자 정보</h4>
                                                </div>
                                                <OwnerBadge
                                                    endpointId={apiId}
                                                    ownerName={api.ownerName}
                                                    ownerContact={api.ownerContact}
                                                    editable={true}
                                                />
                                            </div>
                                        )}

                                        {currentTab === 'comments' && projectId && (
                                            <div>
                                                <div className="flex items-center gap-2 pb-2 border-b border-border/50 mb-4">
                                                    <MessageCircle className="w-4 h-4 text-green-500" />
                                                    <h4 className="text-sm font-bold">코멘트 & 질문</h4>
                                                </div>
                                                <CommentSection
                                                    projectId={projectId}
                                                    endpointId={apiId}
                                                    userId={userId}
                                                    userName={userName}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-6 pb-6 pt-2 flex justify-end">
                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                                            <span className="flex items-center gap-1">
                                                <Code className="w-3 h-3" />
                                                {api.className}.{api.methodName}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Glare overlay */}
                        {!isExpanded && <div style={tilt.glareStyle} className="pointer-events-none" />}
                    </div>
    );
}

export function ApiList({ endpoints, allModels, projectId, userId, userName }: ApiListProps) {
    const [expandedApiId, setExpandedApiId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Record<string, TabType>>({});

    if (endpoints.length === 0) {
        return (
            <EmptyState
                icon={Database}
                title="데이터가 없습니다"
                description="분석된 엔드포인트가 없습니다. 우측 하단의 분석기를 통해 저장소를 임포트하여 시작하세요."
            />
        );
    }

    const toggleExpand = (id: string) => {
        setExpandedApiId(expandedApiId === id ? null : id);
    };

    const getActiveTab = (apiId: string): TabType => activeTab[apiId] || 'data';

    const setTabForApi = (apiId: string, tab: TabType) => {
        setActiveTab(prev => ({ ...prev, [apiId]: tab }));
    };

    return (
        <div className="space-y-4">
            {endpoints.map((api, idx) => {
                const apiId = api.id || `api-${idx}`;
                const isExpanded = expandedApiId === apiId;
                return (
                    <EndpointCardItem
                        key={apiId}
                        api={api}
                        idx={idx}
                        isExpanded={isExpanded}
                        allModels={allModels}
                        projectId={projectId}
                        userId={userId}
                        userName={userName}
                        toggleExpand={toggleExpand}
                        getActiveTab={getActiveTab}
                        setTabForApi={setTabForApi}
                    />
                );
            })}
        </div>
    );
}
