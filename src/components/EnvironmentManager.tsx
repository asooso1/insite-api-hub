"use client";

import { useState } from "react";
import { Globe, Shield, Zap, Settings2, Save, MessageSquare, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { saveEnvironments } from "@/app/actions/save-env";
import { EnvConfig } from "@/lib/api-types";
import { motion, AnimatePresence } from "framer-motion";

interface EnvironmentManagerProps {
    initialConfigs: Record<'DEV' | 'STG' | 'PRD', EnvConfig>;
}

import { useToast } from "@/components/ui/Toast";

export function EnvironmentManager({ initialConfigs }: EnvironmentManagerProps) {
    const [activeEnv, setActiveEnv] = useState<'DEV' | 'STG' | 'PRD'>('DEV');
    const [configs, setConfigs] = useState<Record<'DEV' | 'STG' | 'PRD', EnvConfig>>(initialConfigs);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const handleUpdate = (field: keyof EnvConfig, value: string) => {
        setConfigs(prev => ({
            ...prev,
            [activeEnv]: { ...prev[activeEnv], [field]: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveEnvironments(configs);
            if (result.success) {
                showToast(result.message, "success");
            } else {
                showToast(result.message, "error");
            }
        } catch {
            showToast("저장 중 오류가 발생했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    서버 환경 설정
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "저장 중..." : "설정 저장"}
                </button>
            </div>


            <div className="flex p-1 bg-muted rounded-xl mb-6">
                <EnvTab active={activeEnv === 'DEV'} onClick={() => setActiveEnv('DEV')} icon={<Zap className="w-3.5 h-3.5" />} label="개발 (DEV)" />
                <EnvTab active={activeEnv === 'STG'} onClick={() => setActiveEnv('STG')} icon={<Shield className="w-3.5 h-3.5" />} label="검증 (STG)" />
                <EnvTab active={activeEnv === 'PRD'} onClick={() => setActiveEnv('PRD')} icon={<Globe className="w-3.5 h-3.5" />} label="운영 (PRD)" />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">서버 기본 URL (Base URL)</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono"
                        value={configs[activeEnv].baseUrl}
                        onChange={(e) => handleUpdate('baseUrl', e.target.value)}
                        placeholder="https://api.yourdomain.com"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">기본 인증 토큰 (Bearer Token)</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono"
                        value={configs[activeEnv].token}
                        onChange={(e) => handleUpdate('token', e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1..."
                    />
                </div>

                <div className="pt-4 border-t border-border/50">
                    <label className="text-sm font-bold flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        NHN Dooray 챗봇 연동
                    </label>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">수신 웹훅 URL (Incoming Webhook)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono"
                                value={configs[activeEnv].doorayWebhookUrl || ''}
                                onChange={(e) => handleUpdate('doorayWebhookUrl', e.target.value)}
                                placeholder="https://hook.dooray.com/..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EnvTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
        flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
        ${active ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}
      `}
        >
            {icon}
            {label}
        </button>
    );
}
