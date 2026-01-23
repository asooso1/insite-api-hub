'use client';

import { useState, useEffect } from "react";
import { Folder, Plus, Trash2, Github, ExternalLink, Users, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/lib/api-types";
import { getProjects, createProject, deleteProject } from "@/app/actions/project";
import { Repository, getRepositories, createRepository } from "@/app/actions/repository";
import { Team, getTeams, getTeamsByProject, linkProjectToTeam, unlinkProjectFromTeam } from "@/app/actions/team";
import { V2Layout, V2Card, V2Button, V2Modal, V2Input } from "@/components/layout/V2Layout";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

interface ProjectsV2Props {
    embedded?: boolean; // true면 V2Layout 없이 컨텐츠만 렌더링
}

export function ProjectsV2({ embedded = false }: ProjectsV2Props) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [repositories, setRepositories] = useState<Record<string, Repository[]>>({});
    const [teams, setTeams] = useState<Team[]>([]);
    const [projectTeams, setProjectTeams] = useState<Record<string, Team[]>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
    const [isLinkTeamModalOpen, setIsLinkTeamModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [linkedTeamIds, setLinkedTeamIds] = useState<string[]>([]);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newWebhook, setNewWebhook] = useState("");
    const [newRepoName, setNewRepoName] = useState("");
    const [newRepoUrl, setNewRepoUrl] = useState("");
    const [newRepoTeamId, setNewRepoTeamId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pData, tData] = await Promise.all([
                getProjects(),
                getTeams()
            ]);
            setProjects(pData);
            setTeams(tData);

            const reposMap: Record<string, Repository[]> = {};
            const teamsMap: Record<string, Team[]> = {};

            await Promise.all(pData.map(async (p) => {
                const [r, t] = await Promise.all([
                    getRepositories(p.id),
                    getTeamsByProject(p.id)
                ]);
                reposMap[p.id] = r;
                teamsMap[p.id] = t as Team[];
            }));

            setRepositories(reposMap);
            setProjectTeams(teamsMap);
        } catch {
            showToast("데이터를 불러오는데 실패했습니다.", "error");
        }
        setLoading(false);
    };

    const handleCreateProject = async () => {
        if (!newName) return;
        try {
            await createProject(newName, newDesc, newWebhook);
            showToast("프로젝트가 생성되었습니다.", "success");
            setIsCreateModalOpen(false);
            setNewName("");
            setNewDesc("");
            setNewWebhook("");
            loadData();
        } catch {
            showToast("프로젝트 생성에 실패했습니다.", "error");
        }
    };

    const handleCreateRepo = async () => {
        if (!selectedProject || !newRepoName || !newRepoUrl) return;
        try {
            await createRepository(newRepoName, newRepoUrl, selectedProject.id, newRepoTeamId || undefined);
            showToast("저장소가 추가되었습니다.", "success");
            setIsRepoModalOpen(false);
            setNewRepoName("");
            setNewRepoUrl("");
            setNewRepoTeamId("");
            loadData();
        } catch {
            showToast("저장소 추가에 실패했습니다.", "error");
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm("프로젝트를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return;
        try {
            await deleteProject(id);
            showToast("프로젝트가 삭제되었습니다.", "success");
            loadData();
        } catch {
            showToast("프로젝트 삭제에 실패했습니다.", "error");
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const content = (
        <>
            {/* 임베디드 모드일 때 헤더 액션 */}
            {embedded && (
                <div className="flex justify-end mb-6">
                    <V2Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        프로젝트 추가
                    </V2Button>
                </div>
            )}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[300px] rounded-3xl bg-white border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <V2Card>
                    <EmptyState
                        icon={Folder}
                        title="프로젝트가 없습니다"
                        description="새 프로젝트를 추가하여 API 관리를 시작하세요."
                    />
                </V2Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <V2Card className="relative overflow-hidden group">
                                    {/* 배경 장식 */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full -translate-y-24 translate-x-24 group-hover:bg-blue-100 transition-colors duration-500" />

                                    <div className="relative z-10">
                                        {/* 헤더 */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                                                <Folder className="w-7 h-7" />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* 프로젝트 정보 */}
                                        <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-8 line-clamp-2 h-10">
                                            {project.description || "상세 설명이 등록되지 않았습니다."}
                                        </p>

                                        {/* 팀 & 저장소 섹션 */}
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* 팀 섹션 */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">팀</span>
                                                    <button
                                                        onClick={async () => {
                                                            setSelectedProject(project);
                                                            const linked = await getTeamsByProject(project.id);
                                                            setLinkedTeamIds(linked.map(t => t.id));
                                                            setIsLinkTeamModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-bold text-blue-600 hover:underline"
                                                    >
                                                        + 연결
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {projectTeams[project.id]?.length > 0 ? (
                                                        projectTeams[project.id].map(team => (
                                                            <div
                                                                key={team.id}
                                                                className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100 flex items-center gap-1"
                                                            >
                                                                <Users className="w-3 h-3" />
                                                                {team.name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">연결된 팀 없음</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 저장소 섹션 */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">저장소</span>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProject(project);
                                                            setIsRepoModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-bold text-blue-600 hover:underline"
                                                    >
                                                        + 추가
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {repositories[project.id]?.length > 0 ? (
                                                        repositories[project.id].slice(0, 2).map(repo => (
                                                            <a
                                                                key={repo.id}
                                                                href={repo.git_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all text-xs"
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <Github className="w-3.5 h-3.5 text-slate-400" />
                                                                    <span className="font-bold text-slate-700 truncate">{repo.name}</span>
                                                                </div>
                                                                <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                                                            <span className="text-[10px] text-slate-400">저장소 없음</span>
                                                        </div>
                                                    )}
                                                    {repositories[project.id]?.length > 2 && (
                                                        <p className="text-[10px] text-slate-400 text-center">
                                                            +{repositories[project.id].length - 2}개 더
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </V2Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 프로젝트 생성 모달 */}
            <V2Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="새 프로젝트"
                subtitle="새로운 프로젝트 정보를 입력하세요."
            >
                <div className="space-y-4">
                    <V2Input
                        label="프로젝트 이름"
                        value={newName}
                        onChange={setNewName}
                        placeholder="예: 결제 시스템"
                        required
                    />
                    <V2Input
                        label="설명"
                        value={newDesc}
                        onChange={setNewDesc}
                        placeholder="프로젝트에 대한 상세 설명..."
                        rows={3}
                    />
                    <V2Input
                        label="웹훅 URL (선택)"
                        value={newWebhook}
                        onChange={setNewWebhook}
                        placeholder="https://..."
                        type="url"
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
                        onClick={handleCreateProject}
                        disabled={!newName}
                        className="flex-1"
                    >
                        프로젝트 생성
                    </V2Button>
                </div>
            </V2Modal>

            {/* 저장소 추가 모달 */}
            <V2Modal
                isOpen={isRepoModalOpen && !!selectedProject}
                onClose={() => setIsRepoModalOpen(false)}
                title="저장소 추가"
                subtitle={`${selectedProject?.name}에 Git 저장소를 연결합니다.`}
            >
                <div className="space-y-4">
                    <V2Input
                        label="저장소 이름"
                        value={newRepoName}
                        onChange={setNewRepoName}
                        placeholder="예: payment-api"
                        required
                    />
                    <V2Input
                        label="Git URL"
                        value={newRepoUrl}
                        onChange={setNewRepoUrl}
                        placeholder="https://github.com/..."
                        type="url"
                        required
                    />
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                            팀 연결 (선택)
                        </label>
                        <select
                            value={newRepoTeamId}
                            onChange={e => setNewRepoTeamId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="">팀 없음 (프로젝트 전체)</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex gap-3">
                    <V2Button
                        variant="secondary"
                        onClick={() => setIsRepoModalOpen(false)}
                        className="flex-1"
                    >
                        취소
                    </V2Button>
                    <V2Button
                        onClick={handleCreateRepo}
                        disabled={!newRepoName || !newRepoUrl}
                        className="flex-1"
                    >
                        저장소 추가
                    </V2Button>
                </div>
            </V2Modal>

            {/* 팀 연결 모달 */}
            <V2Modal
                isOpen={isLinkTeamModalOpen && !!selectedProject}
                onClose={() => setIsLinkTeamModalOpen(false)}
                title="팀 연결"
                subtitle={`${selectedProject?.name}에 팀을 연결합니다.`}
            >
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                    {teams.map(team => {
                        const isLinked = linkedTeamIds.includes(team.id);
                        return (
                            <div
                                key={team.id}
                                className={`
                                    flex items-center justify-between p-4 rounded-2xl border transition-all
                                    ${isLinked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}
                                `}
                            >
                                <div>
                                    <h4 className={`font-bold text-sm ${isLinked ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {team.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">{team.description}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!selectedProject) return;
                                        if (isLinked) {
                                            await unlinkProjectFromTeam(team.id, selectedProject.id);
                                            setLinkedTeamIds(prev => prev.filter(id => id !== team.id));
                                            showToast("팀 연결이 해제되었습니다.", "info");
                                        } else {
                                            await linkProjectToTeam(team.id, selectedProject.id);
                                            setLinkedTeamIds(prev => [...prev, team.id]);
                                            showToast("팀이 연결되었습니다.", "success");
                                        }
                                        loadData();
                                    }}
                                    className={`
                                        px-4 py-2 rounded-xl text-xs font-bold transition-all
                                        ${isLinked
                                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white'
                                            : 'bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white'}
                                    `}
                                >
                                    {isLinked ? '해제' : '연결'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6">
                    <V2Button
                        variant="secondary"
                        onClick={() => setIsLinkTeamModalOpen(false)}
                        className="w-full justify-center"
                    >
                        닫기
                    </V2Button>
                </div>
            </V2Modal>
        </>
    );

    if (embedded) {
        return content;
    }

    return (
        <V2Layout
            activeTab="projects"
            title="프로젝트 관리"
            subtitle="API 연동을 위한 전사 프로젝트 자산을 한눈에 관리하세요."
            breadcrumb={["관리", "프로젝트 관리"]}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="프로젝트 검색..."
            headerActions={
                <V2Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    프로젝트 추가
                </V2Button>
            }
        >
            {content}
        </V2Layout>
    );
}
