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
    const [progressMessage, setProgressMessage] = useState("");
    const { showToast } = useToast();

    const handleImport = async () => {
        if (!gitUrl || !projectId) return;
        setLoading(true);
        setProgress(10);
        setProgressMessage('저장소 연결 확인 중...');

        try {
            // 단계별 진행 메시지와 함께 점진적 업데이트
            const progressSteps = [
                { progress: 20, message: '저장소 클론 중...', delay: 800 },
                { progress: 40, message: 'Spring Controller 스캔 중...', delay: 1500 },
                { progress: 60, message: 'DTO 구조 분석 중...', delay: 1200 },
                { progress: 75, message: 'API 엔드포인트 매핑 중...', delay: 1000 },
            ];

            const timers: NodeJS.Timeout[] = [];
            let accDelay = 0;
            for (const step of progressSteps) {
                accDelay += step.delay;
                timers.push(setTimeout(() => {
                    setProgress(step.progress);
                    setProgressMessage(step.message);
                }, accDelay));
            }

            const result = await importRepository(projectId, gitUrl, branch, gitToken || undefined);

            // 타이머 정리
            timers.forEach(t => clearTimeout(t));
            setProgress(100);
            setProgressMessage('완료!');

            if (result.success) {
                showToast("API 분석 및 가져오기에 성공했습니다. 페이지를 새로고침합니다.", "success");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(`오류 발생: ${result.message}`, "error");
                setProgress(0);
                setProgressMessage('');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
            showToast(`실패: ${message}`, "error");
            setProgress(0);
            setProgressMessage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-chart-2/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

            <div className="relative glass-panel p-6 rounded-2xl space-y-5 border-white/10 bg-card/80 backdrop-blur-2xl shadow-xl">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Globe className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-tighter text-foreground">자동 API 분석 엔진</h3>
                            <p className="text-[9px] text-muted-foreground font-bold tracking-widest opacity-60">Static Code Analysis v2.0</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="relative group/input">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Git Repository URL"
                            className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs transition-all placeholder:text-[10px] placeholder:font-bold placeholder:uppercase hover:border-primary/30"
                            value={gitUrl}
                            onChange={(e) => setGitUrl(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative group/input">
                            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Branch (main)"
                                className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-xs transition-all placeholder:text-[10px] placeholder:font-bold placeholder:uppercase hover:border-primary/30"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="relative group/input">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                            <input
                                type="password"
                                placeholder="Git Token (Private)"
                                className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-[10px] transition-all placeholder:text-[10px] placeholder:font-bold placeholder:uppercase hover:border-primary/30"
                                value={gitToken}
                                onChange={(e) => setGitToken(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleImport}
                    disabled={loading || !gitUrl || !projectId}
                    className="group/btn relative w-full overflow-hidden bg-primary text-primary-foreground font-black py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                    <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-tighter">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {loading ? "코드 분석 진행 중..." : "자동 분석 엔진 시작"}
                    </div>
                </button>

                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    {progressMessage || '저장소 클론 중'}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-primary">{Math.floor(progress)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary to-chart-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', stiffness: 50 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!projectId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-[10px] text-destructive font-black px-3 py-2 bg-destructive/5 rounded-xl border border-destructive/10 uppercase tracking-tight"
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>분석을 위해 프로젝트 선택이 필요합니다</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
