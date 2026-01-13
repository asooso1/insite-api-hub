'use client';

import { useState } from "react";
import {
    Activity,
    Box,
    Database,
    Layers,
    Layout,
    Lock,
    Server,
    Share2,
    FileText,
    Cpu,
    Github,
    Search,
    Download,
    Copy,
    Terminal,
    Filter,
    ArrowUpDown,
    History as HistoryIcon
} from "lucide-react";
import { MockDB } from "@/lib/mock-db";
import { motion, AnimatePresence } from "framer-motion";
import { RepoImporter } from "@/components/RepoImporter";
import { ApiList } from "@/components/ApiList";
import { EnvironmentManager } from "@/components/EnvironmentManager";
import { ApiTester } from "@/components/ApiTester";
import { ScenarioManager } from "@/components/ScenarioManager";
import { ProjectSelector } from "@/components/ProjectSelector";
import { exportApisToExcel } from "@/lib/utils/excel-export";
import { generateTypeScriptType } from "@/lib/utils/ts-generator";
import { ApiModelTree } from "@/components/ApiModelTree";
import { VersionHistoryManager } from "@/components/VersionHistoryManager";
import { ApiDiffViewer } from "@/components/ApiDiffViewer";
import { ApiVersion } from "@/lib/api-types";
import { useToast } from "@/components/ui/Toast";

export type DashboardTab = 'endpoints' | 'environments' | 'test' | 'scenarios' | 'versions';

interface DashboardUIProps {
    initialData: MockDB;
    currentProjectId: string | null;
}

export function DashboardUI({ initialData, currentProjectId }: DashboardUIProps) {
    const [activeTab, setActiveTab] = useState<DashboardTab>('endpoints');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    const [diffVersion, setDiffVersion] = useState<ApiVersion | null>(null);
    const { showToast } = useToast();

    const handleProjectSelect = (projectId: string) => {
        document.cookie = `current_project_id=${projectId}; path=/; max-age=31536000`;
        showToast("프로젝트가 전환되었습니다.", "info");
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    const handleExportExcel = () => {
        try {
            exportApisToExcel(filteredEndpoints);
            showToast(`${filteredEndpoints.length}개의 API 목록을 엑셀로 내보냈습니다.`, "success");
        } catch (err) {
            showToast("엑셀 내보내기에 실패했습니다.", "error");
        }
    };

    const handleCopyTS = (type: string) => {
        navigator.clipboard.writeText(type);
        showToast("TypeScript 인터페이스가 클립보드에 복사되었습니다.", "success");
    };

    const filteredEndpoints = initialData.endpoints.filter(e => {
        if (selectedMethods.length > 0 && !selectedMethods.includes(e.method)) return false;
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        const matchesDirect =
            e.path.toLowerCase().includes(query) ||
            (e.summary && e.summary.toLowerCase().includes(query)) ||
            e.className.toLowerCase().includes(query) ||
            e.methodName.toLowerCase().includes(query);

        if (matchesDirect) return true;

        const relevantModels = initialData.models.filter(m =>
            (m.name === e.requestBody || m.name === e.responseType) &&
            m.fields?.some(f => f.name.toLowerCase().includes(query))
        );

        return relevantModels.length > 0;
    });

    const toggleMethod = (method: string) => {
        setSelectedMethods(prev =>
            prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
        );
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-card border-r border-border flex flex-col shadow-2xl z-20">
                <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <Cpu className="text-primary w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-foreground">API HUB</h1>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">Unified Endpoint Manager</p>
                        </div>
                    </div>

                    <ProjectSelector
                        projects={initialData.projects}
                        currentProjectId={currentProjectId}
                        onSelect={handleProjectSelect}
                    />

                    <div className="space-y-1 mt-8">
                        <SidebarItem
                            icon={<Box className="w-4 h-4" />}
                            label="엔드포인트 대시보드"
                            active={activeTab === 'endpoints'}
                            onClick={() => setActiveTab('endpoints')}
                            badge={initialData.endpoints.length.toString()}
                        />
                        <SidebarItem
                            icon={<Database className="w-4 h-4" />}
                            label="서버 환경 설정"
                            active={activeTab === 'environments'}
                            onClick={() => setActiveTab('environments')}
                        />
                        <SidebarItem
                            icon={<Activity className="w-4 h-4" />}
                            label="API 통합 테스트"
                            active={activeTab === 'test'}
                            onClick={() => setActiveTab('test')}
                        />
                        <SidebarItem
                            icon={<ArrowUpDown className="w-4 h-4" />}
                            label="시나리오 테스트"
                            active={activeTab === 'scenarios'}
                            onClick={() => setActiveTab('scenarios')}
                        />
                        <SidebarItem
                            icon={<HistoryIcon className="w-4 h-4" />}
                            label="버전 및 변경 이력"
                            active={activeTab === 'versions'}
                            onClick={() => setActiveTab('versions')}
                        />
                        <SidebarItem icon={<FileText className="w-4 h-4" />} label="문서 및 가이드" />
                    </div>

                    <div className="mt-12">
                        <h4 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 opacity-50">외부 연동</h4>
                        <div className="space-y-1">
                            <SidebarItem icon={<Github className="w-4 h-4" />} label="Git 리포지토리" />
                            <SidebarItem icon={<Share2 className="w-4 h-4" />} label="Dooray 알림" />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/30">
                    <RepoImporter projectId={currentProjectId || undefined} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="max-w-[1600px] mx-auto p-8">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {activeTab === 'endpoints' ? "대시보드 개요" :
                                    activeTab === 'environments' ? "서버 환경 설정" :
                                        activeTab === 'test' ? "API 통합 테스트" :
                                            activeTab === 'scenarios' ? "시나리오 자동화 테스트" : "API 버전 및 변경 이력"}
                            </h2>
                            <p className="text-muted-foreground">
                                {activeTab === 'endpoints' ? "Spring 2.x 마이크로서비스 생태계를 모든 환경에서 효율적으로 관리하세요." :
                                    activeTab === 'environments' ? "전역 서버 정보 및 인증 토큰, 웹훅 연동 정보를 관리합니다." :
                                        activeTab === 'test' ? "등록된 모든 API를 대상으로 실제 요청을 시뮬레이션하고 응답을 확인합니다." :
                                            activeTab === 'scenarios' ? "연속된 API 호출 흐름을 정의하고 자동화 테스트를 수행합니다." :
                                                "임포트 시점별 스냅샷 데이터를 통해 변경 사항을 추적합니다."}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="경로, 클래스, 혹은 DTO 필드명 검색..."
                                    className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl w-72 md:w-96 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                                <div className="xl:col-span-3 space-y-8">
                                    {activeTab === 'endpoints' && (
                                        <>
                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-150">
                                                <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                                                {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => toggleMethod(m)}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedMethods.includes(m)
                                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                            : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                                                            }`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setSelectedMethods([])}
                                                    className="ml-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    초기화
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <StatCard label="총 엔드포인트" value={initialData.endpoints.length.toString()} icon={<Layers className="w-5 h-5" />} color="primary" />
                                                <StatCard label="데이터 모델" value={initialData.models.length.toString()} icon={<Database className="w-5 h-5" />} color="chart-2" />
                                                <StatCard label="활성 서버 환경" value={Object.keys(initialData.environments).length.toString()} icon={<Server className="w-5 h-5" />} color="chart-3" />
                                            </div>

                                            <section className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                                        <Box className="w-5 h-5 text-primary" /> API 목록 및 탐색
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-bold flex items-center gap-2 border border-border/50 hover:bg-muted"
                                                            onClick={handleExportExcel}
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> 엑셀 내보내기
                                                        </button>
                                                    </div>
                                                </div>
                                                <ApiList endpoints={filteredEndpoints} allModels={initialData.models} />
                                            </section>
                                        </>
                                    )}

                                    {activeTab === 'environments' && (
                                        <section>
                                            <EnvironmentManager initialConfigs={initialData.environments} />
                                        </section>
                                    )}

                                    {activeTab === 'test' && (
                                        <section>
                                            <ApiTester
                                                projectId={currentProjectId || undefined}
                                                endpoints={initialData.endpoints}
                                                environments={initialData.environments}
                                                allModels={initialData.models}
                                            />
                                        </section>
                                    )}

                                    {activeTab === 'scenarios' && (
                                        <section>
                                            <ScenarioManager
                                                projectId={currentProjectId || ""}
                                                environments={initialData.environments}
                                            />
                                        </section>
                                    )}

                                    {activeTab === 'versions' && (
                                        <section>
                                            {diffVersion ? (
                                                <ApiDiffViewer
                                                    currentEndpoints={initialData.endpoints}
                                                    oldVersion={diffVersion}
                                                    onBack={() => setDiffVersion(null)}
                                                />
                                            ) : (
                                                <VersionHistoryManager
                                                    projectId={currentProjectId || ""}
                                                    onSelectForDiff={(v) => setDiffVersion(v)}
                                                />
                                            )}
                                        </section>
                                    )}
                                </div>

                                {/* Preview Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sticky top-0">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Terminal className="w-5 h-5 text-chart-2" />
                                            데이터 모델 및 TS 타입
                                        </h3>
                                        {initialData.models.length > 0 ? (
                                            <div className="space-y-6">
                                                {initialData.models.slice(0, 3).map((model, i) => (
                                                    <div key={i} className="space-y-4">
                                                        <ApiModelTree name={model.name} fields={model.fields} />
                                                        <div className="relative group">
                                                            <pre className="p-3 bg-muted/50 rounded-xl text-[10px] font-mono overflow-x-auto border border-border/50 max-h-40">
                                                                {generateTypeScriptType(model)}
                                                            </pre>
                                                            <button
                                                                onClick={() => handleCopyTS(generateTypeScriptType(model))}
                                                                className="absolute top-2 right-2 p-1.5 bg-card border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
                                                            >
                                                                <Copy className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {initialData.models.length > 3 && (
                                                    <p className="text-center text-xs text-muted-foreground">+{initialData.models.length - 3}개의 모델 더보기</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 border border-dashed border-border rounded-xl">
                                                <p className="text-xs text-muted-foreground">추출된 모델이 없습니다.</p>
                                            </div>
                                        )}
                                        <p className="mt-4 text-xs text-muted-foreground italic">
                                            * Spring 소스 코드 정적 분석을 통해 자동 추출되었습니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
      `}
        >
            <div className="flex items-center gap-3">
                {icon}
                {label}
            </div>
            {badge && (
                <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'primary' | 'chart-2' | 'chart-3' }) {
    const colorMap: Record<string, string> = {
        primary: 'text-primary bg-primary/10',
        'chart-2': 'text-chart-2 bg-chart-2/10',
        'chart-3': 'text-chart-3 bg-chart-3/10',
    };

    return (
        <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
