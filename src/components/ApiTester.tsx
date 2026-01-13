import { useState, useEffect } from "react";
import { Loader2, Send, Wand2, Plus, Trash2, Save, History, BookMarked, Play, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { ApiEndpoint, EnvConfig, ApiModel } from "@/lib/api-types";
import { generateSampleJson } from "@/lib/utils/json-generator";
import { testApi, ApiTestResponse } from "@/app/actions/test-api";
import { saveTestCase, getTestCases, deleteTestCase, saveTestHistory, getTestHistory } from "@/app/actions/test-case";
import { runBatchTest } from "@/app/actions/batch-test";
import type { TestCase, TestHistory, BatchTestSummary } from "@/lib/api-types";
import { ApiResponseViewer } from "./ApiResponseViewer";

interface ApiTesterProps {
    projectId?: string;
    endpoints: ApiEndpoint[];
    environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>;
    allModels: ApiModel[];
}

export function ApiTester({ projectId, endpoints, environments, allModels }: ApiTesterProps) {
    const [selectedApiId, setSelectedApiId] = useState("");
    const [env, setEnv] = useState<'DEV' | 'STG' | 'PRD'>('DEV');
    const [payload, setPayload] = useState("{}");
    const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
        { key: "Content-Type", value: "application/json" }
    ]);
    const [response, setResponse] = useState<ApiTestResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Tabs state
    const [activeTab, setActiveTab] = useState<'response' | 'cases' | 'history'>('response');

    // Test Cases & History state
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [history, setHistory] = useState<TestHistory[]>([]);
    const [caseName, setCaseName] = useState("");
    const [savingCase, setSavingCase] = useState(false);

    // Batch Runner state
    const [batchSummary, setBatchSummary] = useState<BatchTestSummary | null>(null);
    const [runningBatch, setRunningBatch] = useState(false);

    const selectedApi = endpoints.find(api => api.id === selectedApiId);

    // API 선택 시 초기화 및 데이터 로드
    useEffect(() => {
        if (selectedApi) {
            if (selectedApi.requestBody) {
                const model = allModels.find(m => m.name === selectedApi.requestBody);
                const sample = generateSampleJson(model, allModels);
                setPayload(sample);
            } else {
                setPayload("{}");
            }
            setResponse(null);
            setActiveTab('response');
            loadTestCases();
            loadHistory();
        }
    }, [selectedApiId, allModels, selectedApi]);

    const loadTestCases = async () => {
        if (!selectedApiId) return;
        const cases = await getTestCases(selectedApiId);
        setTestCases(cases);
    };

    const loadHistory = async () => {
        if (!selectedApiId) return;
        const hists = await getTestHistory(selectedApiId);
        setHistory(hists);
    };

    const handleAddHeader = () => {
        setHeaders([...headers, { key: "", value: "" }]);
    };

    const handleRemoveHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
    };

    const handleTest = async () => {
        if (!selectedApi) return;
        setLoading(true);
        setResponse(null);
        setActiveTab('response');

        try {
            const envConfig = environments[env];
            const baseUrl = envConfig.baseUrl.replace(/\/$/, "");
            const path = selectedApi.path.startsWith("/") ? selectedApi.path : `/${selectedApi.path}`;
            const url = `${baseUrl}${path}`;

            const headerObj: Record<string, string> = {};
            headers.forEach(h => {
                if (h.key) headerObj[h.key] = h.value;
            });

            if (envConfig.token) {
                headerObj['Authorization'] = `Bearer ${envConfig.token}`;
            }

            const result = await testApi({
                url,
                method: selectedApi.method as any,
                headers: headerObj,
                body: payload,
                timeout: 30000
            });

            setResponse(result);

            // Save History
            if (projectId) {
                await saveTestHistory(
                    projectId,
                    selectedApi.id!,
                    env,
                    result.statusCode || 0,
                    result.responseTime || 0,
                    result.success
                );
                loadHistory(); // Refresh history
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "unknown error";
            setResponse({
                success: false,
                error: message,
                responseTime: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTestCase = async () => {
        if (!selectedApi || !caseName.trim() || !projectId) return;
        setSavingCase(true);

        const headerObj: Record<string, string> = {};
        headers.forEach(h => { if (h.key) headerObj[h.key] = h.value; });

        await saveTestCase(projectId, selectedApi.id!, caseName, payload, headerObj);
        setCaseName("");
        await loadTestCases();
        setSavingCase(false);
        setActiveTab('cases');
    };

    const handleDeleteTestCase = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await deleteTestCase(id);
            await loadTestCases();
        }
    };

    const handleLoadTestCase = (tc: TestCase) => {
        setPayload(tc.payload);
        if (tc.headers) {
            try {
                const parsed = JSON.parse(tc.headers);
                setHeaders(Object.entries(parsed).map(([key, value]) => ({ key, value: value as string })));
            } catch (e) {
                console.error("Failed to parse headers", e);
            }
        }
        alert(`테스트 케이스 '${tc.name}' 불러오기 완료`);
    };

    const handleRunBatchTest = async () => {
        if (!selectedApi || !projectId || testCases.length === 0) return;
        setRunningBatch(true);
        setBatchSummary(null);
        setActiveTab('cases');

        try {
            const summary = await runBatchTest(
                projectId,
                selectedApi.id!,
                env,
                environments,
                selectedApi
            );
            setBatchSummary(summary);
            loadHistory();
        } catch (err) {
            alert("일괄 실행 중 오류가 발생했습니다.");
        } finally {
            setRunningBatch(false);
        }
    };

    const handleGenerateSample = () => {
        if (selectedApi && selectedApi.requestBody) {
            const model = allModels.find(m => m.name === selectedApi.requestBody);
            const sample = generateSampleJson(model, allModels);
            setPayload(sample);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: Request Configuration */}
                <div className="glass-panel p-6 rounded-2xl space-y-5 h-fit">
                    {/* Environment Selection */}
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">테스트 환경</label>
                        <div className="flex gap-2">
                            {(['DEV', 'STG', 'PRD'] as const).map(e => (
                                <button
                                    key={e}
                                    onClick={() => setEnv(e)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${env === e ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Selection */}
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">API 엔드포인트 선택</label>
                        <select
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={selectedApiId}
                            onChange={(e) => setSelectedApiId(e.target.value)}
                        >
                            <option value="">엔드포인트를 선택하세요</option>
                            {endpoints.map(api => (
                                <option key={api.id} value={api.id}>[{api.method}] {api.path}</option>
                            ))}
                        </select>
                    </div>

                    {/* Headers Configuration */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">요청 헤더 (Headers)</label>
                            <button onClick={handleAddHeader} className="text-[10px] flex items-center gap-1 bg-muted/50 px-2 py-1 rounded hover:bg-muted font-bold">
                                <Plus className="w-3 h-3" /> 추가
                            </button>
                        </div>
                        <div className="space-y-2">
                            {headers.map((header, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        placeholder="Key"
                                        className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                                        value={header.key}
                                        onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                                    />
                                    <input
                                        placeholder="Value"
                                        className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                                        value={header.value}
                                        onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleRemoveHeader(index)}
                                        className="text-muted-foreground hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Request Body */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase block">요청 본문 (JSON Payload)</label>
                            {selectedApi?.requestBody && (
                                <button
                                    onClick={handleGenerateSample}
                                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                                >
                                    <Wand2 className="w-3 h-3" />
                                    VO 샘플 재생성
                                </button>
                            )}
                        </div>
                        <textarea
                            className="w-full h-60 bg-muted/30 border border-border rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                            placeholder="{}"
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                        />
                    </div>

                    {/* Test Case Save Input */}
                    {selectedApiId && (
                        <div className="pt-4 border-t border-border/50">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">현재 설정을 테스트 케이스로 저장</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="케이스 이름 입력 (예: 정상 로그인)"
                                    value={caseName}
                                    onChange={(e) => setCaseName(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveTestCase}
                                    disabled={!caseName || savingCase}
                                    className="bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    저장
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleTest}
                        disabled={loading || !selectedApiId}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        요청 전송 (Send Request)
                    </button>

                    {environments[env].token && (
                        <p className="text-[10px] text-muted-foreground text-center">
                            * 환경 설정에 저장된 인증 토큰이 자동으로 포함됩니다.
                        </p>
                    )}
                </div>

                {/* Right Panel: Response & History & Cases */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[600px] h-full">
                    {/* Panel Tabs */}
                    <div className="flex mb-4 p-1 bg-muted/50 rounded-xl">
                        <button
                            onClick={() => setActiveTab('response')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'response' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Send className="w-3.5 h-3.5" /> 응답 (Response)
                        </button>
                        <button
                            onClick={() => setActiveTab('cases')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'cases' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <BookMarked className="w-3.5 h-3.5" /> 케이스 ({testCases.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <History className="w-3.5 h-3.5" /> 히스토리 ({history.length})
                        </button>
                    </div>

                    <div className="flex-1 rounded-xl overflow-hidden border border-border/50 bg-black/5 relative">
                        {/* Tab Content: Response */}
                        {activeTab === 'response' && (
                            response ? (
                                <div className="absolute inset-0 overflow-auto p-4">
                                    <ApiResponseViewer response={response} />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 p-6 text-center">
                                    <Send className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="font-medium">요청을 보내면 응답이 여기에 표시됩니다.</p>
                                    {selectedApi?.requestBody && (
                                        <p className="text-xs mt-2 opacity-70">
                                            Tip: 왼쪽의 "VO 샘플 재생성" 버튼을 눌러 테스트 데이터를 자동으로 생성해보세요.
                                        </p>
                                    )}
                                </div>
                            )
                        )}

                        {/* Tab Content: Test Cases */}
                        {activeTab === 'cases' && (
                            <div className="absolute inset-0 overflow-auto p-4 space-y-4">
                                {testCases.length > 0 && !batchSummary && (
                                    <button
                                        onClick={handleRunBatchTest}
                                        disabled={runningBatch}
                                        className="w-full py-2 bg-chart-2 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-4 sticky top-0 z-10 shadow-lg"
                                    >
                                        {runningBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        모든 케이스 일괄 실행 ({testCases.length})
                                    </button>
                                )}

                                {batchSummary && (
                                    <div className="bg-card border-2 border-primary/20 rounded-xl p-4 mb-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                <History className="w-4 h-4 text-primary" />
                                                일괄 실행 리포트
                                            </h4>
                                            <button
                                                onClick={() => setBatchSummary(null)}
                                                className="text-[10px] text-muted-foreground hover:text-foreground"
                                            >
                                                닫기
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-muted/50 p-2 rounded-lg text-center">
                                                <div className="text-[10px] text-muted-foreground">전체</div>
                                                <div className="text-sm font-bold">{batchSummary.total}</div>
                                            </div>
                                            <div className="bg-green-500/10 p-2 rounded-lg text-center">
                                                <div className="text-[10px] text-green-600">성공</div>
                                                <div className="text-sm font-bold text-green-600">{batchSummary.successCount}</div>
                                            </div>
                                            <div className="bg-red-500/10 p-2 rounded-lg text-center">
                                                <div className="text-[10px] text-red-600">실패</div>
                                                <div className="text-sm font-bold text-red-600">{batchSummary.failCount}</div>
                                            </div>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1 border-t border-border/50 pt-2">
                                            {batchSummary.results.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between text-[10px] py-1">
                                                    <span className="truncate flex-1 mr-2">{r.testCaseName}</span>
                                                    <span className={r.success ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                                        {r.success ? "SUCCESS" : "FAIL"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {testCases.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 pt-10">
                                        <BookMarked className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-sm">저장된 테스트 케이스가 없습니다.</p>
                                    </div>
                                ) : (
                                    testCases.map(tc => (
                                        <div key={tc.id} className="bg-card border border-border/50 p-4 rounded-xl hover:border-primary/50 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-sm">{tc.name}</h4>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleDeleteTestCase(tc.id)} className="p-1 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg font-mono mb-3 line-clamp-2">
                                                {tc.payload.substring(0, 100)}...
                                            </div>
                                            <button
                                                onClick={() => handleLoadTestCase(tc)}
                                                className="w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Play className="w-3 h-3" /> 불러오기
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Tab Content: History */}
                        {activeTab === 'history' && (
                            <div className="absolute inset-0 overflow-auto p-4 space-y-2">
                                {history.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                        <History className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-sm">테스트 실행 기록이 없습니다.</p>
                                    </div>
                                ) : (
                                    history.map(h => (
                                        <div key={h.id} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl text-xs">
                                            <div className="flex items-center gap-3">
                                                {h.success ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                                <div>
                                                    <div className="font-bold">{h.env} 환경 테스트</div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(h.executed_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${h.status >= 200 && h.status < 300 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {h.status || 'Error'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">{h.response_time}ms</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
