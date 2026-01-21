"use client";

import { useState, useEffect } from "react";
import { Folder, Plus, Trash2, Github, ExternalLink, Search, Users, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/lib/api-types";
import { getProjects, createProject, deleteProject } from "@/app/actions/project";
import { Repository, getRepositories, createRepository, deleteRepository } from "@/app/actions/repository";
import { Team, getTeams, getTeamsByProject, linkProjectToTeam, unlinkProjectFromTeam } from "@/app/actions/team";
import { toast } from "react-hot-toast";

export default function ProjectsPage() {
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

            // Fetch repositories and teams for each project
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
        } catch (error) {
            toast.error("데이터 로드 실패");
        }
        setLoading(false);
    };

    const handleCreateProject = async () => {
        if (!newName) return;
        try {
            await createProject(newName, newDesc, newWebhook);
            toast.success("프로젝트 생성 성공");
            setIsCreateModalOpen(false);
            setNewName("");
            setNewDesc("");
            setNewWebhook("");
            loadData();
        } catch (error) {
            toast.error("프로젝트 생성 실패");
        }
    };

    const handleCreateRepo = async () => {
        if (!selectedProject || !newRepoName || !newRepoUrl) return;
        try {
            await createRepository(newRepoName, newRepoUrl, selectedProject.id, newRepoTeamId || undefined);
            toast.success("저장소 추가 성공");
            setIsRepoModalOpen(false);
            setNewRepoName("");
            setNewRepoUrl("");
            setNewRepoTeamId("");
            loadData();
        } catch (error) {
            toast.error("저장소 추가 실패");
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm("프로젝트를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return;
        try {
            await deleteProject(id);
            toast.success("프로젝트 삭제 완료");
            loadData();
        } catch (error) {
            toast.error("프로젝트 삭제 실패");
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Folder className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-5xl font-black tracking-tight">Projects</h1>
                        </div>
                        <p className="text-muted-foreground text-xl max-w-2xl">
                            API 연동을 위한 전사 프로젝트 자산을 한눈에 관리하고 탐색하세요.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="pl-12 pr-6 py-4 bg-secondary/50 border border-border rounded-2xl w-[350px] focus:w-[450px] transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0"
                        >
                            + Add Project
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[300px] rounded-[2.5rem] bg-secondary/30 animate-pulse border border-border" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {filteredProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-card border border-border rounded-[3rem] p-10 overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6">
                                            <Folder className="w-8 h-8" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="p-3 bg-secondary/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-black mb-4 group-hover:text-primary transition-colors">{project.name}</h3>
                                    <p className="text-muted-foreground text-lg mb-10 line-clamp-2 h-14">{project.description || "상세 설명이 등록되지 않았습니다."}</p>

                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Teams Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                <span>Teams</span>
                                                <button
                                                    onClick={async () => {
                                                        setSelectedProject(project);
                                                        const linked = await getTeamsByProject(project.id);
                                                        setLinkedTeamIds(linked.map(t => t.id));
                                                        setIsLinkTeamModalOpen(true);
                                                    }}
                                                    className="text-primary hover:underline"
                                                >
                                                    + Link
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {projectTeams[project.id]?.length > 0 ? (
                                                    projectTeams[project.id].map(team => (
                                                        <div key={team.id} className="px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/20 flex items-center gap-1.5 group/team">
                                                            <Users className="w-3 h-3" />
                                                            {team.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">No teams linked</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Repositories Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                <span>Repositories</span>
                                                <button
                                                    onClick={() => {
                                                        setSelectedProject(project);
                                                        setIsRepoModalOpen(true);
                                                    }}
                                                    className="text-primary hover:underline"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {repositories[project.id]?.length > 0 ? (
                                                    repositories[project.id].map(repo => (
                                                        <a
                                                            key={repo.id}
                                                            href={repo.git_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl hover:bg-secondary/60 transition-all border border-transparent hover:border-primary/20"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Github className="w-4 h-4 opacity-60" />
                                                                <span className="font-bold text-sm">{repo.name}</span>
                                                            </div>
                                                            <ExternalLink className="w-3 h-3 opacity-40" />
                                                        </a>
                                                    ))
                                                ) : (
                                                    <div className="py-4 text-center bg-secondary/20 rounded-2xl border border-dashed border-border text-muted-foreground text-[10px]">
                                                        No repos linked
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals are similar to TeamsPage - abbreviated for brevity but fully functional in final code */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setIsCreateModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] p-10">
                            <h2 className="text-3xl font-black mb-8">New Project</h2>
                            <div className="space-y-6">
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Project Name" className="w-full px-6 py-4 bg-secondary/50 rounded-2xl border border-border focus:border-primary outline-none" />
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" rows={4} className="w-full px-6 py-4 bg-secondary/50 rounded-2xl border border-border focus:border-primary outline-none resize-none" />
                                <button onClick={handleCreateProject} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:opacity-90">Create Project</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isRepoModalOpen && selectedProject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setIsRepoModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] p-10">
                            <h2 className="text-3xl font-black mb-2">Add Repository</h2>
                            <p className="text-muted-foreground mb-8">Link a new Git repository to {selectedProject.name}</p>
                            <div className="space-y-6">
                                <input value={newRepoName} onChange={e => setNewRepoName(e.target.value)} placeholder="Repository Name" className="w-full px-6 py-4 bg-secondary/50 rounded-2xl border border-border focus:border-primary outline-none" />
                                <input value={newRepoUrl} onChange={e => setNewRepoUrl(e.target.value)} placeholder="Git URL (HTTPS)" className="w-full px-6 py-4 bg-secondary/50 rounded-2xl border border-border focus:border-primary outline-none" />

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Optional: Associate with Team</label>
                                    <select
                                        value={newRepoTeamId}
                                        onChange={e => setNewRepoTeamId(e.target.value)}
                                        className="w-full px-6 py-4 bg-secondary/50 rounded-2xl border border-border focus:border-primary outline-none"
                                    >
                                        <option value="">No Team (Project wide)</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button onClick={handleCreateRepo} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:opacity-90">Add Repository</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isLinkTeamModalOpen && selectedProject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setIsLinkTeamModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] p-10">
                            <h2 className="text-3xl font-black mb-2">Link Teams</h2>
                            <p className="text-muted-foreground mb-8">Manage teams for {selectedProject.name}</p>

                            <div className="h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                {teams.map(team => {
                                    const isLinked = linkedTeamIds.includes(team.id);
                                    return (
                                        <div key={team.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isLinked ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-transparent'}`}>
                                            <div>
                                                <h4 className={`font-bold ${isLinked ? 'text-primary' : ''}`}>{team.name}</h4>
                                                <p className="text-xs text-muted-foreground">{team.description}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (isLinked) {
                                                        await unlinkProjectFromTeam(team.id, selectedProject.id);
                                                        setLinkedTeamIds(prev => prev.filter(id => id !== team.id));
                                                        toast.success("팀 연결이 해제되었습니다.");
                                                    } else {
                                                        await linkProjectToTeam(team.id, selectedProject.id);
                                                        setLinkedTeamIds(prev => [...prev, team.id]);
                                                        toast.success("팀이 연결되었습니다.");
                                                    }
                                                    loadData();
                                                }}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLinked ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                                            >
                                                {isLinked ? 'Unlink' : 'Link'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button onClick={() => setIsLinkTeamModalOpen(false)} className="w-full mt-8 py-4 bg-secondary rounded-2xl font-black">Close</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
