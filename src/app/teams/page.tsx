"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Link as LinkIcon, LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Team, getTeams, createTeam, deleteTeam, linkProjectToTeam, unlinkProjectFromTeam, getProjectsByTeam } from "@/app/actions/team";
import { Project } from "@/lib/api-types";
import { getProjects } from "@/app/actions/project";
import { Repository, getRepositories } from "@/app/actions/repository";
import { toast } from "react-hot-toast";

export default function TeamsPage() {
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
        } catch (error) {
            toast.error("데이터를 불러오는데 실패했습니다.");
        }
        setLoading(false);
    }

    const handleCreateTeam = async () => {
        if (!newName) return;
        try {
            await createTeam(newName, newDesc);
            toast.success("팀이 생성되었습니다.");
            setIsCreateModalOpen(false);
            setNewName("");
            setNewDesc("");
            loadData();
        } catch (error) {
            toast.error("팀 생성에 실패했습니다.");
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (!confirm("정말 이 팀을 삭제하시겠습니까?")) return;
        try {
            await deleteTeam(id);
            toast.success("팀이 삭제되었습니다.");
            loadData();
        } catch (error) {
            toast.error("팀 삭제에 실패했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            Teams Management
                        </h1>
                        <p className="text-muted-foreground text-lg">팀을 구성하고 프로젝트를 할당하세요.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-secondary/50 p-1 rounded-xl border border-border flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            New Team
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-secondary/50 animate-pulse border border-border" />
                        ))}
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        <AnimatePresence mode="popLayout">
                            {teams.map((team) => (
                                <motion.div
                                    key={team.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`group relative bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 ${viewMode === 'list' ? 'flex items-center p-6' : 'p-8'}`}
                                >
                                    <div className={`rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${viewMode === 'list' ? 'w-12 h-12 mb-0 mr-6' : 'w-14 h-14'}`}>
                                        <Users className="w-7 h-7 text-primary" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{team.name}</h3>
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 h-10">{team.description || "설명이 없습니다."}</p>
                                    </div>

                                    <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'ml-auto' : 'mt-auto pt-6 border-t border-border/50'}`}>
                                        <button
                                            onClick={async () => {
                                                setSelectedTeam(team);
                                                const linkedSubData = await getProjectsByTeam(team.id);
                                                setLinkedProjectIds(linkedSubData.map(p => p.id));
                                                setIsLinkModalOpen(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-semibold transition-all"
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                            Projects
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10">
                                <h2 className="text-2xl font-black mb-2">Create New Team</h2>
                                <p className="text-muted-foreground mb-8">새로운 팀 정보를 입력하세요.</p>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Team Name</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="e.g., Platform Engineering"
                                            className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-lg font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Description</label>
                                        <textarea
                                            value={newDesc}
                                            onChange={(e) => setNewDesc(e.target.value)}
                                            placeholder="팀에 대한 상세 설명을 입력하세요..."
                                            rows={4}
                                            className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold bg-secondary hover:bg-secondary/80 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateTeam}
                                        disabled={!newName}
                                        className="flex-1 px-6 py-4 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                    >
                                        Create Team
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Link Projects Modal */}
            <AnimatePresence>
                {isLinkModalOpen && selectedTeam && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                            onClick={() => setIsLinkModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10">
                                <h2 className="text-2xl font-black mb-2">{selectedTeam.name} - Projects</h2>
                                <p className="text-muted-foreground mb-8">팀에 할당된 프로젝트를 관리하세요.</p>

                                <div className="h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40">
                                    {projects.map(project => {
                                        const isLinked = linkedProjectIds.includes(project.id);
                                        return (
                                            <div key={project.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${isLinked ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-transparent hover:border-primary/20'}`}>
                                                <div>
                                                    <h4 className={`font-bold ${isLinked ? 'text-primary' : ''}`}>{project.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{project.description}</p>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (isLinked) {
                                                            await unlinkProjectFromTeam(selectedTeam.id, project.id);
                                                            setLinkedProjectIds(prev => prev.filter(id => id !== project.id));
                                                            toast.success("프로젝트 할당이 취소되었습니다.");
                                                        } else {
                                                            await linkProjectToTeam(selectedTeam.id, project.id);
                                                            setLinkedProjectIds(prev => [...prev, project.id]);
                                                            toast.success("프로젝트가 할당되었습니다.");
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLinked ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                                                >
                                                    {isLinked ? 'Unassign' : 'Assign'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8">
                                    <button
                                        onClick={() => setIsLinkModalOpen(false)}
                                        className="w-full px-6 py-4 rounded-2xl font-bold bg-secondary hover:bg-secondary/80 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
