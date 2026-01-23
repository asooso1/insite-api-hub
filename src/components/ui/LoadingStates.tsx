'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { shimmerVariants, pageVariants, glassClasses } from '@/lib/design-system';

// ============================================
// 1. SKELETON LOADING COMPONENTS
// ============================================

// Base Skeleton with shimmer effect
function SkeletonBase({ className = "" }: { className?: string }) {
    return (
        <motion.div
            variants={shimmerVariants}
            animate="animate"
            className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100
                dark:from-slate-800 dark:via-slate-700 dark:to-slate-800
                ${className}
            `}
            style={{
                backgroundSize: '200% 100%',
            }}
        />
    );
}

// Skeleton Card - for card layouts
export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 ${className}`}>
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                        <SkeletonBase className="h-6 w-3/4" />
                        <SkeletonBase className="h-4 w-1/2" />
                    </div>
                    <SkeletonBase className="h-10 w-10 rounded-full" />
                </div>
                <div className="space-y-2 pt-4">
                    <SkeletonBase className="h-3 w-full" />
                    <SkeletonBase className="h-3 w-5/6" />
                    <SkeletonBase className="h-3 w-4/6" />
                </div>
                <div className="flex gap-2 pt-4">
                    <SkeletonBase className="h-8 w-24 rounded-xl" />
                    <SkeletonBase className="h-8 w-24 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// Skeleton Table - for table layouts
export function SkeletonTable({ rows = 5, className = "" }: { rows?: number; className?: string }) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
            {/* Table Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 p-6">
                <div className="grid grid-cols-4 gap-4">
                    <SkeletonBase className="h-4 w-20" />
                    <SkeletonBase className="h-4 w-24" />
                    <SkeletonBase className="h-4 w-16" />
                    <SkeletonBase className="h-4 w-20" />
                </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="p-6">
                        <div className="grid grid-cols-4 gap-4 items-center">
                            <SkeletonBase className="h-4 w-32" />
                            <SkeletonBase className="h-4 w-40" />
                            <SkeletonBase className="h-6 w-16 rounded-full" />
                            <div className="flex gap-2">
                                <SkeletonBase className="h-8 w-8 rounded-lg" />
                                <SkeletonBase className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Skeleton List - for list layouts
export function SkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
                >
                    <div className="flex items-center gap-4">
                        <SkeletonBase className="h-12 w-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <SkeletonBase className="h-4 w-2/3" />
                            <SkeletonBase className="h-3 w-1/2" />
                        </div>
                        <SkeletonBase className="h-8 w-20 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Skeleton Stats - for statistics cards
export function SkeletonStats({ className = "" }: { className?: string }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <SkeletonBase className="h-4 w-24" />
                            <SkeletonBase className="h-10 w-10 rounded-2xl" />
                        </div>
                        <SkeletonBase className="h-8 w-32" />
                        <SkeletonBase className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Skeleton Text - for text content
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBase
                    key={i}
                    className={`h-4 ${
                        i === lines - 1 ? 'w-3/4' : 'w-full'
                    }`}
                />
            ))}
        </div>
    );
}

// ============================================
// 2. PAGE TRANSITION
// ============================================

export function PageTransition({
    children,
    className = ""
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// 3. LOADING OVERLAY
// ============================================

export function LoadingOverlay({
    message = "Loading...",
    show = true
}: {
    message?: string;
    show?: boolean;
}) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`
                            ${glassClasses.modal}
                            dark:bg-slate-900/90 dark:border-white/10
                            rounded-3xl p-8 min-w-[300px]
                        `}
                    >
                        <div className="flex flex-col items-center gap-6">
                            <LoadingSpinner size="lg" />
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {message}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Please wait a moment
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================
// 4. LOADING SPINNERS
// ============================================

export function LoadingSpinner({
    size = 'md',
    className = ""
}: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizes = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear" as const
            }}
            className={`
                ${sizes[size]}
                border-slate-300 border-t-blue-600
                dark:border-slate-700 dark:border-t-blue-400
                rounded-full
                ${className}
            `}
        />
    );
}

// Loading Dots - three dot animation
export function LoadingDots({ className = "" }: { className?: string }) {
    const dotVariants = {
        initial: { y: 0 },
        animate: {
            y: [-8, 0, -8],
            transition: {
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    variants={dotVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                />
            ))}
        </div>
    );
}

// Loading Pulse - pulsing circle animation
export function LoadingPulse({
    size = 60,
    className = ""
}: {
    size?: number;
    className?: string;
}) {
    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {/* Outer pulse rings */}
            {[0, 1].map((i) => (
                <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full bg-blue-600/30 dark:bg-blue-400/30"
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{
                        scale: [0, 1.5],
                        opacity: [0.8, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: "easeOut" as const
                    }}
                />
            ))}

            {/* Center circle */}
            <motion.div
                className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400"
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut" as const
                }}
            />
        </div>
    );
}

// ============================================
// 5. PROGRESS INDICATORS
// ============================================

// Progress Bar
export function ProgressBar({
    percent = 0,
    showLabel = true,
    className = ""
}: {
    percent?: number;
    showLabel?: boolean;
    className?: string;
}) {
    const clampedPercent = Math.min(100, Math.max(0, percent));

    return (
        <div className={`space-y-2 ${className}`}>
            {showLabel && (
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="text-blue-600 dark:text-blue-400">{Math.round(clampedPercent)}%</span>
                </div>
            )}

            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercent}%` }}
                    transition={{
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                />
            </div>
        </div>
    );
}

// Progress Circle
export function ProgressCircle({
    percent = 0,
    size = 60,
    strokeWidth = 4,
    showLabel = true,
    className = ""
}: {
    percent?: number;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
    className?: string;
}) {
    const clampedPercent = Math.min(100, Math.max(0, percent));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (clampedPercent / 100) * circumference;

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                />

                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    className="text-blue-600 dark:text-blue-400"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{
                        duration: 1,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>

            {/* Percentage label */}
            {showLabel && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                        {Math.round(clampedPercent)}%
                    </span>
                </motion.div>
            )}
        </div>
    );
}

// ============================================
// 6. COMPOSITE LOADING STATES
// ============================================

// Full page skeleton loader
export function PageSkeleton({
    type = 'dashboard',
    className = ""
}: {
    type?: 'dashboard' | 'table' | 'list';
    className?: string;
}) {
    return (
        <div className={`space-y-8 ${className}`}>
            {/* Page header skeleton */}
            <div className="space-y-3">
                <SkeletonBase className="h-8 w-1/3" />
                <SkeletonBase className="h-4 w-1/2" />
            </div>

            {/* Content based on type */}
            {type === 'dashboard' && (
                <>
                    <SkeletonStats />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </>
            )}

            {type === 'table' && <SkeletonTable rows={8} />}

            {type === 'list' && <SkeletonList count={6} />}
        </div>
    );
}

// Inline loading state for buttons
export function ButtonLoading({
    text = "Loading...",
    className = ""
}: {
    text?: string;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <LoadingSpinner size="sm" />
            <span>{text}</span>
        </div>
    );
}

// Content loading with message
export function ContentLoading({
    message = "Loading content...",
    className = ""
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
            <LoadingPulse size={80} className="mb-6" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {message}
            </p>
        </div>
    );
}
