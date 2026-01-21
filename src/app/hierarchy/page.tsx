"use client";

import { useState, useEffect } from "react";
import { Users, Folder, GitBranch } from "lucide-react";
import { Team, getTeams, getProjectsByTeam, getTeamProjectMappings } from "@/app/actions/team";
import { Project } from "@/lib/api-types";
import { getProjects } from "@/app/actions/project";
import { Repository, getRepositories } from "@/app/actions/repository";

export default function HierarchyPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [mappings, setMappings] = useState<{ teamId: string, projectId: string }[]>([]);
    const [viewType, setViewType] = useState<'team-first' | 'project-first'>('team-first');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [t, p, r, m] = await Promise.all([
                getTeams(),
                getProjects(),
                getRepositories(),
                getTeamProjectMappings()
            ]);
            setTeams(t);
            setProjects(p);
            setRepos(r);
            setMappings(m);
        } catch (error) {
            console.error("Failed to load hierarchy data:", error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter mb-4">Enterprise Assets</h1>
                        <p className="text-muted-foreground text-xl">조직의 모든 기술 자산을 시각화된 계층 구조로 탐색합니다.</p>
                    </div>

                    <div className="bg-secondary/50 p-1.5 rounded-[2rem] border border-border flex shadow-inner">
                        <button
                            onClick={() => setViewType('team-first')}
                            className={`flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-bold transition-all ${viewType === 'team-first' ? 'bg-background shadow-xl text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Users className="w-5 h-5" />
                            Team Focus
                        </button>
                        <button
                            onClick={() => setViewType('project-first')}
                            className={`flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-bold transition-all ${viewType === 'project-first' ? 'bg-background shadow-xl text-primary scale-105' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Folder className="w-5 h-5" />
                            Project Focus
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-secondary/30 animate-pulse rounded-3xl" />)}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {viewType === 'team-first' ? (
                            teams.map(team => {
                                const teamProjects = projects.filter(p =>
                                    mappings.some(m => m.teamId === team.id && m.projectId === p.id)
                                );
                                return (
                                    <div key={team.id} className="relative">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                <Users />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black">{team.name}</h2>
                                                <p className="text-muted-foreground font-medium">{team.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-10 border-l-2 border-border pl-10">
                                            {teamProjects.length > 0 ? teamProjects.map(project => (
                                                <div key={project.id} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl transition-all">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Folder className="w-5 h-5 text-primary" />
                                                        <span className="font-black text-lg">{project.name}</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {repos.filter(r => r.project_id === project.id).map(repo => (
                                                            <div key={repo.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl text-sm font-bold border border-transparent hover:border-primary/30 transition-all cursor-pointer">
                                                                <GitBranch className="w-4 h-4 opacity-50" />
                                                                {repo.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-span-full py-10 text-center text-muted-foreground italic bg-secondary/10 rounded-3xl border border-dashed border-border">
                                                    연결된 프로젝트가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            projects.map(project => {
                                const projectTeams = teams.filter(t =>
                                    mappings.some(m => m.teamId === t.id && m.projectId === project.id)
                                );
                                return (
                                    <div key={project.id} className="relative">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                <Folder />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black">{project.name}</h2>
                                                <p className="text-muted-foreground font-medium">{project.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-10 border-l-2 border-border pl-10">
                                            {projectTeams.length > 0 ? projectTeams.map(team => (
                                                <div key={team.id} className="bg-card border border-border rounded-[2rem] p-6 hover:shadow-xl transition-all">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Users className="w-5 h-5 text-primary" />
                                                        <span className="font-black text-lg">{team.name}</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {repos.filter(r => r.project_id === project.id && r.team_id === team.id).map(repo => (
                                                            <div key={repo.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl text-sm font-bold border border-transparent hover:border-primary/30 transition-all cursor-pointer">
                                                                <GitBranch className="w-4 h-4 opacity-50" />
                                                                {repo.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-span-full py-10 text-center text-muted-foreground italic bg-secondary/10 rounded-3xl border border-dashed border-border">
                                                    소속된 팀이 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
