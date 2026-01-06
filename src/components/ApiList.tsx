"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Code, Clock, Database, ArrowRightLeft } from "lucide-react";
import { ApiEndpoint, ApiModel } from "@/lib/mock-db";
import { ApiModelTree } from "./ApiModelTree";
import { motion, AnimatePresence } from "framer-motion";

interface ApiListProps {
    endpoints: ApiEndpoint[];
    allModels: ApiModel[];
}

export function ApiList({ endpoints, allModels }: ApiListProps) {
    const [expandedApiId, setExpandedApiId] = useState<string | null>(null);

    if (endpoints.length === 0) {
        return (
            <div className="text-center py-12 glass-panel rounded-2xl border-dashed">
                <p className="text-muted-foreground">분석된 엔드포인트가 없습니다. 저장소를 가져와서 시작하세요.</p>
            </div>
        );
    }

    const toggleExpand = (id: string) => {
        setExpandedApiId(expandedApiId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            {endpoints.map((api, idx) => {
                const apiId = api.id || `api-${idx}`;
                const isExpanded = expandedApiId === apiId;
                const requestModel = allModels.find(m => m.name === api.requestBody);
                const responseModel = allModels.find(m => m.name === api.responseType);

                return (
                    <div
                        key={apiId}
                        className={`
                            group glass-panel transition-all p-0 rounded-2xl overflow-hidden
                            ${isExpanded ? 'border-primary shadow-lg shadow-primary/5' : 'hover:border-primary/50'}
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
                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                                    <ApiModelTree name={requestModel.name} fields={requestModel.fields} />
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
                                                    <ApiModelTree name={responseModel.name} fields={responseModel.fields} />
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

                                    <div className="px-6 pb-6 pt-2 flex justify-end">
                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                                            <span className="flex items-center gap-1">
                                                <Code className="w-3 h-3" />
                                                {api.className}.{api.methodName}
                                            </span >
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
