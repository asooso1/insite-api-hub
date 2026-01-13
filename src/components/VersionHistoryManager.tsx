'use client';

import { useState, useEffect } from "react";
import { History, Trash2, ArrowRightLeft, Clock, Info, CheckCircle2 } from "lucide-react";
import { ApiVersion } from "@/lib/api-types";
import { getVersions, deleteVersion } from "@/app/actions/version";
import { motion, AnimatePresence } from "framer-motion";

interface VersionHistoryManagerProps {
    projectId: string;
    onSelectForDiff: (version: ApiVersion) => void;
}

export function VersionHistoryManager({ projectId, onSelectForDiff }: VersionHistoryManagerProps) {
    const [versions, setVersions] = useState<ApiVersion[]>([]);
    const [loading, setLoading] = useState(true);

    const loadVersions = async () => {
        setLoading(true);
        const data = await getVersions(projectId);
        setVersions(data);
        setLoading(false);
    };

    useEffect(() => {
        if (projectId) loadVersions();
    }, [projectId]);

    const handleDelete = async (id: string) => {
        if (confirm("이 버전을 영구적으로 삭제하시겠습니까?")) {
            await deleteVersion(id);
            loadVersions();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        API 버전 기록
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">임포트 시점별 스냅샷 데이터를 관리합니다.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border border-dashed border-border rounded-2xl text-center">
                        <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground">버전 기록이 없습니다</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-[250px] mt-2">
                            레포지토리를 임포트하면 이전 데이터가 자동으로 여기에 저장됩니다.
                        </p>
                    </div>
                ) : (
                    versions.map((ver) => (
                        <motion.div
                            key={ver.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                                            {ver.versionTag}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(ver.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-foreground">{ver.description || "설명 없음"}</h3>
                                    <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            <span>엔드포인트: <strong>{ver.endpointsSnapshot.length}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-blue-500" />
                                            <span>데이터 모델: <strong>{ver.modelsSnapshot.length}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onSelectForDiff(ver)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-semibold rounded-xl transition-all"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                        현재와 비교
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ver.id)}
                                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
