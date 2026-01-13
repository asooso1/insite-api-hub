'use client';

import { useMemo } from "react";
import { ApiEndpoint, ApiVersion } from "@/lib/api-types";
import { Plus, Minus, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

interface ApiDiffViewerProps {
    currentEndpoints: ApiEndpoint[];
    oldVersion: ApiVersion;
    onBack: () => void;
}

type DiffItem = {
    type: 'added' | 'removed' | 'changed' | 'unchanged';
    path: string;
    method: string;
    current?: ApiEndpoint;
    old?: any; // Snapshot endpoints might have different casing if not handled
};

export function ApiDiffViewer({ currentEndpoints, oldVersion, onBack }: ApiDiffViewerProps) {
    const diffs = useMemo(() => {
        const oldEndpoints = oldVersion.endpointsSnapshot as any[];
        const allPaths = new Set([
            ...currentEndpoints.map(e => `${e.method} ${e.path}`),
            ...oldEndpoints.map(e => `${e.method} ${e.path}`)
        ]);

        const items: DiffItem[] = [];

        allPaths.forEach(key => {
            const [method, path] = key.split(' ');
            const current = currentEndpoints.find(e => e.method === method && e.path === path);
            const old = oldEndpoints.find((e: any) => e.method === method && e.path === path);

            if (current && !old) {
                items.push({ type: 'added', path, method, current });
            } else if (!current && old) {
                items.push({ type: 'removed', path, method, old });
            } else if (current && old) {
                // Handle both camelCase (current) and snake_case (old snapshot from DB)
                const oldRequestBody = old.request_body_model || old.requestBody;
                const oldResponseType = old.response_type || old.responseType;
                const oldSummary = old.summary;

                const isChanged = current.summary !== oldSummary ||
                    current.requestBody !== oldRequestBody ||
                    current.responseType !== oldResponseType;

                items.push({
                    type: isChanged ? 'changed' : 'unchanged',
                    path,
                    method,
                    current,
                    old: { ...old, requestBody: oldRequestBody, responseType: oldResponseType }
                });
            }
        });

        return items.sort((a, b) => a.path.localeCompare(b.path));
    }, [currentEndpoints, oldVersion]);

    const stats = {
        added: diffs.filter(d => d.type === 'added').length,
        removed: diffs.filter(d => d.type === 'removed').length,
        changed: diffs.filter(d => d.type === 'changed').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="p-3 bg-secondary hover:bg-secondary/70 rounded-full transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            버전 비교: <span className="text-primary">{oldVersion.versionTag}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            현재
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">이전 스냅샷 시점과 현재 데이터를 대조합니다.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <StatBox label="추가됨" count={stats.added} color="text-green-500" bg="bg-green-500/10" icon={<Plus className="w-4 h-4" />} />
                    <StatBox label="삭제됨" count={stats.removed} color="text-red-500" bg="bg-red-500/10" icon={<Minus className="w-4 h-4" />} />
                    <StatBox label="변경됨" count={stats.changed} color="text-amber-500" bg="bg-amber-500/10" icon={<AlertCircle className="w-4 h-4" />} />
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border">
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">상태</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">메서드</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">경로 및 설명</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">변경 상세</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {diffs.filter(d => d.type !== 'unchanged').map((item, idx) => (
                            <tr key={idx} className={`hover:bg-muted/20 transition-all ${item.type === 'added' ? 'bg-green-500/5' : item.type === 'removed' ? 'bg-red-500/5' : 'bg-amber-500/5'}`}>
                                <td className="px-6 py-4">
                                    <Badge type={item.type} />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${getMethodColor(item.method)}`}>
                                        {item.method}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-mono text-sm text-foreground font-semibold">{item.path}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {item.current?.summary || item.old?.summary || "설명 없음"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {item.type === 'changed' && (
                                        <div className="space-y-1">
                                            {item.current?.summary !== item.old?.summary && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">설명:</span>
                                                    <span className="line-through text-red-400">{item.old?.summary}</span>
                                                    <ArrowRight className="w-3 h-3 mx-1" />
                                                    <span className="text-green-400">{item.current?.summary}</span>
                                                </div>
                                            )}
                                            {item.current?.requestBody !== item.old?.requestBody && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Request:</span>
                                                    <span className="text-red-400">{item.old?.requestBody || "None"}</span>
                                                    <ArrowRight className="w-3 h-3 mx-1" />
                                                    <span className="text-green-400">{item.current?.requestBody || "None"}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {item.type === 'added' && <span className="text-green-500 font-medium">새로운 엔드포인트가 추가되었습니다.</span>}
                                    {item.type === 'removed' && <span className="text-red-500 font-medium">기존 엔드포인트가 삭제되었습니다.</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {diffs.filter(d => d.type !== 'unchanged').length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic">
                        변경된 엔드포인트가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ label, count, color, bg, icon }: any) {
    return (
        <div className={`flex items-center gap-3 px-5 py-3 ${bg} rounded-2xl border border-white/5`}>
            <div className={`${color}`}>{icon}</div>
            <div>
                <div className={`text-lg font-black leading-none ${color}`}>{count}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
            </div>
        </div>
    );
}

function Badge({ type }: { type: DiffItem['type'] }) {
    const styles = {
        added: "bg-green-500/20 text-green-500 border-green-500/30",
        removed: "bg-red-500/20 text-red-500 border-red-500/30",
        changed: "bg-amber-500/20 text-amber-500 border-amber-500/30",
        unchanged: "bg-muted text-muted-foreground border-border",
    };
    const labels = { added: "ADDED", removed: "DELETED", changed: "MODIFIED", unchanged: "SAME" };
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${styles[type]}`}>
            {labels[type]}
        </span>
    );
}

function getMethodColor(method: string) {
    switch (method.toUpperCase()) {
        case 'GET': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
        case 'POST': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
        case 'PUT': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
        case 'DELETE': return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
        default: return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
}
