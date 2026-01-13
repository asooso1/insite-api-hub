'use client';

import { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Edit2, Loader2, CheckCircle2, XCircle, Clock, ChevronRight, Layout, History as LucideHistory } from 'lucide-react';
import { TestScenario, BatchTestSummary, EnvConfig } from '@/lib/api-types';
import { getScenarios, deleteScenario, runScenario } from '@/app/actions/scenario';
import { ScenarioEditor } from './ScenarioEditor';

interface ScenarioManagerProps {
    projectId: string;
    environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>;
}

export function ScenarioManager({ projectId, environments }: ScenarioManagerProps) {
    const [scenarios, setScenarios] = useState<TestScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningId, setRunningId] = useState<string | null>(null);
    const [editingScenario, setEditingScenario] = useState<TestScenario | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [lastSummary, setLastSummary] = useState<{ id: string, summary: BatchTestSummary } | null>(null);
    const [env, setEnv] = useState<'DEV' | 'STG' | 'PRD'>('DEV');

    useEffect(() => {
        loadScenarios();
    }, [projectId]);

    async function loadScenarios() {
        setLoading(true);
        try {
            const data = await getScenarios(projectId);
            setScenarios(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 시나리오를 삭제하시겠습니까?')) return;
        await deleteScenario(id);
        loadScenarios();
    };

    const handleRun = async (scenario: TestScenario) => {
        setRunningId(scenario.id);
        setLastSummary(null);
        try {
            const summary = await runScenario(projectId, scenario.id, env, environments);
            setLastSummary({ id: scenario.id, summary });
        } catch (e) {
            alert('시나리오 실행 중 오류가 발생했습니다.');
        } finally {
            setRunningId(null);
        }
    };

    if (editingScenario || isCreating) {
        return (
            <ScenarioEditor
                projectId={projectId}
                initialScenario={editingScenario || undefined}
                onClose={() => {
                    setEditingScenario(null);
                    setIsCreating(false);
                    loadScenarios();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Layout className="w-5 h-5 text-primary" />
                        테스트 시나리오 관리
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">여러 API를 순차적으로 연결하여 흐름을 검증합니다.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
                        {(['DEV', 'STG', 'PRD'] as const).map(e => (
                            <button
                                key={e}
                                onClick={() => setEnv(e)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${env === e ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" /> 새 시나리오 생성
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-sm">시나리오를 불러오는 중...</p>
                </div>
            ) : scenarios.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-2xl py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                    <Layout className="w-12 h-12 mb-4 opacity-10" />
                    <p className="text-sm">생성된 시나리오가 없습니다.</p>
                    <button onClick={() => setIsCreating(true)} className="mt-4 text-primary text-sm font-bold hover:underline">첫 시나리오를 만들어보세요</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {scenarios.map(s => (
                        <div key={s.id} className="glass-panel p-5 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Layout className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base">{s.name}</h4>
                                        <p className="text-xs text-muted-foreground">{s.description || '설명 없음'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRun(s)}
                                        disabled={!!runningId}
                                        className="h-9 px-4 bg-chart-2 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {runningId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                        실행
                                    </button>
                                    <button onClick={() => setEditingScenario(s)} className="p-2 hover:bg-muted rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" /></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                                {s.steps.map((step, idx) => (
                                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                                        <div className="px-3 py-1.5 bg-muted/50 border border-border/50 rounded-lg text-[10px] flex flex-col">
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">STEP {idx + 1}</span>
                                            <span className="font-bold truncate max-w-[120px]">{step.testCaseName}</span>
                                        </div>
                                        {idx < s.steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />}
                                    </div>
                                ))}
                            </div>

                            {lastSummary?.id === s.id && (
                                <div className="bg-card/50 border border-border/50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold flex items-center gap-1.5">
                                            <LucideHistory className="w-3.5 h-3.5 text-primary" />
                                            최근 실행 결과
                                        </span>
                                        <div className="flex gap-4">
                                            <span className="text-[10px] text-muted-foreground">성공: <b className="text-green-500">{lastSummary.summary.successCount}</b></span>
                                            <span className="text-[10px] text-muted-foreground">실패: <b className="text-red-500">{lastSummary.summary.failCount}</b></span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {lastSummary.summary.results.map((res, i) => (
                                            <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-border/30 last:border-0">
                                                <span className="flex items-center gap-2">
                                                    {res.success ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                                    {res.testCaseName}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {res.responseTime}ms</span>
                                                    <span className={`font-bold ${res.success ? 'text-green-500' : 'text-red-500'}`}>{res.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
