'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    BellOff,
    MessageSquare,
    FileEdit,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Clock,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listContainerVariants, listItemVariants } from '@/lib/design-system';
import { GlassCard, GlassButton, GlassBadge } from '@/components/ui/LinearUI';
import {
    getDigestSettings,
    updateDigestSettings,
    type DigestSettings,
} from '@/app/actions/digest';

interface Props {
    userId: string;
}

interface DigestOption {
    id: keyof DigestSettings;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const DIGEST_OPTIONS: DigestOption[] = [
    {
        id: 'include_comments',
        label: '새 댓글',
        description: '내가 구독한 API에 달린 새 댓글',
        icon: MessageSquare,
    },
    {
        id: 'include_api_changes',
        label: 'API 변경사항',
        description: 'API 스펙 수정, 추가, 삭제',
        icon: FileEdit,
    },
    {
        id: 'include_test_results',
        label: '테스트 실패',
        description: 'API 테스트 실패 알림',
        icon: AlertCircle,
    },
    {
        id: 'include_review_requests',
        label: '리뷰 요청',
        description: '변경사항 리뷰 요청 및 응답',
        icon: CheckCircle2,
    },
];

export default function DigestSettings({ userId }: Props) {
    const [settings, setSettings] = useState<DigestSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, [userId]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getDigestSettings(userId);
            setSettings(data);
        } catch (error) {
            console.error('Failed to load digest settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (updates: Partial<DigestSettings>) => {
        if (!settings) return;

        setSaving(true);
        try {
            const result = await updateDigestSettings(userId, updates);

            if (result.success) {
                setSettings({ ...settings, ...updates });
            }
        } catch (error) {
            console.error('Failed to update digest settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEnabled = async () => {
        if (!settings) return;
        await handleUpdateSettings({ enabled: !settings.enabled });
    };

    const handleFrequencyChange = async (frequency: 'daily' | 'weekly' | 'none') => {
        await handleUpdateSettings({ frequency });
    };

    const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await handleUpdateSettings({ send_time: e.target.value });
    };

    const handleToggleOption = async (option: keyof DigestSettings) => {
        if (!settings) return;
        await handleUpdateSettings({ [option]: !settings[option] });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    다이제스트 설정을 불러올 수 없습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        일일 다이제스트
                    </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    매일 정해진 시간에 업데이트 요약을 받아보세요
                </p>
            </div>

            {/* Enable/Disable Toggle */}
            <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings.enabled ? (
                            <Bell className="w-5 h-5 text-indigo-500" />
                        ) : (
                            <BellOff className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                다이제스트 {settings.enabled ? '활성화됨' : '비활성화됨'}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {settings.enabled
                                    ? '정기적으로 업데이트 요약을 받습니다'
                                    : '다이제스트 알림을 받지 않습니다'}
                            </p>
                        </div>
                    </div>

                    <GlassButton
                        variant={settings.enabled ? 'primary' : 'secondary'}
                        size="md"
                        onClick={handleToggleEnabled}
                        disabled={saving}
                        icon={settings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    >
                        {saving ? '처리 중...' : settings.enabled ? '비활성화' : '활성화'}
                    </GlassButton>
                </div>
            </GlassCard>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    다이제스트는 하루 또는 일주일 동안의 중요한 업데이트를 한 번에 요약해서 보여줍니다.
                    개별 알림이 너무 많을 때 유용합니다.
                </p>
            </div>

            {/* Frequency Selection */}
            <motion.div
                variants={listContainerVariants}
                initial="initial"
                animate="animate"
                className="space-y-4"
            >
                <motion.div variants={listItemVariants}>
                    <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        발송 빈도
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        얼마나 자주 다이제스트를 받을지 선택하세요
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {(['daily', 'weekly', 'none'] as const).map((freq) => (
                                    <button
                                        key={freq}
                                        onClick={() => handleFrequencyChange(freq)}
                                        disabled={saving}
                                        className={cn(
                                            'p-3 rounded-lg border text-sm font-medium transition-all',
                                            settings.frequency === freq
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-800'
                                        )}
                                    >
                                        {freq === 'daily' && '매일'}
                                        {freq === 'weekly' && '매주'}
                                        {freq === 'none' && '사용 안 함'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Send Time Selection */}
                {settings.frequency !== 'none' && (
                    <motion.div variants={listItemVariants}>
                        <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-lg">
                                        <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            발송 시간
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            매일 오전 9시에 다이제스트를 받습니다
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="time"
                                        value={settings.send_time}
                                        onChange={handleTimeChange}
                                        disabled={saving}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <GlassBadge variant="info" size="sm">
                                        {settings.frequency === 'daily' ? '매일' : '매주'} {settings.send_time}
                                    </GlassBadge>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Include Options */}
                {settings.frequency !== 'none' && (
                    <motion.div variants={listItemVariants}>
                        <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            포함할 내용
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            다이제스트에 포함할 업데이트를 선택하세요
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {DIGEST_OPTIONS.map((option) => {
                                        const enabled = settings[option.id] as boolean;
                                        const Icon = option.icon;

                                        return (
                                            <div
                                                key={option.id}
                                                className={cn(
                                                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                                                    enabled
                                                        ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200/50 dark:border-indigo-700/50'
                                                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/30 dark:border-slate-700/30'
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        className={cn(
                                                            'w-4 h-4',
                                                            enabled
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-slate-400'
                                                        )}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {option.label}
                                                            </span>
                                                            {enabled && (
                                                                <GlassBadge variant="success" size="sm">
                                                                    포함
                                                                </GlassBadge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleToggleOption(option.id)}
                                                    disabled={saving}
                                                    className={cn(
                                                        'relative w-11 h-6 rounded-full transition-colors disabled:opacity-50',
                                                        enabled
                                                            ? 'bg-indigo-500'
                                                            : 'bg-slate-300 dark:bg-slate-600'
                                                    )}
                                                >
                                                    <motion.div
                                                        initial={false}
                                                        animate={{
                                                            x: enabled ? 20 : 0,
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 500,
                                                            damping: 30,
                                                        }}
                                                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </motion.div>

            {/* Summary */}
            <GlassCard hover={false} className="dark:bg-emerald-800/10 dark:border-emerald-700/30">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                            설정 완료
                        </h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            {settings.enabled && settings.frequency !== 'none' ? (
                                <>
                                    <strong>{settings.frequency === 'daily' ? '매일' : '매주'}</strong>{' '}
                                    <strong>{settings.send_time}</strong>에 다이제스트를 받습니다.
                                </>
                            ) : (
                                '다이제스트가 비활성화되어 있습니다.'
                            )}
                        </p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
