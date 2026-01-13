'use client';

import { useState } from "react";
import { Search, Database, Layers, Copy, Terminal, Code, Info, ArrowRight } from "lucide-react";
import { ApiModel } from "@/lib/mock-db";
import { ApiModelTree } from "./ApiModelTree";
import { generateTypeScriptType } from "@/lib/utils/ts-generator";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "./ui/EmptyState";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getModelFields } from "@/app/actions/models";

interface ModelExplorerProps {
    projectId: string;
    models: ApiModel[];
}

export function ModelExplorer({ projectId, models }: ModelExplorerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModelId, setSelectedModelId] = useState<string | null>(
        models.length > 0 ? (models[0].id || models[0].name) : null
    );
    const [modelCache, setModelCache] = useState<Record<string, any>>({});
    const [loadingModel, setLoadingModel] = useState(false);
    const { showToast } = useToast();

    // Ensure we have a selection if models are available but selectedModelId is null
    useEffect(() => {
        if (!selectedModelId && models.length > 0) {
            setSelectedModelId(models[0].id || models[0].name);
        }
    }, [models, selectedModelId]);

    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedModel = modelCache[selectedModelId || ""] || models.find(m => (m.id || m.name) === selectedModelId);

    useEffect(() => {
        if (selectedModelId && (!modelCache[selectedModelId] || !modelCache[selectedModelId].fields)) {
            const fetchFields = async () => {
                setLoadingModel(true);
                try {
                    const fields = await getModelFields(projectId, selectedModelId);
                    const baseModel = models.find(m => (m.id || m.name) === selectedModelId);
                    setModelCache(prev => ({
                        ...prev,
                        [selectedModelId || ""]: { ...baseModel, fields }
                    }));
                } catch (err) {
                    showToast("모델 상세 정보를 가져오는 데 실패했습니다.", "error");
                } finally {
                    setLoadingModel(false);
                }
            };
            fetchFields();
        }
    }, [selectedModelId, projectId, models]);

    const handleCopyTS = (type: string) => {
        navigator.clipboard.writeText(type);
        showToast("TypeScript 인터페이스가 클립보드에 복사되었습니다.", "success");
    };

    if (models.length === 0) {
        return (
            <EmptyState
                icon={Database}
                title="데이터 모델이 없습니다"
                description="스프링 프로젝트를 분석하여 DTO 및 VO 모델을 자동으로 추출하세요."
            />
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)] animate-in fade-in duration-500">
            {/* Model List Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="모델명 또는 필드 검색..."
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar glass-panel rounded-3xl border border-slate-100 bg-white/50 p-3 space-y-1.5 shadow-sm">
                    {filteredModels.map((model) => (
                        <button
                            key={model.id || model.name}
                            onClick={() => setSelectedModelId(model.id || model.name)}
                            className={`
                                w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm transition-all duration-200 group/item
                                ${selectedModelId === (model.id || model.name)
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]'
                                    : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md'}
                            `}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Layers className={`w-4 h-4 shrink-0 transition-colors ${selectedModelId === (model.id || model.name) ? 'text-blue-400' : 'text-slate-300 group-hover/item:text-blue-500'}`} />
                                <span className="font-black truncate tracking-tight">{model.name}</span>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest transition-colors ${selectedModelId === (model.id || model.name) ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-600'}`}>
                                {model.fieldCount || 0} fields
                            </span>
                        </button>
                    ))}
                    {filteredModels.length === 0 && (
                        <div className="py-20 text-center opacity-50">
                            <p className="text-xs">검색 결과가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Model Details View */}
            <div className="lg:col-span-8 overflow-y-auto no-scrollbar rounded-2xl">
                <AnimatePresence mode="wait">
                    {selectedModel ? (
                        <motion.div
                            key={selectedModel.id || selectedModel.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 pb-12"
                        >
                            <div className="glass-panel p-6 rounded-2xl border-primary/20 bg-primary/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">{selectedModel.name}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Info className="w-3 h-3" />
                                                Spring DTO / Value Object 엔티티
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopyTS(generateTypeScriptType(selectedModel))}
                                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all active:scale-95"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> TS Interface 복사
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative">
                                {loadingModel && (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    </div>
                                )}
                                <section className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5" /> 계층 구조 탐색 (Visual Tree)
                                    </h4>
                                    <ApiModelTree name={selectedModel.name} fields={selectedModel.fields || []} />
                                </section>

                                <section className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Code className="w-3.5 h-3.5" /> TypeScript 타입 정의
                                    </h4>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <pre className="relative p-6 bg-card border border-border rounded-2xl text-xs font-mono leading-relaxed overflow-x-auto shadow-inner min-h-[300px]">
                                            {selectedModel.fields ? generateTypeScriptType(selectedModel) : "// 필드 데이터를 로딩 중입니다..."}
                                        </pre>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <ArrowRight className="w-16 h-16 mb-4 animate-bounce" />
                            <p className="font-bold">탐색할 모델을 선택하세요.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
