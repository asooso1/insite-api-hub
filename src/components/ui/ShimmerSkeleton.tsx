'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShimmerSkeletonProps {
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
  pulse?: boolean // pulse 효과 추가
  shimmer?: boolean // shimmer 효과 (기본 true)
}

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function ShimmerSkeleton({
  width = '100%',
  height = 20,
  rounded = 'md',
  className,
  pulse = false,
  shimmer = true,
}: ShimmerSkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <motion.div
      className={cn(
        'bg-slate-200 dark:bg-slate-700',
        roundedClasses[rounded],
        shimmer && 'shimmer',
        className
      )}
      style={style}
      animate={
        pulse
          ? {
              opacity: [0.5, 1, 0.5],
            }
          : undefined
      }
      transition={
        pulse
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    />
  )
}

// 텍스트 라인 스켈레톤
export function SkeletonLine({ width = '100%' }: { width?: string | number }) {
  return <ShimmerSkeleton width={width} height={16} rounded="sm" />
}

// 아바타 스켈레톤
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <ShimmerSkeleton width={size} height={size} rounded="full" />
}

// 카드 스켈레톤
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-6 border border-border rounded-lg bg-card">
      <ShimmerSkeleton width="60%" height={24} rounded="sm" />
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          width={i === lines - 1 ? '40%' : '100%'}
          height={16}
          rounded="sm"
        />
      ))}
    </div>
  )
}

// 테이블 행 스켈레톤
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 items-center py-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          width={i === 0 ? '20%' : '15%'}
          height={16}
          rounded="sm"
        />
      ))}
    </div>
  )
}

// 통계 카드 스켈레톤
export function SkeletonStatCard() {
  return (
    <div className="p-6 border border-border rounded-lg bg-card space-y-3">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton width={120} height={20} rounded="sm" />
        <ShimmerSkeleton width={40} height={40} rounded="md" />
      </div>
      <ShimmerSkeleton width="50%" height={32} rounded="sm" />
      <ShimmerSkeleton width="80%" height={14} rounded="sm" pulse />
    </div>
  )
}
