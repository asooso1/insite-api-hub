"use client";

import { useState } from "react";
import { Globe, GitBranch, Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { importRepository } from "@/app/actions/import-repo";
import { motion, AnimatePresence } from "framer-motion";

interface RepoImporterProps {
    projectId?: string;
}

import { useToast } from "@/components/ui/Toast";

export function RepoImporter({ projectId }: RepoImporterProps) {
    const [gitUrl, setGitUrl] = useState("");
    const [branch, setBranch] = useState("main");
    const [gitToken, setGitToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { showToast } = useToast();

    const handleImport = async () => {
        if (!gitUrl || !projectId) return;
        setLoading(true);
        setProgress(10);

        try {
            // Fake progress steps because the actual server action is a single call
            const timer = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + Math.random() * 15 : prev));
            }, 500);

            const result = await importRepository(projectId, gitUrl, branch, gitToken || undefined);

            clearInterval(timer);
            setProgress(100);

            if (result.success) {
                showToast("API 분석 및 가져오기에 성공했습니다. 페이지를 새로고침합니다.", "success");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(`오류 발생: ${result.message}`, "error");
                setProgress(0);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
            showToast(`실패: ${message}`, "error");
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">자동 API 분석기</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Git 저장소 URL (https://github.com/...)"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                        value={gitUrl}
                        onChange={(e) => setGitUrl(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="relative">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="브랜치 (예: main)"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button
                    onClick={handleImport}
                    disabled={loading || !gitUrl || !projectId}
                    className="bg-primary text-primary-foreground font-black py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-tighter"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Analysis"}
                </button>
            </div>

            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                    >
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                            <span>{progress < 40 ? 'Cloning Repository...' : progress < 80 ? 'Static Analysis...' : 'Syncing Database...'}</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', stiffness: 50 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!projectId && (
                <div className="flex items-center gap-2 text-xs text-destructive font-bold px-1 py-1 bg-destructive/5 rounded-lg border border-destructive/10 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>프로젝트를 먼저 선택하거나 생성해야 분석이 가능합니다.</span>
                </div>
            )}

            <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="password"
                    placeholder="Git 토큰 (Private Repository 전용)"
                    className="w-full pl-10 pr-4 py-2 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-[10px] transition-all"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    disabled={loading}
                />
            </div>
        </div>
    );
}
