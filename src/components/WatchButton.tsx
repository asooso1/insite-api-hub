'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toggleWatch, isWatching } from '@/app/actions/watch';

interface WatchButtonProps {
    endpointId: string;
    userId: string | null;
    compact?: boolean;
}

/**
 * WatchButton 컴포넌트
 *
 * 엔드포인트 변경 알림을 구독/해제하는 버튼입니다.
 *
 * @param endpointId - 엔드포인트 ID
 * @param userId - 현재 사용자 ID
 * @param compact - 컴팩트 모드 (아이콘만 표시)
 */
export function WatchButton({ endpointId, userId, compact = false }: WatchButtonProps) {
    const [watching, setWatching] = useState(false);
    const [loading, setLoading] = useState(false);

    // 초기 상태 로드
    useEffect(() => {
        if (!userId) return;

        isWatching(endpointId, userId).then(result => {
            setWatching(result);
        });
    }, [endpointId, userId]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!userId) {
            alert('로그인이 필요합니다.');
            return;
        }

        setLoading(true);
        try {
            const result = await toggleWatch(endpointId, userId);
            if (result.success) {
                setWatching(!watching);
            } else {
                alert(result.message || '구독 상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Watch toggle failed:', error);
            alert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!userId) {
        return null;
    }

    return (
        <motion.button
            onClick={handleToggle}
            disabled={loading}
            className={`
                relative flex items-center gap-1.5
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${watching
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground hover:text-foreground'
                }
                ${compact
                    ? 'p-1 rounded-md hover:bg-muted/50'
                    : 'px-2 py-1 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30'
                }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={watching ? '알림 중지' : '알림 받기'}
        >
            <motion.div
                key={watching ? 'watching' : 'not-watching'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {watching ? (
                    <Eye className="w-4 h-4" />
                ) : (
                    <EyeOff className="w-4 h-4" />
                )}
            </motion.div>
            {!compact && (
                <span className="text-xs font-medium">
                    {watching ? '알림 중' : '알림 받기'}
                </span>
            )}
        </motion.button>
    );
}
