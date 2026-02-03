"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { updateEndpointStatus, type EndpointStatus } from "@/app/actions/endpoint-status";
import { motion, AnimatePresence } from "framer-motion";

interface EndpointStatusBadgeProps {
    status: EndpointStatus;
    endpointId: string;
    canEdit?: boolean;
    onStatusChange?: (status: EndpointStatus) => void;
}

const statusConfig: Record<EndpointStatus, { label: string; color: string; bg: string; border: string }> = {
    draft: {
        label: "Draft",
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-900/30",
        border: "border-slate-300 dark:border-slate-700"
    },
    review: {
        label: "Review",
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        border: "border-amber-300 dark:border-amber-700"
    },
    approved: {
        label: "Approved",
        color: "text-green-700 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-300 dark:border-green-700"
    },
    deprecated: {
        label: "Deprecated",
        color: "text-red-700 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
        border: "border-red-300 dark:border-red-700"
    }
};

export function EndpointStatusBadge({
    status,
    endpointId,
    canEdit = true,
    onStatusChange
}: EndpointStatusBadgeProps) {
    const [currentStatus, setCurrentStatus] = useState<EndpointStatus>(status);
    const [isOpen, setIsOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const config = statusConfig[currentStatus];

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleStatusChange = async (newStatus: EndpointStatus) => {
        if (newStatus === currentStatus || updating) return;

        setUpdating(true);
        try {
            // 사용자 ID는 실제 세션에서 가져와야 하지만, 여기서는 임시로 'system' 사용
            // TODO: 실제 로그인한 사용자 ID로 교체 필요
            const result = await updateEndpointStatus(endpointId, newStatus, 'system');

            if (result.success) {
                setCurrentStatus(newStatus);
                onStatusChange?.(newStatus);
                setIsOpen(false);
            } else {
                console.error('상태 변경 실패:', result.error);
                alert(`상태 변경 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.error('상태 변경 중 오류:', error);
            alert('상태 변경 중 오류가 발생했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    if (!canEdit) {
        // 읽기 전용 모드
        return (
            <span className={`
                px-2 py-1 rounded-full text-xs font-medium border
                ${config.bg} ${config.color} ${config.border}
            `}>
                {config.label}
            </span>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                disabled={updating}
                className={`
                    px-2 py-1 rounded-full text-xs font-medium border
                    flex items-center gap-1 transition-all
                    ${config.bg} ${config.color} ${config.border}
                    ${updating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
                `}
            >
                {config.label}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 z-50 min-w-[140px] bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(Object.entries(statusConfig) as [EndpointStatus, typeof statusConfig[EndpointStatus]][]).map(([statusKey, statusInfo]) => (
                            <button
                                key={statusKey}
                                onClick={() => handleStatusChange(statusKey)}
                                disabled={updating}
                                className={`
                                    w-full px-3 py-2 text-xs font-medium text-left
                                    flex items-center justify-between gap-2
                                    transition-colors
                                    ${statusKey === currentStatus
                                        ? `${statusInfo.bg} ${statusInfo.color}`
                                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                    }
                                    ${updating ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <span>{statusInfo.label}</span>
                                {statusKey === currentStatus && (
                                    <Check className="w-3 h-3" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
