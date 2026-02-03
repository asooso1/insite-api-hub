'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  MessageSquare,
  Reply,
  AtSign,
  AlertCircle,
  CheckCircle2,
  Webhook,
  FileEdit,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listContainerVariants, listItemVariants } from '@/lib/design-system';
import { GlassCard, GlassButton, GlassBadge } from '@/components/ui/LinearUI';
import {
  getNotificationSettings,
  updateNotificationSetting,
  toggleAllNotifications,
  type NotificationSetting,
} from '@/app/actions/notification-settings';
import { NotificationType } from '@/app/actions/notifications';

interface NotificationGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  types: {
    type: NotificationType;
    label: string;
    description: string;
  }[];
}

const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    id: 'comments',
    title: '댓글 & 멘션',
    description: '댓글, 답글, 멘션 알림',
    icon: MessageSquare,
    types: [
      {
        type: 'COMMENT',
        label: '댓글',
        description: '내가 구독한 API에 댓글이 달렸을 때',
      },
      {
        type: 'REPLY',
        label: '답글',
        description: '내 댓글에 답글이 달렸을 때',
      },
      {
        type: 'MENTION',
        label: '멘션',
        description: '누군가 나를 @멘션했을 때',
      },
    ],
  },
  {
    id: 'api',
    title: 'API 변경사항',
    description: 'API 수정 및 버전 변경 알림',
    icon: FileEdit,
    types: [
      {
        type: 'API_CHANGE',
        label: 'API 변경',
        description: '구독한 API의 스펙이 변경되었을 때',
      },
    ],
  },
  {
    id: 'qa',
    title: '질문 & 테스트',
    description: '질문 해결 및 테스트 결과 알림',
    icon: CheckCircle2,
    types: [
      {
        type: 'QUESTION_RESOLVED',
        label: '질문 해결',
        description: '내가 작성한 질문이 해결되었을 때',
      },
      {
        type: 'TEST_FAILED',
        label: '테스트 실패',
        description: 'API 테스트가 실패했을 때',
      },
    ],
  },
  {
    id: 'webhook',
    title: '웹훅 이벤트',
    description: 'GitHub 웹훅 이벤트 알림',
    icon: Webhook,
    types: [
      {
        type: 'WEBHOOK_EVENT',
        label: '웹훅 이벤트',
        description: 'GitHub 푸시, PR, 이슈 등 이벤트 발생 시',
      },
    ],
  },
];

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [allEnabled, setAllEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    // Mock user ID - in production, get from session
    const userId = 'current-user-id';
    const data = await getNotificationSettings(userId);
    setSettings(data);

    // Check if all are enabled
    const enabled = data.every((s) => s.enabled);
    setAllEnabled(enabled);

    setLoading(false);
  };

  const handleToggle = async (type: NotificationType) => {
    setUpdating(type);

    // Mock user ID
    const userId = 'current-user-id';

    // Find current setting
    const currentSetting = settings.find((s) => s.notification_type === type);
    const newEnabled = !currentSetting?.enabled;

    const result = await updateNotificationSetting(userId, type, newEnabled);

    if (result.success) {
      // Update local state
      setSettings((prev) => {
        const updated = prev.map((s) =>
          s.notification_type === type ? { ...s, enabled: newEnabled } : s
        );
        // If setting doesn't exist yet, add it
        if (!prev.find((s) => s.notification_type === type)) {
          updated.push({
            id: `temp-${type}`,
            user_id: userId,
            notification_type: type,
            enabled: newEnabled,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        return updated;
      });

      // Update all-enabled state
      const allOn = settings.every((s) =>
        s.notification_type === type ? newEnabled : s.enabled
      );
      setAllEnabled(allOn);
    }

    setUpdating(null);
  };

  const handleToggleAll = async () => {
    setUpdating('all');

    // Mock user ID
    const userId = 'current-user-id';
    const newEnabled = !allEnabled;

    const result = await toggleAllNotifications(userId, newEnabled);

    if (result.success) {
      setSettings((prev) =>
        prev.map((s) => ({ ...s, enabled: newEnabled }))
      );
      setAllEnabled(newEnabled);
    }

    setUpdating(null);
  };

  const isEnabled = (type: NotificationType): boolean => {
    const setting = settings.find((s) => s.notification_type === type);
    return setting?.enabled ?? true; // Default to enabled if not found
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            알림 설정
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          받고 싶은 알림 유형을 선택하세요
        </p>
      </div>

      {/* All On/Off Toggle */}
      <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {allEnabled ? (
              <Bell className="w-5 h-5 text-indigo-500" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {allEnabled ? '모든 알림 켜기' : '모든 알림 끄기'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                한 번에 모든 알림을 제어합니다
              </p>
            </div>
          </div>

          <GlassButton
            variant={allEnabled ? 'primary' : 'secondary'}
            size="md"
            onClick={handleToggleAll}
            disabled={updating === 'all'}
            icon={allEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          >
            {updating === 'all' ? '처리 중...' : allEnabled ? '모두 끄기' : '모두 켜기'}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          알림은 실시간으로 화면 우측 상단 벨 아이콘에 표시됩니다. 설정을 변경하면 즉시 적용됩니다.
        </p>
      </div>

      {/* Notification Groups */}
      <motion.div
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {NOTIFICATION_GROUPS.map((group) => (
          <motion.div key={group.id} variants={listItemVariants}>
            <GlassCard hover={false} className="dark:bg-slate-800/70 dark:border-white/10">
              <div className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-lg">
                    <group.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {group.description}
                    </p>
                  </div>
                </div>

                {/* Individual Settings */}
                <div className="space-y-2">
                  {group.types.map(({ type, label, description }) => {
                    const enabled = isEnabled(type);
                    const isUpdating = updating === type;

                    return (
                      <div
                        key={type}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                          enabled
                            ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200/50 dark:border-indigo-700/50"
                            : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/30 dark:border-slate-700/30"
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {label}
                            </span>
                            {enabled && (
                              <GlassBadge variant="success" size="sm">
                                켜짐
                              </GlassBadge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggle(type)}
                          disabled={isUpdating}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors disabled:opacity-50",
                            enabled
                              ? "bg-indigo-500"
                              : "bg-slate-300 dark:bg-slate-600"
                          )}
                        >
                          <motion.div
                            initial={false}
                            animate={{
                              x: enabled ? 20 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
        ))}
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
              현재{' '}
              <strong>
                {settings.filter((s) => s.enabled).length}개
              </strong>
              의 알림이 활성화되어 있습니다.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
