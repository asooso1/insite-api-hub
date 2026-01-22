'use client';

import { useState, useEffect } from "react";
import { History, Trash2, ArrowRightLeft, Clock, Plus, Minus, Edit3, Zap } from "lucide-react";
import { ApiVersion } from "@/lib/api-types";
import { getVersions, deleteVersion } from "@/app/actions/version";
import { motion } from "framer-motion";
import { compareVersions, calculateChangeStats, ChangeStats as ChangeStatsType } from "@/lib/change-detection";

interface VersionHistoryManagerProps {
    projectId: string;
    onSelectForDiff: (version: ApiVersion) => void;
}

interface ChangeStats {
    added: number;
    deleted: number;
    modified: number;
}

export function VersionHistoryManager({ projectId, onSelectForDiff }: VersionHistoryManagerProps) {
    const [versions, setVersions] = useState<ApiVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

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

    // 변경 통계 계산 (change-detection 유틸리티 사용)
    const getChangeStats = (current: ApiVersion, previous?: ApiVersion): ChangeStats => {
        if (!previous) {
            return {
                added: current.endpointsSnapshot.length,
                deleted: 0,
                modified: 0
            };
        }

        // change-detection 유틸리티로 정확한 변경 감지
        const changes = compareVersions(current.endpointsSnapshot, previous.endpointsSnapshot);
        const stats = calculateChangeStats(changes);

        return {
            added: stats.added,
            deleted: stats.deleted,
            modified: stats.modified
        };
    };

    // 버전 선택 핸들러
    const handleVersionSelect = (versionId: string) => {
        setSelectedVersions(prev => {
            if (prev.includes(versionId)) {
                return prev.filter(id => id !== versionId);
            }
            if (prev.length >= 2) {
                return [prev[1], versionId];
            }
            return [...prev, versionId];
        });
    };

    // 두 버전 비교
    const handleCompareVersions = () => {
        if (selectedVersions.length === 2) {
            const version = versions.find(v => v.id === selectedVersions[1]);
            if (version) {
                onSelectForDiff(version);
            }
        }
    };

    // 타임라인 컨테이너 애니메이션
    const timelineContainer = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.05,
            },
        },
    };

    // 타임라인 아이템 애니메이션
    const timelineItem = {
        initial: { opacity: 0, x: -20 },
        animate: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
            },
        },
    };

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        API 버전 기록
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        임포트 시점별 스냅샷 데이터를 관리합니다.
                    </p>
                </div>
            </div>

            {/* 비교 모드 컨트롤 */}
            {selectedVersions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold">
                            {selectedVersions.length === 1
                                ? "1개 버전 선택됨 (1개 더 선택)"
                                : "2개 버전 선택됨"}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {selectedVersions.length === 2 && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCompareVersions}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
                            >
                                비교하기
                            </motion.button>
                        )}
                        <button
                            onClick={() => setSelectedVersions([])}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            취소
                        </button>
                    </div>
                </motion.div>
            )}

            {/* 타임라인 */}
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
                <motion.div
                    variants={timelineContainer}
                    initial="initial"
                    animate="animate"
                    className="relative"
                >
                    {/* 타임라인 세로선 */}
                    <div className="absolute left-[15px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent" />

                    <div className="space-y-6">
                        {versions.map((ver, index) => {
                            const isLatest = index === 0;
                            const isSelected = selectedVersions.includes(ver.id);
                            const changes = getChangeStats(ver, versions[index + 1]);

                            return (
                                <motion.div
                                    key={ver.id}
                                    variants={timelineItem}
                                    className="relative pl-12"
                                >
                                    {/* 타임라인 노드 */}
                                    <motion.div
                                        className={`absolute left-0 top-6 w-[30px] h-[30px] rounded-full border-4 border-background flex items-center justify-center z-10 ${
                                            isLatest
                                                ? 'bg-primary shadow-lg shadow-primary/50'
                                                : isSelected
                                                ? 'bg-primary/70'
                                                : 'bg-muted'
                                        }`}
                                        animate={
                                            isLatest
                                                ? {
                                                      boxShadow: [
                                                          '0 0 20px rgba(99, 102, 241, 0.4)',
                                                          '0 0 40px rgba(99, 102, 241, 0.6)',
                                                          '0 0 20px rgba(99, 102, 241, 0.4)',
                                                      ],
                                                      scale: [1, 1.1, 1],
                                                  }
                                                : {}
                                        }
                                        transition={{
                                            duration: 2,
                                            repeat: isLatest ? Infinity : 0,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <Zap className={`w-4 h-4 ${isLatest ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                    </motion.div>

                                    {/* 버전 카드 */}
                                    <motion.div
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        className={`bg-card/70 backdrop-blur-xl border rounded-2xl p-6 transition-all group cursor-pointer ${
                                            isSelected
                                                ? 'border-primary shadow-lg shadow-primary/20'
                                                : 'border-border hover:shadow-lg'
                                        }`}
                                        onClick={() => handleVersionSelect(ver.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-3 flex-1">
                                                {/* 버전 태그 & 타임스탬프 */}
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                                                        {ver.versionTag}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="px-2 py-0.5 bg-gradient-to-r from-primary to-purple-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                            LATEST
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(ver.createdAt).toLocaleString('ko-KR', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>

                                                {/* 설명 */}
                                                <h3 className="font-semibold text-foreground">
                                                    {ver.description || "설명 없음"}
                                                </h3>

                                                {/* 변경 통계 */}
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    {changes.added > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-lg">
                                                            <Plus className="w-3.5 h-3.5 text-green-500" />
                                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                                                {changes.added}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {changes.deleted > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 rounded-lg">
                                                            <Minus className="w-3.5 h-3.5 text-red-500" />
                                                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                                {changes.deleted}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {changes.modified > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-lg">
                                                            <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                                                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                                                {changes.modified}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        총 <strong>{ver.endpointsSnapshot.length}개</strong> 엔드포인트
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 액션 버튼 */}
                                            <div className="flex gap-2 items-start">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectForDiff(ver);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                    현재와 비교
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(ver.id);
                                                    }}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 선택 체크 표시 */}
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                                            >
                                                <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
