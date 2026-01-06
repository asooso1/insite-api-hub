"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, Wand2 } from "lucide-react";
import { ApiEndpoint, EnvConfig, ApiModel } from "@/lib/mock-db";
import { generateSampleJson } from "@/lib/utils/json-generator";

interface ApiResponse {
    status: number;
    statusText?: string;
    url?: string;
    method?: string;
    data?: unknown;
    error?: string;
    message?: string;
}

interface ApiTesterProps {
    endpoints: ApiEndpoint[];
    environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>;
    allModels: ApiModel[];
}

export function ApiTester({ endpoints, environments, allModels }: ApiTesterProps) {
    const [selectedApiId, setSelectedApiId] = useState("");
    const [env, setEnv] = useState<'DEV' | 'STG' | 'PRD'>('DEV');
    const [payload, setPayload] = useState("{}");
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const selectedApi = endpoints.find(api => api.id === selectedApiId);

    // API 선택 시 자동 페이로드 생성
    useEffect(() => {
        if (selectedApi) {
            if (selectedApi.requestBody) {
                const model = allModels.find(m => m.name === selectedApi.requestBody);
                const sample = generateSampleJson(model, allModels);
                setPayload(sample);
            } else {
                setPayload("{}");
            }
        }
    }, [selectedApiId, allModels, selectedApi]);

    const handleTest = async () => {
        if (!selectedApi) return;
        setLoading(true);
        setResponse(null);

        try {
            const baseUrl = environments[env].baseUrl;
            const url = `${baseUrl}${selectedApi.path}`;

            await new Promise(resolve => setTimeout(resolve, 800));

            setResponse({
                status: 200,
                statusText: "OK",
                url: url,
                method: selectedApi.method,
                data: {
                    success: true,
                    message: `${selectedApi.path} 호출 성공 (${env} 환경)`,
                    timestamp: new Date().toISOString(),
                    requestBody: JSON.parse(payload || "{}")
                }
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "unknown error";
            setResponse({
                status: 500,
                error: "요청 처리 중 오류가 발생했습니다.",
                message: message
            });
        } finally {
            setLoading(false);
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
                <div className="glass-panel p-6 rounded-2xl space-y-4">
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

                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">테스트 환경</label>
                        <div className="flex gap-2">
                            {(['DEV', 'STG', 'PRD'] as const).map(e => (
                                <button
                                    key={e}
                                    onClick={() => setEnv(e)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${env === e ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

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
                            className="w-full h-60 bg-muted/30 border border-border rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            placeholder="{}"
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={loading || !selectedApiId}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        요청 전송 (Send Request)
                    </button>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex flex-col min-h-[400px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">응답 (Response)</label>
                    <div className="flex-1 bg-black/20 rounded-xl p-4 font-mono text-[11px] overflow-auto border border-border/50">
                        {response ? (
                            <pre className={response.status === 200 ? 'text-green-400' : 'text-red-400'}>
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
                                요청을 보내면 응답이 여기에 표시됩니다.
                                {selectedApi?.requestBody && (
                                    <p className="text-[10px] mt-2 italic text-center">선택된 모델: {selectedApi.requestBody}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
