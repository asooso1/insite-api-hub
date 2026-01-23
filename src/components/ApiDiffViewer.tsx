'use client';

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ApiEndpoint, ApiVersion } from "@/lib/api-types";
import { Plus, Minus, AlertCircle, ArrowLeft, ArrowRight, Columns, List, FileCode, AlertTriangle } from "lucide-react";
import { useChangeStore } from "@/stores";
import {
  listContainerVariants,
  listItemVariants,
  cardVariants,
  glassClasses
} from "@/lib/design-system";
import {
  compareVersions,
  calculateChangeStats,
  getSignificantChanges,
  ApiChange
} from "@/lib/change-detection";
import { compareAllDtos, DtoDiff, getBreakingChangeSummary } from "@/lib/dto-diff";
import { MultiDtoFieldDiffTree } from "./DtoFieldDiffTree";
import { estimateImpactLevel } from "@/lib/breaking-changes";

interface ApiDiffViewerProps {
    currentEndpoints: ApiEndpoint[];
    oldVersion: ApiVersion;
    onBack: () => void;
}

type FilterType = 'all' | 'added' | 'removed' | 'modified';
type TabType = 'endpoints' | 'dtos';

export function ApiDiffViewer({ currentEndpoints, oldVersion, onBack }: ApiDiffViewerProps) {
    const {
        comparisonMode,
        filter,
        setComparisonMode,
        setFilter,
        setChanges,
        changeStats: getChangeStats
    } = useChangeStore();

    const [activeTab, setActiveTab] = useState<TabType>('endpoints');
    const [dtoSeverityFilter, setDtoSeverityFilter] = useState<'all' | 'breaking' | 'minor' | 'patch'>('all');

    // change-detection 유틸리티 사용
    const changes = useMemo(
        () => compareVersions(currentEndpoints, oldVersion.endpointsSnapshot),
        [currentEndpoints, oldVersion]
    );

    // DTO 비교
    const dtoDiffs = useMemo(
        () => compareAllDtos(oldVersion.modelsSnapshot || [], []),
        [oldVersion]
    );

    const dtoBreakingSummary = useMemo(
        () => getBreakingChangeSummary(dtoDiffs),
        [dtoDiffs]
    );

    const impactLevel = useMemo(
        () => estimateImpactLevel(dtoDiffs),
        [dtoDiffs]
    );

    // 스토어에 변경사항 동기화
    useEffect(() => {
        setChanges(changes);
    }, [changes, setChanges]);

    // 스토어에서 통계 가져오기
    const storeStats = getChangeStats();
    const stats = {
        added: storeStats.added,
        removed: storeStats.removed,
        changed: storeStats.modified,
        all: storeStats.added + storeStats.removed + storeStats.modified,
    };

    // 필터링된 항목
    const filteredChanges = useMemo(() => {
        const significantChanges = getSignificantChanges(changes);

        if (filter === 'all') return significantChanges;

        const filterMap: Record<Exclude<FilterType, 'all'>, ApiChange['type']> = {
            'added': 'ADD',
            'removed': 'DELETE',
            'modified': 'MODIFY',
        };

        return significantChanges.filter(c => c.type === filterMap[filter]);
    }, [changes, filter]);

    // DTO 필터링
    const filteredDtoDiffs = useMemo(() => {
        if (dtoSeverityFilter === 'all') return dtoDiffs;

        return dtoDiffs.map(diff => ({
            ...diff,
            fields: diff.fields.filter(f => {
                if (dtoSeverityFilter === 'breaking') return f.severity === 'BREAKING';
                if (dtoSeverityFilter === 'minor') return f.severity === 'MINOR';
                if (dtoSeverityFilter === 'patch') return f.severity === 'PATCH';
                return true;
            }),
        })).filter(diff => diff.fields.length > 0);
    }, [dtoDiffs, dtoSeverityFilter]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 헤더 */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={onBack}
                        className="p-3 bg-secondary/50 hover:bg-secondary rounded-xl transition-all backdrop-blur-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3 flex-wrap">
                            버전 비교:
                            <span className="text-primary">{oldVersion.versionTag}</span>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground">현재</span>
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            이전 스냅샷 시점과 현재 데이터를 대조합니다.
                        </p>
                    </div>
                </div>

                {/* 통계 */}
                <div className="flex flex-wrap gap-3">
                    <StatBox
                        label="추가됨"
                        count={stats.added}
                        color="text-emerald-500"
                        bg="bg-emerald-500/10"
                        icon={<Plus className="w-4 h-4" />}
                    />
                    <StatBox
                        label="삭제됨"
                        count={stats.removed}
                        color="text-rose-500"
                        bg="bg-rose-500/10"
                        icon={<Minus className="w-4 h-4" />}
                    />
                    <StatBox
                        label="변경됨"
                        count={stats.changed}
                        color="text-amber-500"
                        bg="bg-amber-500/10"
                        icon={<AlertCircle className="w-4 h-4" />}
                    />
                </div>
            </div>

            {/* Breaking Changes Alert */}
            {dtoBreakingSummary.totalBreaking > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-bold text-rose-700 dark:text-rose-400">
                            Breaking Changes Detected
                        </h3>
                        <p className="text-sm text-rose-600 dark:text-rose-300 mt-1">
                            {dtoBreakingSummary.totalBreaking} breaking change{dtoBreakingSummary.totalBreaking !== 1 ? 's' : ''} detected across{' '}
                            {dtoBreakingSummary.affectedDtos.length} DTO{dtoBreakingSummary.affectedDtos.length !== 1 ? 's' : ''}.
                            Impact Level: <span className="font-bold">{impactLevel}</span>
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Tabs */}
            <div className={`${glassClasses.card} p-2 rounded-2xl`}>
                <div className="flex gap-2">
                    <TabButton
                        active={activeTab === 'endpoints'}
                        onClick={() => setActiveTab('endpoints')}
                        icon={<List className="w-4 h-4" />}
                        label="Endpoint Changes"
                        count={stats.all}
                    />
                    <TabButton
                        active={activeTab === 'dtos'}
                        onClick={() => setActiveTab('dtos')}
                        icon={<FileCode className="w-4 h-4" />}
                        label="DTO Changes"
                        count={dtoDiffs.length}
                        badge={dtoBreakingSummary.totalBreaking > 0 ? dtoBreakingSummary.totalBreaking : undefined}
                    />
                </div>
            </div>

            {/* 컨트롤 바 - 토글 & 필터 */}
            {activeTab === 'endpoints' && (
                <div className={`${glassClasses.card} p-4 rounded-2xl`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* 뷰 모드 토글 */}
                        <div className="flex gap-2">
                            <ToggleButton
                                active={comparisonMode === 'split'}
                                onClick={() => setComparisonMode('split')}
                                icon={<Columns className="w-4 h-4" />}
                                label="Split"
                            />
                            <ToggleButton
                                active={comparisonMode === 'unified'}
                                onClick={() => setComparisonMode('unified')}
                                icon={<List className="w-4 h-4" />}
                                label="Unified"
                            />
                        </div>

                        {/* 필터 버튼 */}
                        <div className="flex flex-wrap gap-2">
                            <FilterButton
                                active={filter === 'all'}
                                onClick={() => setFilter('all')}
                                label="All"
                                count={stats.all}
                            />
                            <FilterButton
                                active={filter === 'added'}
                                onClick={() => setFilter('added')}
                                label="Added"
                                count={stats.added}
                                color="emerald"
                            />
                            <FilterButton
                                active={filter === 'removed'}
                                onClick={() => setFilter('removed')}
                                label="Removed"
                                count={stats.removed}
                                color="rose"
                            />
                            <FilterButton
                                active={filter === 'modified'}
                                onClick={() => setFilter('modified')}
                                label="Modified"
                                count={stats.changed}
                                color="amber"
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'dtos' && (
                <div className={`${glassClasses.card} p-4 rounded-2xl`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-sm">Filter by Severity</h3>
                            <p className="text-xs text-muted-foreground">
                                {dtoBreakingSummary.totalBreaking} breaking, {dtoBreakingSummary.totalMinor} minor, {dtoBreakingSummary.totalPatch} patch
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <FilterButton
                                active={dtoSeverityFilter === 'all'}
                                onClick={() => setDtoSeverityFilter('all')}
                                label="All"
                                count={dtoBreakingSummary.totalBreaking + dtoBreakingSummary.totalMinor + dtoBreakingSummary.totalPatch}
                            />
                            <FilterButton
                                active={dtoSeverityFilter === 'breaking'}
                                onClick={() => setDtoSeverityFilter('breaking')}
                                label="Breaking"
                                count={dtoBreakingSummary.totalBreaking}
                                color="rose"
                            />
                            <FilterButton
                                active={dtoSeverityFilter === 'minor'}
                                onClick={() => setDtoSeverityFilter('minor')}
                                label="Minor"
                                count={dtoBreakingSummary.totalMinor}
                                color="amber"
                            />
                            <FilterButton
                                active={dtoSeverityFilter === 'patch'}
                                onClick={() => setDtoSeverityFilter('patch')}
                                label="Patch"
                                count={dtoBreakingSummary.totalPatch}
                                color="emerald"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Diff 컨텐츠 */}
            <AnimatePresence mode="wait">
                {activeTab === 'endpoints' && (
                    <>
                        {comparisonMode === 'split' ? (
                            <SplitView key="split" changes={filteredChanges} />
                        ) : (
                            <UnifiedView key="unified" changes={filteredChanges} />
                        )}

                        {/* 빈 상태 */}
                        {filteredChanges.length === 0 && (
                            <motion.div
                                className={`${glassClasses.card} p-12 text-center rounded-2xl`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground italic">
                                    {filter === 'all'
                                        ? '변경된 엔드포인트가 없습니다.'
                                        : `필터링된 항목이 없습니다.`}
                                </p>
                            </motion.div>
                        )}
                    </>
                )}

                {activeTab === 'dtos' && (
                    <motion.div
                        key="dtos"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {filteredDtoDiffs.length > 0 ? (
                            <MultiDtoFieldDiffTree diffs={filteredDtoDiffs} />
                        ) : (
                            <motion.div
                                className={`${glassClasses.card} p-12 text-center rounded-2xl`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <FileCode className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground italic">
                                    {dtoSeverityFilter === 'all'
                                        ? 'DTO 변경사항이 없습니다.'
                                        : `${dtoSeverityFilter} 수준의 변경사항이 없습니다.`}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// Split View (테이블 형태)
// ============================================
function SplitView({ changes }: { changes: ApiChange[] }) {
    return (
        <motion.div
            className={`${glassClasses.card} rounded-2xl overflow-hidden`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border">
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">
                                상태
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">
                                메서드
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                경로 및 설명
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                변경 상세
                            </th>
                        </tr>
                    </thead>
                    <motion.tbody
                        className="divide-y divide-border/50"
                        variants={listContainerVariants}
                        initial="initial"
                        animate="animate"
                    >
                        {changes.map((item, idx) => (
                            <motion.tr
                                key={`${item.method}-${item.path}-${idx}`}
                                variants={listItemVariants}
                                className={`
                                    hover:bg-muted/20 transition-all cursor-pointer
                                    ${item.type === 'ADD' ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''}
                                    ${item.type === 'DELETE' ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}
                                    ${item.type === 'MODIFY' ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''}
                                `}
                            >
                                <td className="px-6 py-4">
                                    <Badge type={item.type} />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${getMethodColor(item.method)}`}>
                                        {item.method}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-mono text-sm text-foreground font-semibold">
                                        {item.path}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {item.current?.summary || item.previous?.summary || "설명 없음"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {item.type === 'MODIFY' && item.fieldChanges && (
                                        <div className="space-y-1">
                                            {item.fieldChanges.map((fc, fcIdx) => (
                                                <div key={fcIdx} className="flex items-center gap-1 flex-wrap">
                                                    <span className="text-muted-foreground capitalize">{fc.field}:</span>
                                                    <span className="line-through text-rose-400">
                                                        {String(fc.before) || "None"}
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 mx-1" />
                                                    <span className="text-emerald-400">
                                                        {String(fc.after) || "None"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {item.type === 'ADD' && (
                                        <span className="text-emerald-500 font-medium">
                                            새로운 엔드포인트가 추가되었습니다.
                                        </span>
                                    )}
                                    {item.type === 'DELETE' && (
                                        <span className="text-rose-500 font-medium">
                                            기존 엔드포인트가 삭제되었습니다.
                                        </span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
            </div>
        </motion.div>
    );
}

// ============================================
// Unified View (GitHub 스타일 인라인 diff)
// ============================================
function UnifiedView({ changes }: { changes: ApiChange[] }) {
    return (
        <motion.div
            className="space-y-3"
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
        >
            {changes.map((item, idx) => (
                <motion.div
                    key={`${item.method}-${item.path}-${idx}`}
                    variants={cardVariants}
                    whileHover="hover"
                    className={`
                        ${glassClasses.card} p-5 rounded-xl
                        border-l-4 transition-all
                        ${item.type === 'ADD' ? 'border-l-emerald-500 bg-emerald-500/5' : ''}
                        ${item.type === 'DELETE' ? 'border-l-rose-500 bg-rose-500/5' : ''}
                        ${item.type === 'MODIFY' ? 'border-l-amber-500 bg-amber-500/5' : ''}
                    `}
                >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Badge type={item.type} />
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${getMethodColor(item.method)}`}>
                                {item.method}
                            </span>
                            <code className="font-mono text-sm font-semibold text-foreground">
                                {item.path}
                            </code>
                        </div>
                    </div>

                    <div className="mt-3 space-y-2">
                        {/* 설명 */}
                        {item.type === 'MODIFY' && item.fieldChanges?.some(fc => fc.field === 'summary') ? (
                            <div className="space-y-1">
                                {item.fieldChanges.filter(fc => fc.field === 'summary').map((fc, fcIdx) => (
                                    <div key={fcIdx}>
                                        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg">
                                            <Minus className="w-3 h-3 flex-shrink-0" />
                                            <span className="text-xs line-through">
                                                {String(fc.before) || "설명 없음"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg mt-1">
                                            <Plus className="w-3 h-3 flex-shrink-0" />
                                            <span className="text-xs">
                                                {String(fc.after) || "설명 없음"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {item.current?.summary || item.previous?.summary || "설명 없음"}
                            </p>
                        )}

                        {/* Request Body 변경 */}
                        {item.type === 'MODIFY' && item.fieldChanges?.some(fc => fc.field === 'requestBody') && (
                            <div className="space-y-1 mt-2">
                                <p className="text-xs font-semibold text-muted-foreground">Request Body:</p>
                                {item.fieldChanges.filter(fc => fc.field === 'requestBody').map((fc, fcIdx) => (
                                    <div key={fcIdx}>
                                        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg">
                                            <Minus className="w-3 h-3 flex-shrink-0" />
                                            <code className="text-xs">{String(fc.before) || "None"}</code>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg mt-1">
                                            <Plus className="w-3 h-3 flex-shrink-0" />
                                            <code className="text-xs">{String(fc.after) || "None"}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 추가/삭제 메시지 */}
                        {item.type === 'ADD' && (
                            <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium mt-2">
                                <Plus className="w-3 h-3" />
                                새로운 엔드포인트가 추가되었습니다.
                            </div>
                        )}
                        {item.type === 'DELETE' && (
                            <div className="flex items-center gap-2 text-rose-500 text-xs font-medium mt-2">
                                <Minus className="w-3 h-3" />
                                기존 엔드포인트가 삭제되었습니다.
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

// ============================================
// UI 컴포넌트들
// ============================================

function StatBox({ label, count, color, bg, icon }: {
    label: string;
    count: number;
    color: string;
    bg: string;
    icon: React.ReactNode;
}) {
    return (
        <motion.div
            className={`flex items-center gap-3 px-5 py-3 ${bg} rounded-xl border border-white/5 backdrop-blur-sm`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <div className={color}>{icon}</div>
            <div>
                <div className={`text-lg font-black leading-none ${color}`}>{count}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {label}
                </div>
            </div>
        </motion.div>
    );
}

function Badge({ type }: { type: ApiChange['type'] }) {
    const styles: Record<ApiChange['type'], string> = {
        ADD: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
        DELETE: "bg-rose-500/20 text-rose-500 border-rose-500/30",
        MODIFY: "bg-amber-500/20 text-amber-500 border-amber-500/30",
        UNCHANGED: "bg-muted text-muted-foreground border-border",
    };
    const labels: Record<ApiChange['type'], string> = {
        ADD: "ADDED",
        DELETE: "DELETED",
        MODIFY: "MODIFIED",
        UNCHANGED: "SAME"
    };
    return (
        <span className={`
            px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest
            ${styles[type]}
        `}>
            {labels[type]}
        </span>
    );
}

function getMethodColor(method: string) {
    switch (method.toUpperCase()) {
        case 'GET':
            return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
        case 'POST':
            return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
        case 'PUT':
            return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
        case 'PATCH':
            return 'bg-violet-500/10 text-violet-500 border border-violet-500/20';
        case 'DELETE':
            return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
        default:
            return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
}

function ToggleButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <motion.button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
                transition-all backdrop-blur-sm
                ${active
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </motion.button>
    );
}

function FilterButton({
    active,
    onClick,
    label,
    count,
    color = 'slate'
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
    color?: 'slate' | 'emerald' | 'rose' | 'amber';
}) {
    const colorClasses = {
        slate: active
            ? 'bg-slate-500 text-white'
            : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
        emerald: active
            ? 'bg-emerald-500 text-white'
            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
        rose: active
            ? 'bg-rose-500 text-white'
            : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
        amber: active
            ? 'bg-amber-500 text-white'
            : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
    };

    return (
        <motion.button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs
                transition-all backdrop-blur-sm border
                ${active ? 'border-transparent shadow-md' : 'border-transparent'}
                ${colorClasses[color]}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {label}
            <span className={`
                px-1.5 py-0.5 rounded text-[10px] font-black
                ${active ? 'bg-white/20' : 'bg-black/10'}
            `}>
                {count}
            </span>
        </motion.button>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    label,
    count,
    badge
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
    badge?: number;
}) {
    return (
        <motion.button
            onClick={onClick}
            className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                transition-all flex-1 lg:flex-none
                ${active
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-transparent text-muted-foreground hover:bg-secondary/50'
                }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {icon}
            <span>{label}</span>
            {count !== undefined && (
                <span className={`
                    px-2 py-0.5 rounded-md text-xs font-bold
                    ${active ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'}
                `}>
                    {count}
                </span>
            )}
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {badge}
                </span>
            )}
        </motion.button>
    );
}
