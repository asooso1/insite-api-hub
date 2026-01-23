'use client';

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    LayoutGrid,
    List,
    Search,
    Settings,
    Zap,
    Layers,
    ArrowUpDown,
    History,
    Monitor,
    Menu,
    X,
    Bell,
    UserCircle,
    ChevronDown,
    Database,
    Download,
    ArrowRight,
    Users,
    Folder,
    Network
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MockDB } from "@/lib/mock-db";
import { ApiVersion } from "@/lib/api-types";
import { DashboardTab } from "./DashboardUI";
import { ApiList } from "@/components/ApiList";
import { EnvironmentManager } from "@/components/EnvironmentManager";
import { ApiTester } from "@/components/ApiTester";
import { ScenarioManager } from "@/components/ScenarioManager";
import { ModelExplorer } from "@/components/ModelExplorer";
import { VersionHistoryManager } from "@/components/VersionHistoryManager";
import { ApiDiffViewer } from "@/components/ApiDiffViewer";
import { RepoImporter } from "@/components/RepoImporter";
import { UserSession, signOut } from "@/app/actions/auth";
import { useUIStore, useTestStore } from "@/stores";
import WebhookSettings from "@/components/settings/WebhookSettings";
import { TestDashboard } from "@/components/TestDashboard";
import { ThreeDShowcase } from "@/components/demos/3DShowcase";
import { TeamsV2 } from "@/components/teams/TeamsV2";
import { ProjectsV2 } from "@/components/projects/ProjectsV2";
import { HierarchyContent } from "@/components/hierarchy/HierarchyContent";

interface DashboardV2Props {
    initialData: MockDB;
    currentProjectId: string | null;
    session: UserSession | null;
    onVersionSwitch: (v: 'v1' | 'v2') => void;
}

export function DashboardV2({ initialData, currentProjectId, session, onVersionSwitch }: DashboardV2Props) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Zustand stores
    const activeTab = useUIStore((state) => state.activeTab);
    const setActiveTab = useUIStore((state) => state.setActiveTab);
    const searchQuery = useUIStore((state) => state.searchQuery);
    const setSearchQuery = useUIStore((state) => state.setSearchQuery);

    // Test store
    const testHistory = useTestStore((state) => state.testHistory);
    const batchResults = useTestStore((state) => state.batchResults);

    // Local state (view-specific)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [diffVersion, setDiffVersion] = useState<ApiVersion | null>(null);
    const [uiVersion, setUiVersion] = useState<'v1' | 'v2'>('v2');

    // 탭 변경 시 URL도 함께 업데이트
    const handleTabChange = useCallback((tab: DashboardTab) => {
        setActiveTab(tab);
        router.push(`/?tab=${tab}`, { scroll: false });
    }, [setActiveTab, router]);

    const validTabs = ['endpoints', 'models', 'test', 'scenarios', 'versions', 'environments', 'settings', 'testResults', 'demo', 'teams', 'projects', 'hierarchy'];

    // URL 쿼리 파라미터에서 탭 읽기
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && validTabs.includes(tab)) {
            setActiveTab(tab as DashboardTab);
        }
    }, [searchParams, setActiveTab]);

    // 브라우저 뒤로가기/앞으로가기 지원
    useEffect(() => {
        const handlePopState = () => {
            const tab = new URLSearchParams(window.location.search).get('tab');
            if (tab && validTabs.includes(tab)) {
                setActiveTab(tab as DashboardTab);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [setActiveTab]);

    const tabs = [
        { id: 'endpoints', label: '엔드포인트', icon: <List className="w-4 h-4" />, color: 'blue' },
        { id: 'models', label: '데이터 모델', icon: <Layers className="w-4 h-4" />, color: 'purple' },
        { id: 'test', label: 'API 테스트', icon: <Zap className="w-4 h-4" />, color: 'amber' },
        { id: 'testResults', label: '테스트 결과', icon: <Monitor className="w-4 h-4" />, color: 'emerald' },
        { id: 'scenarios', label: '자동화 시나리오', icon: <ArrowUpDown className="w-4 h-4" />, color: 'green' },
        { id: 'versions', label: '변경 이력', icon: <History className="w-4 h-4" />, color: 'rose' },
        { id: 'environments', label: '서버 설정', icon: <Settings className="w-4 h-4" />, color: 'slate' },
        { id: 'teams', label: '팀 관리', icon: <Users className="w-4 h-4" />, color: 'cyan' },
        { id: 'projects', label: '프로젝트 관리', icon: <Folder className="w-4 h-4" />, color: 'orange' },
        { id: 'hierarchy', label: '전사 계층 구조', icon: <Network className="w-4 h-4" />, color: 'teal' },
        { id: 'settings', label: 'Webhook 설정', icon: <Database className="w-4 h-4" />, color: 'indigo' },
        { id: 'demo', label: '3D 데모', icon: <LayoutGrid className="w-4 h-4" />, color: 'pink' },
    ];

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-slate-900 font-sans selection:bg-blue-100">
            {/* Top Navigation */}
            <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <h1 className="text-lg font-black tracking-tight text-slate-800">API HUB <span className="text-blue-600 text-sm">v2.0</span></h1>
                    </div>

                    <div className="hidden md:flex items-center bg-slate-50/50 rounded-full px-4 py-2 border border-slate-200 group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="빠른 검색 (경로, 모델명...)"
                            className="bg-transparent text-xs font-medium outline-none w-64 text-slate-700 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onVersionSwitch('v1')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                        <Monitor className="w-3 h-3" /> v1 정통 테마로 전환
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-2" />
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                    </button>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-slate-800 leading-none">{session?.name || '사용자'}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">{session?.role === 'ADMIN' ? '시스템 관리자' : '프로젝트 멤버'}</p>
                        </div>
                        <div className="relative group/user">
                            <UserCircle className="w-8 h-8 text-slate-300 cursor-pointer group-hover/user:text-blue-500 transition-colors" />
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all p-2 z-[100] scale-95 group-hover/user:scale-100 origin-top-right">
                                {session?.role === 'ADMIN' && (
                                    <button
                                        onClick={() => window.location.href = '/admin'}
                                        className="w-full text-left px-4 py-3 text-[11px] font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-between group/btn"
                                    >
                                        <span>시스템 백오피스 관리</span>
                                        <ArrowRight className="w-3 h-3 translate-x-1 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                                    </button>
                                )}
                                <div className="h-px bg-slate-50 my-1" />
                                <button
                                    onClick={() => {
                                        signOut();
                                        window.location.reload();
                                    }}
                                    className="w-full text-left px-4 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                    로그아웃 (Sign Out)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* v2 Layout */}
            <div className="pt-16 flex h-screen overflow-hidden">
                {/* Slim Sidebar */}
                <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-8 gap-4 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as DashboardTab)}
                            className={`
                                group relative w-14 h-14 flex items-center justify-center rounded-[1.25rem] transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110'
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}
                            `}
                        >
                            <div className="relative z-10 transition-transform group-hover:scale-110">
                                {tab.icon}
                            </div>

                            {/* Improved Tooltip */}
                            <div className="absolute left-20 px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-x-[-10px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[100] shadow-2xl flex items-center">
                                {tab.label}
                                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                            </div>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute left-[-8px] w-[4px] h-8 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}


                    <div className="mt-auto p-4 flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.name || 'User'}`} alt="avatar" />
                        </div>
                    </div>
                </aside>

                {/* Main Viewport */}
                <main className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
                    <div className="flex-initial p-8 pb-4">
                        <div className="max-w-[1400px] mx-auto">
                            {/* Summary Header */}
                            <div className="flex items-end justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        <span>Workspace</span>
                                        <ChevronDown className="w-3 h-3" />
                                        <span className="text-slate-800">{currentProjectId || "Global Project"}</span>
                                    </nav>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </h2>
                                </div>

                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-slate-700">
                                        <Download className="w-3.5 h-3.5 text-blue-600" /> 데이터 내보내기
                                    </button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-95">
                                        + 저장소 동기화 (Sync)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-20">
                        <div className="max-w-[1400px] mx-auto space-y-8">

                            {/* Bento Grid Content */}
                            <div className="grid grid-cols-12 gap-6 pb-20">
                                {/* Analytics Feature Card */}
                                <div className="col-span-12 xl:col-span-12">
                                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {activeTab === 'endpoints' && (
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                                                                활성 엔드포인트 목록
                                                            </h3>
                                                            <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                                                <button className="px-3 py-1.5 bg-white text-[10px] font-black rounded-lg shadow-sm text-blue-600 border border-slate-100">리스트 뷰</button>
                                                                <button className="px-3 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors">그래프 시각화</button>
                                                            </div>
                                                        </div>
                                                        <ApiList
                                                                                endpoints={initialData.endpoints}
                                                                                allModels={initialData.models}
                                                                                projectId={currentProjectId || undefined}
                                                                                userId={session?.id}
                                                                                userName={session?.name}
                                                                            />
                                                    </div>
                                                )}

                                                {activeTab === 'models' && (
                                                    <ModelExplorer
                                                        projectId={currentProjectId || ""}
                                                        models={Array.from(new Map(initialData.models.map(m => [m.id || m.name, m])).values())}
                                                    />
                                                )}

                                                {activeTab === 'test' && (
                                                    <div className="max-w-5xl mx-auto">
                                                        <ApiTester
                                                            projectId={currentProjectId || undefined}
                                                            endpoints={initialData.endpoints}
                                                            environments={initialData.environments}
                                                            allModels={initialData.models}
                                                        />
                                                    </div>
                                                )}

                                                {activeTab === 'scenarios' && (
                                                    <ScenarioManager
                                                        projectId={currentProjectId || ""}
                                                        environments={initialData.environments}
                                                    />
                                                )}

                                                {activeTab === 'versions' && (
                                                    <div className="p-2">
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
                                                    </div>
                                                )}

                                                {activeTab === 'environments' && <EnvironmentManager initialConfigs={initialData.environments} />}

                                                {activeTab === 'settings' && (
                                                    <div className="max-w-4xl">
                                                        <WebhookSettings />
                                                    </div>
                                                )}

                                                {activeTab === 'testResults' && (
                                                    <TestDashboard
                                                        projectId={currentProjectId || ""}
                                                        testHistory={testHistory}
                                                        batchResults={batchResults}
                                                    />
                                                )}

                                                {activeTab === 'demo' && (
                                                    <ThreeDShowcase />
                                                )}

                                                {activeTab === 'teams' && (
                                                    <TeamsV2 embedded />
                                                )}

                                                {activeTab === 'projects' && (
                                                    <ProjectsV2 embedded />
                                                )}

                                                {activeTab === 'hierarchy' && (
                                                    <HierarchyContent />
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Dashboard Footer / Repo Stats */}
                                <div className="col-span-12">
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 blur-[100px] opacity-20 pointer-events-none" />
                                        <div className="space-y-2 relative z-10">
                                            <h4 className="text-xl font-black italic tracking-tighter uppercase">자동 분석 엔진 <span className="text-blue-500">v2.0</span></h4>
                                            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase opacity-70">Spring 2.x 생태계를 위한 강력한 코드 정적 분석 기능을 제공합니다.</p>
                                        </div>

                                        <div className="w-full md:w-auto min-w-[360px] relative z-10">
                                            <RepoImporter projectId={currentProjectId || undefined} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
