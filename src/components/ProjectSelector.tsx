"use client";

import { useState, useEffect } from "react";
import { Folder, Plus, Check, ChevronDown, Trash2, Github, ExternalLink, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/lib/api-types";
import { createProject, deleteProject } from "@/app/actions/project";

interface ProjectSelectorProps {
    projects: Project[];
    currentProjectId: string | null;
    onSelect: (id: string) => void;
}

export function ProjectSelector({ projects, currentProjectId, onSelect }: ProjectSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newGitUrl, setNewGitUrl] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newWebhook, setNewWebhook] = useState("");
    const [loading, setLoading] = useState(false);

    const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

    const handleCreate = async () => {
        if (!newName) return;
        setLoading(true);
        const res = await createProject(newName, newDesc, newWebhook);
        if (res) {
            onSelect(res.id);
            setIsModalOpen(false);
            setNewName("");
            setNewGitUrl("");
            setNewDesc("");
            setNewWebhook("");
        }
        setLoading(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("정말 이 프로젝트를 삭제하시겠습니까? 관련된 모든 API 데이터가 삭제됩니다.")) return;
        const res = await deleteProject(id);
        if (res.success) {
            // Logic to switch to another project if needed
        }
    };

    return (
        <div className="relative">
            {/* Project Display Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 group min-w-[200px]"
            >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Folder className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">현재 프로젝트</p>
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">
                        {currentProject?.name || "프로젝트 선택"}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 5, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 top-full w-[280px] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 z-50 overflow-hidden"
                        >
                            <div className="p-2 max-h-[400px] overflow-y-auto">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            onSelect(project.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${project.id === currentProjectId
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'hover:bg-slate-50 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${project.id === currentProjectId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            <Folder className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 text-left overflow-hidden">
                                            <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                                            {project.gitUrl && (
                                                <p className="text-[10px] text-slate-400 truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {project.gitUrl}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {project.doorayWebhookUrl && (
                                                <div className="p-1.5 text-blue-600 bg-blue-50 rounded-md" title="Dooray 알림 활성화됨">
                                                    <Share2 className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            {project.id === currentProjectId ? (
                                                <Check className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <button
                                                    onClick={(e) => handleDelete(e, project.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-all text-slate-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-2 border-t border-slate-200 bg-slate-50">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsModalOpen(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    새 프로젝트
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create Project Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">새 프로젝트 생성</h3>
                                    <p className="text-sm text-slate-500">관리할 새로운 API 프로젝트 정보를 입력하세요.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">프로젝트 이름</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="e.g., CSP WAS"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Git 저장소 URL</label>
                                        <div className="relative">
                                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={newGitUrl}
                                                onChange={(e) => setNewGitUrl(e.target.value)}
                                                placeholder="https://github.com/..."
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">설명</label>
                                        <textarea
                                            value={newDesc}
                                            onChange={(e) => setNewDesc(e.target.value)}
                                            placeholder="프로젝트에 대한 간단한 설명..."
                                            rows={2}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-slate-900"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Dooray 웹훅 URL (선택)</label>
                                        <div className="relative">
                                            <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={newWebhook}
                                                onChange={(e) => setNewWebhook(e.target.value)}
                                                placeholder="https://hook.dooray.com/..."
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={loading || !newName}
                                        className="flex-1 px-4 py-3 text-sm font-semibold bg-blue-600 text-white hover:opacity-90 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        프로젝트 생성
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
