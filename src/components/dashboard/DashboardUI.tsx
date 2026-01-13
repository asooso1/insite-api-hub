"use client";

import { useState } from "react";
import { RepoImporter } from "@/components/RepoImporter";
import { ApiModelTree } from "@/components/ApiModelTree";
import { ApiList } from "@/components/ApiList";
import { EnvironmentManager } from "@/components/EnvironmentManager";
import { ApiTester } from "@/components/ApiTester";
import { ProjectSelector } from "@/components/ProjectSelector";
import { exportApisToExcel } from "@/lib/utils/excel-export";
import { generateTypeScriptType } from "@/lib/utils/ts-generator";
import {
    Search,
    Database,
    Layout,
    Plus,
    Globe,
    Code,
    FileText,
    MessageSquare,
    Users,
    Activity,
    Box,
    Download,
    Copy,
    Terminal,
    Filter
} from "lucide-react";
import { ApiEndpoint, MockDB } from "@/lib/mock-db";
import { motion, AnimatePresence } from "framer-motion";

export type DashboardTab = 'endpoints' | 'environments' | 'test';

interface DashboardUIProps {
    initialData: MockDB;
    selectedProjectId?: string;
}

export default function DashboardUI({ initialData, selectedProjectId }: DashboardUIProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<DashboardTab>('endpoints');
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

    const handleProjectSelect = (id: string) => {
        document.cookie = `current_project_id=${id}; path=/; max-age=31536000`; // 1 year
        window.location.reload();
    };

    const currentProjectId = selectedProjectId || (initialData.projects.length > 0 ? initialData.projects[0].id : null);

    const filteredEndpoints = initialData.endpoints.filter((e: ApiEndpoint) => {
        const query = searchQuery.toLowerCase();

        // 1. Method Filter
        if (selectedMethods.length > 0 && !selectedMethods.includes(e.method)) {
            return false;
        }

        if (!query) return true;

        // 2. Direct Search (Path, Summary, Class, Method)
        const matchesDirect =
            e.path.toLowerCase().includes(query) ||
            (e.summary && e.summary.toLowerCase().includes(query)) ||
            e.className.toLowerCase().includes(query) ||
            e.methodName.toLowerCase().includes(query);

        if (matchesDirect) return true;

        // 3. DTO Field Search (Reverse track)
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
        <div className="flex h-screen bg-background overflow-hidden text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl flex flex-col shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
                        <Layout className="w-6 h-6 text-primary" />
                        API Hub
                    </h1>
                </div>

                <div className="px-4 mb-6">
                    <ProjectSelector
                        projects={initialData.projects}
                        currentProjectId={currentProjectId}
                        onSelect={handleProjectSelect}
                    />
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <div className="pb-4">
                        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">탐색</p>
                        <SidebarItem
                            icon={<Database className="w-4 h-4" />}
                            label="프로젝트 및 API"
                            active={activeTab === 'endpoints'}
                            onClick={() => setActiveTab('endpoints')}
                        />
                        <SidebarItem
                            icon={<Globe className="w-4 h-4" />}
                            label="환경 및 서버 설정"
                            active={activeTab === 'environments'}
                            onClick={() => setActiveTab('environments')}
                        />
                        <SidebarItem
                            icon={<Activity className="w-4 h-4" />}
                            label="API 통합 테스트"
                            active={activeTab === 'test'}
                            onClick={() => setActiveTab('test')}
                        />
                        <SidebarItem icon={<FileText className="w-4 h-4" />} label="문서 및 가이드" />
                    </div>

                    <div className="pb-4">
                        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">협업 및 알림</p>
                        <SidebarItem icon={<MessageSquare className="w-4 h-4" />} label="댓글 및 피드백" badge="3" />
                        <SidebarItem icon={<Users className="w-4 h-4" />} label="팀 멤버 관리" />
                    </div>
                </nav>

                <div className="p-4 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground text-center mb-2 italic">
                        Logged in as Guest
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="API 경로, DTO 또는 문서 검색..."
                                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-xs font-medium border border-border">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            동기화 중: main
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-chart-2" />
                    </div>
                </header>

                {/* Dashboard View */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {activeTab === 'endpoints' ? "대시보드 개요" :
                                        activeTab === 'environments' ? "서버 환경 설정" : "API 통합 테스트"}
                                </h2>
                                <p className="text-muted-foreground">
                                    {activeTab === 'endpoints' ? "Spring 2.x 마이크로서비스 생태계를 모든 환경에서 효율적으로 관리하세요." :
                                        activeTab === 'environments' ? "전역 서버 정보 및 인증 토큰, 웹훅 연동 정보를 관리합니다." :
                                            "등록된 모든 API를 대상으로 실제 요청을 시뮬레이션하고 응답을 확인합니다."}
                                </p>
                            </div>

                            {activeTab === 'endpoints' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard label="연동된 API 수" value={initialData.endpoints.length.toString()} icon={<Code className="w-5 h-5" />} color="primary" />
                                    <StatCard label="추출된 데이터 모델" value={initialData.models.length.toString()} icon={<Box className="w-5 h-5" />} color="chart-2" />
                                    <StatCard label="참여 중인 프로젝트" value={initialData.projects.length.toString()} icon={<Users className="w-5 h-5" />} color="chart-3" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                <div className="xl:col-span-2 space-y-8">
                                    {activeTab === 'endpoints' ? (
                                        <>
                                            <section>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Activity className="w-5 h-5 text-primary" />
                                                    <h3 className="text-lg font-semibold">간편 API 분석</h3>
                                                </div>
                                                <RepoImporter projectId={currentProjectId || undefined} />
                                            </section>

                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <Database className="w-5 h-5 text-primary" />
                                                            <h3 className="text-lg font-semibold">API 엔드포인트 목록</h3>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                                                                <button
                                                                    key={m}
                                                                    onClick={() => toggleMethod(m)}
                                                                    className={`
                                                                        px-2.5 py-1 rounded text-[10px] font-bold transition-all border
                                                                        ${selectedMethods.includes(m)
                                                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                                            : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'}
                                                                    `}
                                                                >
                                                                    {m}
                                                                </button>
                                                            ))}
                                                            {selectedMethods.length > 0 && (
                                                                <button
                                                                    onClick={() => setSelectedMethods([])}
                                                                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors ml-1"
                                                                >
                                                                    초기화
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground mr-2">{filteredEndpoints.length}개의 API 발견</span>
                                                        <button
                                                            onClick={() => exportApisToExcel(initialData.endpoints)}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold border border-border transition-all"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                            엑셀 내보내기
                                                        </button>
                                                    </div>
                                                </div>
                                                <ApiList endpoints={filteredEndpoints} allModels={initialData.models} />
                                            </section>
                                        </>
                                    ) : activeTab === 'environments' ? (
                                        <section>
                                            <EnvironmentManager initialConfigs={initialData.environments} />
                                        </section>
                                    ) : (
                                        <section>
                                            <ApiTester
                                                projectId={currentProjectId || undefined}
                                                endpoints={initialData.endpoints}
                                                environments={initialData.environments}
                                                allModels={initialData.models}
                                            />
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
                                                                onClick={() => navigator.clipboard.writeText(generateTypeScriptType(model))}
                                                                className="absolute top-2 right-2 p-1.5 bg-card border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
                                                                title="TS 인터페이스 복사"
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
                </div >
            </main >
        </div >
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
