'use client';

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Link as LinkIcon, LayoutGrid, List, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Team, getTeams, createTeam, deleteTeam, linkProjectToTeam, unlinkProjectFromTeam, getProjectsByTeam } from "@/app/actions/team";
import { Project } from "@/lib/api-types";
import { getProjects } from "@/app/actions/project";
import { V2Layout, V2Card, V2Button, V2Modal, V2Input } from "@/components/layout/V2Layout";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

export function TeamsV2() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([]);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [teamsData, projectsData] = await Promise.all([
                getTeams(),
                getProjects()
            ]);
            setTeams(teamsData);
            setProjects(projectsData);
        } catch {
            showToast("데이터를 불러오는데 실패했습니다.", "error");
        }
        setLoading(false);
    }

    const handleCreateTeam = async () => {
        if (!newName) return;
        try {
            await createTeam(newName, newDesc);
            showToast("팀이 생성되었습니다.", "success");
            setIsCreateModalOpen(false);
            setNewName("");
            setNewDesc("");
            loadData();
        } catch {
            showToast("팀 생성에 실패했습니다.", "error");
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (!confirm("정말 이 팀을 삭제하시겠습니까?")) return;
        try {
            await deleteTeam(id);
            showToast("팀이 삭제되었습니다.", "success");
            loadData();
        } catch {
            showToast("팀 삭제에 실패했습니다.", "error");
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <V2Layout
            activeTab="teams"
            title="팀 관리"
            subtitle="팀을 구성하고 프로젝트를 할당하세요."
            breadcrumb={["관리", "팀 관리"]}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="팀 검색..."
            headerActions={
                <>
                    <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <V2Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        새 팀 만들기
                    </V2Button>
                </>
            }
        >
            {loading ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-3xl bg-white border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : filteredTeams.length === 0 ? (
                <V2Card>
                    <EmptyState
                        icon={Users}
                        title="팀이 없습니다"
                        description="새 팀을 만들어 프로젝트를 구성하세요."
                    />
                </V2Card>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    <AnimatePresence mode="popLayout">
                        {filteredTeams.map((team) => (
                            <motion.div
                                key={team.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <V2Card className={viewMode === 'list' ? 'flex items-center !p-6' : ''}>
                                    <div className={`
                                        rounded-2xl bg-blue-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110
                                        ${viewMode === 'list' ? 'w-12 h-12 mr-6 flex-shrink-0' : 'w-14 h-14 mb-6'}
                                    `}>
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-black text-slate-800 mb-1 truncate">{team.name}</h3>
                                        <p className={`text-sm text-slate-500 ${viewMode === 'list' ? 'truncate' : 'line-clamp-2 h-10'}`}>
                                            {team.description || "설명이 없습니다."}
                                        </p>
                                    </div>

                                    <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'ml-4' : 'mt-6 pt-6 border-t border-slate-100'}`}>
                                        <button
                                            onClick={async () => {
                                                setSelectedTeam(team);
                                                const linkedSubData = await getProjectsByTeam(team.id);
                                                setLinkedProjectIds(linkedSubData.map(p => p.id));
                                                setIsLinkModalOpen(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all border border-slate-200"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            프로젝트
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </V2Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 팀 생성 모달 */}
            <V2Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="새 팀 만들기"
                subtitle="새로운 팀 정보를 입력하세요."
            >
                <div className="space-y-4">
                    <V2Input
                        label="팀 이름"
                        value={newName}
                        onChange={setNewName}
                        placeholder="예: 플랫폼 엔지니어링"
                        required
                    />
                    <V2Input
                        label="설명"
                        value={newDesc}
                        onChange={setNewDesc}
                        placeholder="팀에 대한 상세 설명을 입력하세요..."
                        rows={4}
                    />
                </div>
                <div className="mt-6 flex gap-3">
                    <V2Button
                        variant="secondary"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="flex-1"
                    >
                        취소
                    </V2Button>
                    <V2Button
                        onClick={handleCreateTeam}
                        disabled={!newName}
                        className="flex-1"
                    >
                        팀 생성
                    </V2Button>
                </div>
            </V2Modal>

            {/* 프로젝트 연결 모달 */}
            <V2Modal
                isOpen={isLinkModalOpen && !!selectedTeam}
                onClose={() => setIsLinkModalOpen(false)}
                title={`${selectedTeam?.name} - 프로젝트`}
                subtitle="팀에 할당된 프로젝트를 관리하세요."
                maxWidth="max-w-2xl"
            >
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                    {projects.map(project => {
                        const isLinked = linkedProjectIds.includes(project.id);
                        return (
                            <div
                                key={project.id}
                                className={`
                                    flex items-center justify-between p-4 rounded-2xl border transition-all
                                    ${isLinked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}
                                `}
                            >
                                <div>
                                    <h4 className={`font-bold text-sm ${isLinked ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {project.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">{project.description}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!selectedTeam) return;
                                        if (isLinked) {
                                            await unlinkProjectFromTeam(selectedTeam.id, project.id);
                                            setLinkedProjectIds(prev => prev.filter(id => id !== project.id));
                                            showToast("프로젝트 할당이 취소되었습니다.", "info");
                                        } else {
                                            await linkProjectToTeam(selectedTeam.id, project.id);
                                            setLinkedProjectIds(prev => [...prev, project.id]);
                                            showToast("프로젝트가 할당되었습니다.", "success");
                                        }
                                    }}
                                    className={`
                                        px-4 py-2 rounded-xl text-xs font-bold transition-all
                                        ${isLinked
                                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white'
                                            : 'bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white'}
                                    `}
                                >
                                    {isLinked ? '해제' : '할당'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6">
                    <V2Button
                        variant="secondary"
                        onClick={() => setIsLinkModalOpen(false)}
                        className="w-full justify-center"
                    >
                        닫기
                    </V2Button>
                </div>
            </V2Modal>
        </V2Layout>
    );
}
