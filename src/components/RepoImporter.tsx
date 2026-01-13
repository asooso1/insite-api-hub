"use client";

import { useState } from "react";
import { GitBranch, Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { importRepository } from "@/app/actions/import-repo";
import { motion, AnimatePresence } from "framer-motion";

interface RepoImporterProps {
    projectId?: string;
}

export function RepoImporter({ projectId }: RepoImporterProps) {
    const [gitUrl, setGitUrl] = useState("");
    const [branch, setBranch] = useState("main");
    const [gitToken, setGitToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleImport = async () => {
        if (!gitUrl || !projectId) return;
        setLoading(true);
        setStatus("저장소 분석 중...");

        try {
            const result = await importRepository(projectId, gitUrl, branch, gitToken || undefined);
            if (result.success) {
                setStatus("가져오기 성공! 페이지를 새로고침합니다...");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setStatus(`오류: ${result.message}`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
            setStatus(`실패: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Git 저장소 URL (https://github.com/...)"
                        className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        value={gitUrl}
                        onChange={(e) => setGitUrl(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="브랜치 (예: main)"
                        className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleImport}
                    disabled={loading || !gitUrl || !projectId}
                    className="bg-primary text-primary-foreground font-bold py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "API 분석 및 가져오기"}
                </button>
            </div>
            {!projectId && (
                <p className="text-xs text-destructive font-medium px-1">⚠️ 프로젝트를 먼저 선택하거나 생성해야 분석이 가능합니다.</p>
            )}

            <div className="relative">
                <input
                    type="password"
                    placeholder="Git 토큰 (프라이빗 저장소용, 선택사항)"
                    className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                    프라이빗 저장소의 경우 Personal Access Token을 입력하세요
                </p>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`
              p-3 rounded-xl border text-sm flex items-center gap-2
              ${status.includes('Error') || status.includes('Failed')
                                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                : 'bg-green-500/10 border-green-500/30 text-green-500'}
            `}
                    >
                        {status.includes('Error') || status.includes('Failed')
                            ? <AlertCircle className="w-4 h-4 shrink-0" />
                            : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {status}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
