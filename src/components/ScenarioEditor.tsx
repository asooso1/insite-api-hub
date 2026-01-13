'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, ArrowUpDown, ChevronDown, ChevronUp, Link2, Info } from 'lucide-react';
import { TestScenario, ScenarioStep, TestCase } from '@/lib/api-types';
import { saveScenario } from '@/app/actions/scenario';
import { getTestCases } from '@/app/actions/test-case';

interface ScenarioEditorProps {
    projectId: string;
    initialScenario?: TestScenario;
    onClose: () => void;
}

export function ScenarioEditor({ projectId, initialScenario, onClose }: ScenarioEditorProps) {
    const [name, setName] = useState(initialScenario?.name || '');
    const [description, setDescription] = useState(initialScenario?.description || '');
    const [steps, setSteps] = useState<ScenarioStep[]>(initialScenario?.steps || []);
    const [saving, setSaving] = useState(false);
    const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);
    const [loadingCases, setLoadingCases] = useState(true);

    useEffect(() => {
        loadAllTestCases();
    }, []);

    async function loadAllTestCases() {
        setLoadingCases(true);
        try {
            // Need to fetch ALL test cases for the project. 
            // Current getTestCases requires apiId. Let's assume we can fetch all or we might need a new action.
            // For now, let's use a workaround or assume getTestCases handles project-wide if apiId is empty.
            // Actually, I'll update test-case.ts to support getting all test cases for a project.
            const cases = await getTestCases(""); // I will fix this in server action
            setAllTestCases(cases);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCases(false);
        }
    }

    const handleAddStep = () => {
        const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        const newStep: ScenarioStep = {
            id: uuid,
            testCaseId: '',
            testCaseName: '',
            order: steps.length,
            variableMappings: {}
        };
        setSteps([...steps, newStep]);
    };

    const handleRemoveStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
    };

    const handleStepChange = (id: string, field: keyof ScenarioStep, value: any) => {
        setSteps(steps.map(s => {
            if (s.id === id) {
                if (field === 'testCaseId') {
                    const tc = allTestCases.find(t => t.id === value);
                    return { ...s, [field]: value, testCaseName: tc?.name || '' };
                }
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    const handleAddMapping = (stepId: string) => {
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return { ...s, variableMappings: { ...s.variableMappings, "": "" } };
            }
            return s;
        }));
    };

    const handleMappingChange = (stepId: string, oldKey: string, newKey: string, newVal: string) => {
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                const newMappings = { ...s.variableMappings };
                if (oldKey !== newKey) {
                    delete newMappings[oldKey];
                }
                newMappings[newKey] = newVal;
                return { ...s, variableMappings: newMappings };
            }
            return s;
        }));
    };

    const handleRemoveMapping = (stepId: string, key: string) => {
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                const newMappings = { ...s.variableMappings };
                delete newMappings[key];
                return { ...s, variableMappings: newMappings };
            }
            return s;
        }));
    };

    const handleSave = async () => {
        if (!name) return alert('시나리오 이름을 입력해주세요.');
        if (steps.some(s => !s.testCaseId)) return alert('모든 단계의 테스트 케이스를 선택해주세요.');

        setSaving(true);
        try {
            await saveScenario(projectId, {
                id: initialScenario?.id,
                name,
                description,
                steps
            });
            onClose();
        } catch (e) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;

        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setSteps(newSteps.map((s, i) => ({ ...s, order: i })));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ArrowUpDown className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{initialScenario ? '시나리오 편집' : '새 시나리오 만들기'}</h3>
                        <p className="text-xs text-muted-foreground">테스트 케이스들을 연결하여 자동화 흐름을 구성합니다.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {saving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        시나리오 저장
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-panel p-5 rounded-2xl bg-card">
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">시나리오 기본 정보</label>
                        <div className="space-y-4">
                            <div>
                                <input
                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="시나리오 이름 (예: 주문에서 결제까지)"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <textarea
                                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
                                    placeholder="시나리오에 대한 간략한 설명"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl">
                        <h4 className="flex items-center gap-2 text-blue-600 text-sm font-bold mb-2">
                            <Info className="w-4 h-4" />
                            Variable Chaining Tip
                        </h4>
                        <p className="text-xs text-blue-700 leading-relaxed opacity-80">
                            이전 단계의 응답값에서 변수를 추출하여 다음 단계의 페이로드나 헤더에서 사용할 수 있습니다.<br />
                            추출할 값은 <b>data.id</b> 와 같이 JSON 경로로 지정하고,<br />
                            다음 단계에서는 <b>{'{'}{'{'}varName{'}'}{'}'}</b> 형식으로 입력하세요.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            단계 설정 (Steps)
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{steps.length}개 단계</span>
                        </h4>
                        <button
                            onClick={handleAddStep}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                            <Plus className="w-3.5 h-3.5" /> 단계 추가
                        </button>
                    </div>

                    {steps.length === 0 ? (
                        <div className="py-20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                            <ArrowUpDown className="w-10 h-10 mb-2 opacity-10" />
                            <p className="text-sm">테스트 단계를 추가하여 시나리오를 시작하세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <div key={step.id} className="glass-panel p-5 rounded-2xl border border-border/50 relative bg-card/30">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4 flex-1">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <select
                                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                        value={step.testCaseId}
                                                        onChange={e => handleStepChange(step.id, 'testCaseId', e.target.value)}
                                                    >
                                                        <option value="">테스트 케이스 선택</option>
                                                        {allTestCases.map(tc => (
                                                            <option key={tc.id} value={tc.id}>{tc.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Variable Mappings */}
                                                <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                                            <Link2 className="w-3 h-3" />
                                                            변수 추출 (Chaining)
                                                        </label>
                                                        <button
                                                            onClick={() => handleAddMapping(step.id)}
                                                            className="text-[10px] text-primary font-bold hover:underline"
                                                        >
                                                            추가
                                                        </button>
                                                    </div>

                                                    {Object.entries(step.variableMappings).length === 0 ? (
                                                        <p className="text-[10px] text-muted-foreground italic">이 단계에서 추출할 변수가 없습니다.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {Object.entries(step.variableMappings).map(([k, v], midx) => (
                                                                <div key={midx} className="flex items-center gap-2">
                                                                    <input
                                                                        placeholder="path (예: data.id)"
                                                                        className="flex-1 bg-card border border-border rounded-lg px-2 py-1 text-[11px] outline-none"
                                                                        value={k}
                                                                        onChange={e => handleMappingChange(step.id, k, e.target.value, v)}
                                                                    />
                                                                    <span className="text-muted-foreground">→</span>
                                                                    <input
                                                                        placeholder="var name"
                                                                        className="flex-1 bg-card border border-border rounded-lg px-2 py-1 text-[11px] outline-none"
                                                                        value={v}
                                                                        onChange={e => handleMappingChange(step.id, k, k, e.target.value)}
                                                                    />
                                                                    <button onClick={() => handleRemoveMapping(step.id, k)} className="text-muted-foreground hover:text-red-500">
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                                            <button onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="p-1.5 hover:bg-muted rounded-lg disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                                            <button onClick={() => handleRemoveStep(step.id)} className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors mt-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
